import type { Prisma, PrismaClient } from '@prisma/client';
import { ACTIVE_BOOKING_STATUSES } from '../constants';

type Tx = Prisma.TransactionClient | PrismaClient;

export interface AvailabilityParams {
  productId: string;
  startDate: Date;
  endDate: Date;
  quantity?: number;
  variantId?: string;
  /** Bỏ qua booking này khi kiểm tra — dùng cho reschedule / update */
  excludeBookingId?: string;
  /** Số ngày dọn dẹp giữa hai booking (buffer) */
  bufferDays?: number;
  /** Cờ nội bộ: không đệ quy khi đang quét ngày gợi ý. */
  suggestNextAvailable?: boolean;
}

export interface AvailabilityResult {
  available: boolean;
  /** Số lượng tối đa có thể đặt trong khoảng ngày yêu cầu */
  remainingQuantity: number;
  totalStock: number;
  reason?: 'NO_STOCK' | 'OVERLAP' | 'MAINTENANCE' | 'PRODUCT_INACTIVE' | 'INVENTORY_DAMAGED';
  /** Ngày gần nhất có thể thuê, gợi ý cho khách khi khoảng ngày đã bị chiếm */
  nextAvailableDate?: Date;
  conflicts: Array<{
    bookingId: string;
    bookingCode: string;
    startDate: Date;
    endDate: Date;
    quantity: number;
  }>;
  blockedByMaintenance: Array<{ id: string; startDate: Date; endDate: Date; reason: string }>;
}

/**
 * Công thức overlap có tính buffer:
 *   existing.start < requested.end + buffer  AND  existing.end + buffer > requested.start
 *
 * Đây là kiểm tra nửa mở [start, end): booking kết thúc đúng ngày booking mới bắt đầu
 * KHÔNG bị coi là trùng (khách trả buổi sáng, khách sau nhận buổi chiều cùng ngày),
 * nhưng buffer sẽ đẩy ngày bắt đầu hợp lệ lên nếu cần thời gian giặt/sửa.
 */
export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
  bufferDays = 0,
): boolean {
  const bufferMs = bufferDays * 86_400_000;
  return (
    aStart.getTime() < bEnd.getTime() + bufferMs && aEnd.getTime() + bufferMs > bStart.getTime()
  );
}

/**
 * Kiểm tra khả dụng của một sản phẩm trong khoảng ngày.
 * Đây là nguồn sự thật duy nhất — cả API public và luồng booking đều gọi hàm này
 * bên trong transaction, không tin dữ liệu frontend gửi lên.
 */
export async function checkAvailability(
  db: Tx,
  params: AvailabilityParams,
): Promise<AvailabilityResult> {
  const {
    productId,
    startDate,
    endDate,
    quantity = 1,
    variantId,
    excludeBookingId,
    bufferDays = 0,
    suggestNextAvailable = true,
  } = params;

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  });

  if (!product || !product.isActive) {
    return {
      available: false,
      remainingQuantity: 0,
      totalStock: 0,
      reason: 'PRODUCT_INACTIVE',
      conflicts: [],
      blockedByMaintenance: [],
    };
  }

  const selectedVariant = variantId ? product.variants.find((variant) => variant.id === variantId) : undefined;
  if (variantId && !selectedVariant) {
    return { available: false, remainingQuantity: 0, totalStock: 0, reason: 'NO_STOCK', conflicts: [], blockedByMaintenance: [] };
  }
  const totalStock = selectedVariant
    ? Math.max(0, selectedVariant.stockTotal - selectedVariant.stockBroken - selectedVariant.stockReservedForMaintenance)
    : product.variants.reduce(
      (sum, v) => sum + Math.max(0, v.stockTotal - v.stockBroken - v.stockReservedForMaintenance),
      0,
    );

  // Khi sản phẩm không khai báo biến thể, coi như tồn khả dụng là 1 đơn vị.
  const effectiveStock = totalStock > 0 ? totalStock : 1;

  const maintenance = await db.maintenance.findMany({
    where: {
      productId,
      status: { in: ['open', 'in_progress'] },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
  });

  if (maintenance.length > 0) {
    return {
      available: false,
      remainingQuantity: 0,
      totalStock: effectiveStock,
      reason: 'MAINTENANCE',
      conflicts: [],
      blockedByMaintenance: maintenance.map((m) => ({
        id: m.id,
        startDate: m.startDate,
        endDate: m.endDate,
        reason: m.reason,
      })),
    };
  }

  const bufferMs = bufferDays * 86_400_000;
  const activeItems = await db.bookingItem.findMany({
    where: {
      productId,
      ...(variantId ? { variantId } : {}),
      booking: {
        status: { in: [...ACTIVE_BOOKING_STATUSES] },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
    },
    include: { booking: true },
  });

  const conflicts = activeItems
    .filter((item) =>
      rangesOverlap(
        item.booking.pickupDate,
        item.booking.returnDate,
        startDate,
        endDate,
        bufferDays,
      ),
    )
    .map((item) => ({
      bookingId: item.bookingId,
      bookingCode: item.booking.bookingCode,
      startDate: item.booking.pickupDate,
      endDate: item.booking.returnDate,
      quantity: item.quantity,
    }));

  const bookedQuantity = conflicts.reduce((sum, c) => sum + c.quantity, 0);
  const remainingQuantity = Math.max(0, effectiveStock - bookedQuantity);

  if (remainingQuantity < quantity) {
    const nextAvailableDate = suggestNextAvailable
      ? await findNextAvailableDate(db, { ...params, quantity, variantId, from: endDate })
      : undefined;
    return {
      available: false,
      remainingQuantity,
      totalStock: effectiveStock,
      reason: conflicts.length > 0 ? 'OVERLAP' : 'NO_STOCK',
      conflicts,
      blockedByMaintenance: [],
      nextAvailableDate,
    };
  }

  // Buffer phía trước: booking tương lai gần có thể chặn ngày bắt đầu này.
  if (bufferMs > 0 || bufferDays > 0) {
    const shifting = await db.bookingItem.findMany({
      where: {
        productId,
        booking: {
          status: { in: [...ACTIVE_BOOKING_STATUSES] },
          pickupDate: { gt: startDate },
          ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
        },
      },
      include: { booking: true },
    });
    const backwardConflict = shifting.filter((item) =>
      rangesOverlap(item.booking.pickupDate, item.booking.returnDate, startDate, endDate, bufferDays),
    );
    if (backwardConflict.length > 0) {
      return {
        available: false,
        remainingQuantity: 0,
        totalStock: effectiveStock,
        reason: 'OVERLAP',
        conflicts: backwardConflict.map((item) => ({
          bookingId: item.bookingId,
          bookingCode: item.booking.bookingCode,
          startDate: item.booking.pickupDate,
          endDate: item.booking.returnDate,
          quantity: item.quantity,
        })),
        blockedByMaintenance: [],
      };
    }
  }

  return {
    available: true,
    remainingQuantity,
    totalStock: effectiveStock,
    conflicts: [],
    blockedByMaintenance: [],
  };
}

/**
 * Tìm ngày gần nhất có thể bắt đầu thuê, dùng để gợi ý khi khoảng ngày bị chiếm.
 * Quét tối đa `maxScanDays` ngày kể từ `from` để tránh vòng lặp vô hạn.
 */
export async function findNextAvailableDate(
  db: Tx,
  params: AvailabilityParams & { from: Date; maxScanDays?: number },
): Promise<Date | undefined> {
  const { productId, endDate, startDate, quantity = 1, variantId, excludeBookingId, from, maxScanDays = 60 } =
    params;
  const rentalLength = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000));

  let cursor = new Date(from.getTime());
  for (let i = 0; i < maxScanDays; i += 1) {
    const candidateEnd = new Date(cursor.getTime() + rentalLength * 86_400_000);
    const result = await checkAvailability(db, {
      productId,
      variantId,
      startDate: cursor,
      endDate: candidateEnd,
      quantity,
      excludeBookingId,
      suggestNextAvailable: false,
    });
    if (result.available) {
      return cursor;
    }
    cursor = new Date(cursor.getTime() + 86_400_000);
  }
  return undefined;
}

