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
  return { status: response.status, body: await response.json().catch(() => ({})) };
}

async function main() {
  const failures: string[] = [];
  const pass = (message: string) => console.log(`PASS  ${message}`);
  const fail = (message: string) => { failures.push(message); console.log(`FAIL  ${message}`); };

  const list = await api('/products?pageSize=1');
  const product = list.body.items?.[0];
  const variant = product.variants.find((v: { size: string }) => v.size === 'L') ?? product.variants[0];

  const created = await api('/bookings', {
    method: 'POST',
    body: JSON.stringify({
      productId: product.id, variantId: variant.id, size: variant.size, color: 'default', quantity: 1,
      pickupDate: isoOffset(120), returnDate: isoOffset(123),
      fullName: 'Khách Audit', phone: '0912345678', email: `audit-${Date.now()}@example.com`,
      deliveryMethod: 'store_pickup', paymentMethod: 'cod',
    }),
  });
  if (created.status !== 201) { fail(`Không tạo được booking kiểm thử: ${JSON.stringify(created.body)}`); return; }
  const bookingId = created.body.booking.id;
  console.log(`\nBooking kiểm thử: ${created.body.booking.bookingCode}`);

  // Notification phải được ghi vào DB khi có đơn mới — không chỉ phát qua WebSocket.
  const notification = await prisma.notification.findFirst({ where: { entityType: 'booking', entityId: bookingId } });
  if (notification) pass('Notification "đơn hàng mới" được ghi vào database');
  else fail('Notification "đơn hàng mới" chưa được ghi vào database');

  // Đăng nhập admin và đổi trạng thái để kiểm tra audit log.
  const login = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'admin@example.com', password: 'Admin@123456' }) });
  const token = login.body.accessToken;
  if (!token) { fail('Không đăng nhập được admin'); return; }

  const confirmed = await api(`/bookings/${bookingId}/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: 'confirmed', note: 'Kiểm thử audit' }) });
  if (confirmed.status === 200) pass('Admin đổi trạng thái booking thành công');
  else fail(`Đổi trạng thái thất bại: ${JSON.stringify(confirmed.body)}`);

  const audit = await prisma.auditLog.findFirst({ where: { entityType: 'booking', entityId: bookingId, action: 'booking.status_changed' } });
  if (audit) pass('Audit log ghi nhận thay đổi trạng thái');
  else fail('Audit log không ghi nhận thay đổi trạng thái');

  const history = await prisma.bookingStatusHistory.count({ where: { bookingId } });
  if (history >= 2) pass(`Booking status history có ${history} bản ghi`);
  else fail(`Booking status history chỉ có ${history} bản ghi`);

  // Tra cứu công khai phải tìm được đơn bằng mã + số điện thoại.
  const lookup = await api(`/bookings/lookup/${created.body.booking.bookingCode}?phone=0912345678`);
  if (lookup.status === 200) pass('Tra cứu công khai bằng mã đơn và số điện thoại hoạt động');
  else fail(`Tra cứu công khai thất bại: ${JSON.stringify(lookup.body)}`);

  const wrongPhone = await api(`/bookings/lookup/${created.body.booking.bookingCode}?phone=0999999999`);
  if (wrongPhone.status === 404) pass('Tra cứu với số điện thoại sai bị từ chối');
  else fail(`Tra cứu với số điện thoại sai phải trả 404, nhận ${wrongPhone.status}`);

  // Không xác thực thì không được đọc danh sách booking.
  const unauthorized = await api('/bookings');
  if (unauthorized.status === 401) pass('Danh sách booking yêu cầu đăng nhập');
  else fail(`Danh sách booking phải yêu cầu đăng nhập, nhận ${unauthorized.status}`);

  // Dọn dữ liệu kiểm thử
  await prisma.auditLog.deleteMany({ where: { entityId: bookingId } });
  await prisma.bookingItem.deleteMany({ where: { bookingId } });
  await prisma.bookingStatusHistory.deleteMany({ where: { bookingId } });
  await prisma.notification.deleteMany({ where: { entityId: bookingId } });
  await prisma.booking.deleteMany({ where: { id: bookingId } });
  await prisma.customer.deleteMany({ where: { email: { startsWith: 'audit-' } } });

  console.log('');
  if (failures.length > 0) { console.log(`${failures.length} kiểm thử thất bại.`); process.exitCode = 1; }
  else console.log('Tất cả kiểm thử vận hành đều đạt.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());