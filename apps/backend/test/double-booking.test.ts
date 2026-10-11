import 'dotenv/config';
import { prisma } from '../src/db';

const API = process.env.API_URL ?? 'http://localhost:4000/api';

function isoOffset(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

async function api(path: string, init?: RequestInit) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

// Dùng khoảng ngày xa (+120/+123) để không overlap với 25 booking demo từ seed,
// đảm bảo kiểm tra double-booking chỉ phụ thuộc vào lock backend.
const TEST_PICKUP = isoOffset(120);
const TEST_RETURN = isoOffset(123);

function bookingPayload(productId: string, variantId: string, size: string, quantity: number, tag: string) {
    return {
      productId,
      variantId,
      size,
    color: 'default',
    quantity,
    pickupDate: TEST_PICKUP,
    returnDate: TEST_RETURN,
    fullName: `Khách kiểm thử ${tag}`,
    phone: '0900000000',
    email: `test-${tag}-${Date.now()}@example.com`,
    deliveryMethod: 'store_pickup',
    paymentMethod: 'cod',
  };
}

async function main() {
  const failures: string[] = [];
  const pass = (message: string) => console.log(`PASS  ${message}`);
  const fail = (message: string) => { failures.push(message); console.log(`FAIL  ${message}`); };

  // 1. Sản phẩm có tồn kho để kiểm tra
  const list = await api('/products?pageSize=1');
  const product = list.body.items?.[0];
  if (!product) { fail('Không lấy được sản phẩm từ API'); return; }
  console.log(`\nSản phẩm kiểm thử: ${product.name} (${product.id})`);

  const variant = product.variants.find((v: { size: string }) => v.size === 'M') ?? product.variants[0];
  const stock = Math.max(0, variant.stockTotal - variant.stockBroken - variant.stockReservedForMaintenance);
  console.log(`Tồn kho khả dụng: ${stock}`);

  // 2. Availability trước khi đặt phải là available
  const before = await api(`/products/${product.id}/availability?startDate=${TEST_PICKUP}&endDate=${TEST_RETURN}&quantity=1&variantId=${variant.id}`);
  if (before.body.available === true) pass('Availability báo còn hàng trước khi đặt');
  else fail(`Availability phải available, nhận ${JSON.stringify(before.body)}`);

  // 3. Hai request đặt lịch chạy ĐỒNG THỜI, mỗi request chiếm toàn bộ tồn kho.
  //    Chỉ một request được thành công; request còn lại phải bị 409 PRODUCT_NOT_AVAILABLE.
  //    Đây là bằng chứng thực tế cho yêu cầu chống double booking ở tầng backend.
  console.log('\nGửi 2 request đặt lịch đồng thời, mỗi request chiếm toàn bộ tồn kho...');
  const [first, second] = await Promise.all([
    api('/bookings', { method: 'POST', body: JSON.stringify(bookingPayload(product.id, variant.id, variant.size, stock, 'A')) }),
    api('/bookings', { method: 'POST', body: JSON.stringify(bookingPayload(product.id, variant.id, variant.size, stock, 'B')) }),
  ]);

  const results = [first, second];
  const successes = results.filter((r) => r.status === 201);
  const conflicts = results.filter((r) => r.status === 409);

  console.log(`  Kết quả: ${results.map((r) => `${r.status}${r.body?.code ? ` (${r.body.code})` : ''}`).join(', ')}`);

  if (successes.length === 1) pass('Đúng 1 trong 2 request đồng thời được tạo booking');
  else fail(`Phải có đúng 1 booking thành công, nhận ${successes.length}`);

  if (conflicts.length === 1 && conflicts[0].body?.code === 'PRODUCT_NOT_AVAILABLE') {
    pass('Request còn lại bị từ chối với mã PRODUCT_NOT_AVAILABLE');
  } else {
    fail(`Request còn lại phải bị 409 PRODUCT_NOT_AVAILABLE, nhận ${JSON.stringify(conflicts[0]?.body ?? results)}`);
  }

  // 4. Không được có double booking trong database
  const bookingIds = successes.map((r) => r.body.booking.id).filter(Boolean);
  const overlapping = await prisma.bookingItem.groupBy({
    by: ['bookingId'],
    where: {
      productId: product.id,
      booking: {
        status: { in: ['pending', 'confirmed', 'preparing', 'delivering', 'picked_up', 'returned'] },
        pickupDate: { lt: new Date(`${TEST_RETURN}T00:00:00.000Z`) },
        returnDate: { gt: new Date(`${TEST_PICKUP}T00:00:00.000Z`) },
      },
    },
    _sum: { quantity: true },
  });
  const totalBooked = overlapping.reduce((sum, row) => sum + (row._sum.quantity ?? 0), 0);
  const activeBookings = await prisma.booking.count({ where: { id: { in: bookingIds }, status: { not: 'cancelled' } } });
  console.log(`  Booking đã ghi vào DB: ${activeBookings}; tổng số lượng đang giữ cho sản phẩm: ${totalBooked}/${stock}`);

  if (activeBookings === 1) pass('Database chỉ ghi nhận 1 booking');
  else fail(`Database phải có đúng 1 booking, nhận ${activeBookings}`);

  if (totalBooked <= stock) pass(`Tổng số lượng giữ (${totalBooked}) không vượt tồn kho (${stock})`);
  else fail(`Overbooking: giữ ${totalBooked} > tồn ${stock}`);

  // 5. Availability sau khi đặt phải báo hết hàng
  const after = await api(`/products/${product.id}/availability?startDate=${TEST_PICKUP}&endDate=${TEST_RETURN}&quantity=1&variantId=${variant.id}`);
  if (after.body.available === false) pass('Availability sau khi đặt báo không còn hàng');
  else fail(`Availability sau khi đặt phải là false, nhận ${JSON.stringify(after.body)}`);

  // 6. Khoảng ngày không trùng vẫn phải đặt được
  const laterPayload = { ...bookingPayload(product.id, variant.id, variant.size, 1, 'C'), pickupDate: isoOffset(40), returnDate: isoOffset(43) };
  const later = await api('/bookings', { method: 'POST', body: JSON.stringify(laterPayload) });
  if (later.status === 201) pass('Khoảng ngày không trùng vẫn đặt được bình thường');
  else fail(`Khoảng ngày không trùng phải đặt được, nhận ${later.status} ${JSON.stringify(later.body)}`);

  // Dọn dữ liệu test để không ảnh hưởng demo
  const created = [first, second, later].filter((r) => r.status === 201).map((r) => r.body.booking.id);
  await prisma.bookingItem.deleteMany({ where: { bookingId: { in: created } } });
  await prisma.booking.deleteMany({ where: { id: { in: created } } });
  await prisma.customer.deleteMany({ where: { email: { startsWith: 'test-' } } });

  console.log('');
  if (failures.length > 0) {
    console.log(`${failures.length} kiểm thử thất bại.`);
    process.exitCode = 1;
  } else {
    console.log('Tất cả kiểm thử chống double booking đều đạt.');
  }
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