export interface CalendarDay {
  date: string;
  status: 'available' | 'pending' | 'rented' | 'maintenance';
  bookedQuantity: number;
  totalStock: number;
}

/**
 * Sinh dữ liệu lịch cho một sản phẩm trong khoảng ngày.
 * Trạng thái mỗi ngày:
 *   maintenance — có phiếu bảo trì bao phủ ngày đó
 *   rented      — toàn bộ tồn đã bị giữ bởi booking đã xác nhận trở lên
 *   pending     — có booking đang chờ xác nhận, hoặc còn một phần tồn
 *   available   — không có gì chặn
 */
export async function getProductCalendar(
  db: Tx,
  productId: string,
  variantId: string | undefined,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<CalendarDay[]> {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  });
  if (!product) return [];

  const totalStock = Math.max(
    1,
    product.variants.reduce(
      (sum, v) => sum + Math.max(0, v.stockTotal - v.stockBroken - v.stockReservedForMaintenance),
      0,
    ),
  );

  const maintenance = await db.maintenance.findMany({
    where: {
      productId,
      ...(variantId ? { variantId } : {}),
      status: { in: ['open', 'in_progress'] },
      startDate: { lt: rangeEnd },
      endDate: { gt: rangeStart },
    },
  });

  const items = await db.bookingItem.findMany({
    where: {
      productId,
      ...(variantId ? { variantId } : {}),
      booking: {
        status: { in: [...ACTIVE_BOOKING_STATUSES] },
        pickupDate: { lt: rangeEnd },
        returnDate: { gt: rangeStart },
      },
    },
    include: { booking: true },
  });

  const days: CalendarDay[] = [];
  const dayCount = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000);

  for (let i = 0; i < dayCount; i += 1) {
    const day = new Date(rangeStart.getTime() + i * 86_400_000);
    const dayEnd = new Date(day.getTime() + 86_400_000);

    const inMaintenance = maintenance.some(
      (m) => m.startDate.getTime() < dayEnd.getTime() && m.endDate.getTime() > day.getTime(),
    );

    const dayItems = items.filter(
      (item) =>
        item.booking.pickupDate.getTime() < dayEnd.getTime() &&
        item.booking.returnDate.getTime() > day.getTime(),
    );
    const bookedQuantity = dayItems.reduce((sum, item) => sum + item.quantity, 0);
    const hasPending = dayItems.some((item) => item.booking.status === 'pending');

    let status: CalendarDay['status'] = 'available';
    if (inMaintenance) {
      status = 'maintenance';
    } else if (bookedQuantity >= totalStock) {
      status = 'rented';
    } else if (bookedQuantity > 0 || hasPending) {
      status = 'pending';
    }

    days.push({
      date: day.toISOString().slice(0, 10),
      status,
      bookedQuantity,
      totalStock,
    });
  }

  return days;
}
