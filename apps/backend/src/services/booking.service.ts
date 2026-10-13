import type { CreateBookingInput } from '../validation';
import { prisma } from '../db';
import { AppError } from '../constants';
import { toUtcDate, diffInDays, startOfUtcToday } from '../lib/date';
import { checkAvailability } from '../lib/availability';
import { emitEvent } from '../realtime';

export async function createBooking(input: CreateBookingInput, customerId?: string) {
  const startDate = toUtcDate(input.pickupDate);
  const endDate = toUtcDate(input.returnDate);
  const rentalDays = diffInDays(startDate, endDate);

  if (rentalDays < 1) {
    throw new AppError('Ngày trả phải sau ngày nhận ít nhất 1 ngày.', 400, 'INVALID_DATE_RANGE');
  }
  if (startDate < startOfUtcToday()) {
    throw new AppError('Ngày nhận không được ở trong quá khứ.', 400, 'INVALID_DATE_RANGE');
  }

  // Bước 1: Bắt đầu transaction và lock booking:global để tuần tự hoá mọi thao tác tạo đơn.
  // SQLite không có SELECT ... FOR UPDATE, nhưng việc UPDATE một row bên trong transaction
  // buộc SQLite cấp write-lock, khiến transaction thứ hai phải chờ transaction đầu commit/rollback.
  const result = await prisma.$transaction(async (tx) => {
    // Lấy lock ngay — SQLite sẽ chặn transaction khác đang đọc lock này cho tới khi commit.
    await tx.lock.update({ where: { key: 'booking:global' }, data: { version: { increment: 1 } } });

    const product = await tx.product.findUnique({
      where: { id: input.productId },
      include: { variants: true, images: true },
    });
    if (!product || !product.isActive) {
      throw new AppError('Sản phẩm không tồn tại hoặc ngừng kinh doanh.', 404, 'PRODUCT_NOT_FOUND');
    }

    const variant = input.variantId
      ? product.variants.find((item) => item.id === input.variantId)
      : product.variants.find((item) => item.size === input.size && item.color === input.color);
    if (!variant || variant.size !== input.size || (input.variantId && variant.id !== input.variantId)) {
      throw new AppError('Kích thước hoặc biến thể trang phục không hợp lệ.', 400, 'INVALID_VARIANT');
    }

    // Bước 2: Kiểm tra availability trong transaction — chính là nguồn sự thật duy nhất.
    const availability = await checkAvailability(tx, {
      productId: input.productId,
      startDate,
      endDate,
      quantity: input.quantity,
      variantId: variant.id,
    });

    if (!availability.available) {
      const message =
        availability.reason === 'OVERLAP'
          ? `Trang phục đã được đặt trong khoảng ngày này. ${availability.nextAvailableDate ? `Ngày gần nhất có thể thuê: ${availability.nextAvailableDate.toISOString().slice(0, 10)}.` : ''}`
          : availability.reason === 'MAINTENANCE'
            ? 'Trang phục đang bảo trì trong khoảng ngày này.'
            : 'Không đủ tồn kho.';
      throw new AppError(message, 409, 'PRODUCT_NOT_AVAILABLE');
    }

    // Bước 3: Tính giá.
    let pricePerDay = product.pricePerDay;
    if (rentalDays >= 7 && product.price7Days) pricePerDay = Math.floor(product.price7Days / 7);
    else if (rentalDays >= 3 && product.price3Days) pricePerDay = Math.floor(product.price3Days / 3);

    const lineSubtotal = pricePerDay * rentalDays * input.quantity;
    const lineDeposit = product.depositAmount * input.quantity;
    const serviceFee = Math.round(lineSubtotal * product.serviceFeeRate);
    const shippingFee = input.deliveryMethod === 'home_delivery' ? 50000 : 0;
    const total = lineSubtotal + serviceFee + shippingFee;

    // Bước 4: Lấy hoặc tạo customer.
    let customer = customerId ? await tx.customer.findUnique({ where: { id: customerId } }) : null;
    if (!customer) {
      const existing = await tx.customer.findFirst({ where: { OR: [{ email: input.email }, { phone: input.phone }] } });
      customer = existing ?? (await tx.customer.create({
        data: { email: input.email, phone: input.phone, fullName: input.fullName, address: input.address },
      }));
    }

    // Bước 5: Sinh mã booking duy nhất.
    const now = new Date();
    const dateCode = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
    const count = await tx.booking.count({ where: { bookingCode: { startsWith: `BK${dateCode}` } } });
    const bookingCode = `BK${dateCode}${String(count + 1).padStart(4, '0')}`;

    // Bước 6: Tạo booking.
    const booking = await tx.booking.create({
      data: {
        bookingCode, customerId: customer.id, status: 'pending', paymentStatus: 'pending',
        pickupDate: startDate, returnDate: endDate, rentalDays,
        subtotal: lineSubtotal, serviceFee, shippingFee, deposit: lineDeposit, total,
        deliveryMethod: input.deliveryMethod, paymentMethod: input.paymentMethod,
        address: input.address, note: input.note,
        items: {
          create: {
            productId: input.productId, variantId: variant.id,
            size: input.size, color: input.color, quantity: input.quantity,
            pricePerDay, rentalDays, lineSubtotal, lineDeposit,
          },
        },
        history: { create: { toStatus: 'pending' } },
      },
      include: { items: { include: { product: { include: { images: true } } } }, customer: true },
    });

    // Bước 7: Ghi inventory transaction.
    await tx.inventoryTransaction.create({
      data: {
        variantId: variant.id, bookingId: booking.id, type: 'out',
        quantity: input.quantity, balanceAfter: variant.stockTotal - input.quantity,
        reason: `Booking ${bookingCode}`,
      },
    });

    return booking;
  });

  // Bước 8: Phát sự kiện realtime — chỉ sau khi transaction commit thành công.
  await prisma.notification.create({
    data: {
      type: 'new_booking',
      title: 'Đơn hàng mới',
      body: `${result.customer.fullName} vừa đặt ${result.items[0]?.product.name}`,
      entityType: 'booking',
      entityId: result.id,
      broadcast: true,
    },
  });

  emitEvent('booking.created', {
    bookingId: result.id,
    bookingCode: result.bookingCode,
    customerName: result.customer.fullName,
    productName: result.items[0]?.product.name,
    pickupDate: result.pickupDate,
    total: result.total,
    status: result.status,
  });

  emitEvent('notification.created', {
    type: 'new_booking',
    title: 'Đơn hàng mới',
    body: `${result.customer.fullName} vừa đặt ${result.items[0]?.product.name}`,
    entityType: 'booking',
    entityId: result.id,
  });

  return result;
}

export async function updateBookingStatus(bookingId: string, status: string, note?: string, actorId?: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { customer: true } });
  if (!booking) throw new AppError('Đơn hàng không tồn tại.', 404, 'BOOKING_NOT_FOUND');

  const updated = await prisma.$transaction(async (tx) => {
    await tx.bookingStatusHistory.create({
      data: { bookingId, fromStatus: booking.status, toStatus: status, note, changedById: actorId },
    });
    const result = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status,
        ...(status === 'cancelled' ? { cancelledAt: new Date(), cancelReason: note } : {}),
        ...(status === 'completed' ? { completedAt: new Date() } : {}),
      },
      include: { items: { include: { product: true } }, customer: true },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: 'booking.status_changed',
        entityType: 'booking',
        entityId: bookingId,
        changes: JSON.stringify({ before: { status: booking.status }, after: { status } }),
      },
    });
    return result;
  });

  await prisma.notification.create({
    data: {
      type: status === 'cancelled' ? 'cancellation' : 'system',
      title: 'Đơn hàng đã cập nhật',
      body: `${updated.bookingCode}: ${booking.status} → ${status}`,
      entityType: 'booking',
      entityId: updated.id,
      broadcast: true,
      ...(updated.customer.userId ? { userId: updated.customer.userId } : {}),
    },
  });

  emitEvent('booking.updated', {
    bookingId: updated.id,
    bookingCode: updated.bookingCode,
    status: updated.status,
    previousStatus: booking.status,
  }, ['admin', `user:${updated.customer.userId}`]);

  return updated;
}
