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

  // Sửa sản phẩm (như form admin gửi lại toàn bộ) phải giữ nguyên id biến thể đang có đơn thuê.
  const auth = { Authorization: `Bearer ${token}` };
  const detail = (await api(`/products/${product.id}`)).body;
  const payload = { ...detail, images: detail.images.map((i: { url: string; altText: string | null; sortOrder: number }) => ({ url: i.url, altText: i.altText, sortOrder: i.sortOrder })), variants: detail.variants.map((v: { size: string; color: string; stockTotal: number }) => ({ size: v.size, color: v.color, stockTotal: v.stockTotal })) };
  const updated = await api(`/products/${product.id}`, { method: 'PUT', headers: auth, body: JSON.stringify(payload) });
  const itemAfter = await prisma.bookingItem.findFirst({ where: { bookingId } });
  if (updated.status === 200 && itemAfter?.variantId === variant.id) pass('Sửa sản phẩm giữ nguyên biến thể gắn với đơn thuê');
  else fail(`Sửa sản phẩm làm mất liên kết biến thể: ${updated.status} ${JSON.stringify(updated.body).slice(0, 200)}`);

  const removeUsed = await api(`/products/${product.id}`, { method: 'PUT', headers: auth, body: JSON.stringify({ ...payload, variants: payload.variants.filter((v: { size: string }) => v.size !== variant.size) }) });
  if (removeUsed.status === 409) pass('Không cho xóa biến thể đã có đơn thuê');
  else fail(`Xóa biến thể đang có đơn phải trả 409, nhận ${removeUsed.status}`);

  const pastBooking = await api('/bookings', {
    method: 'POST',
    body: JSON.stringify({ productId: product.id, variantId: variant.id, size: variant.size, quantity: 1, pickupDate: isoOffset(-3), returnDate: isoOffset(-1), fullName: 'Khách Audit', phone: '0912345678', email: `audit-past-${Date.now()}@example.com` }),
  });
  if (pastBooking.status === 400) pass('Không cho đặt lịch với ngày nhận trong quá khứ');
  else fail(`Đặt lịch ngày quá khứ phải trả 400, nhận ${pastBooking.status}`);

  const users = await api('/admin/users', { headers: auth });
  if (users.status === 200 && !JSON.stringify(users.body).includes('passwordHash')) pass('API danh sách người dùng không trả passwordHash');
  else fail(`API người dùng lộ passwordHash hoặc lỗi: ${users.status}`);

  // Tài khoản khách: đăng ký bằng SĐT + email, đăng nhập bằng SĐT, đơn gắn vào tài khoản.
  const stamp = Date.now();
  const custEmail = `audit-acc-${stamp}@example.com`;
  const custPhone = `09${String(stamp).slice(-8)}`;
  const reg = await api('/auth/register', { method: 'POST', body: JSON.stringify({ fullName: 'Khách Có Tài Khoản', phone: custPhone, email: custEmail, password: 'Khach@12345' }) });
  if (reg.status === 201 && reg.body.user.role === 'CUSTOMER') pass('Khách tự đăng ký tài khoản bằng SĐT + email');
  else fail(`Đăng ký khách thất bại: ${reg.status} ${JSON.stringify(reg.body)}`);
  const phoneLogin = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: `+84 ${custPhone.slice(1)}`, password: 'Khach@12345' }) });
  if (phoneLogin.status === 200) pass('Khách đăng nhập được bằng số điện thoại');
  else fail(`Đăng nhập bằng SĐT thất bại: ${phoneLogin.status} ${JSON.stringify(phoneLogin.body)}`);
  const custAuth = { Authorization: `Bearer ${phoneLogin.body.accessToken}` };
  const own = await api('/bookings', {
    method: 'POST', headers: custAuth,
    body: JSON.stringify({ productId: product.id, variantId: variant.id, size: variant.size, quantity: 1, pickupDate: isoOffset(200), returnDate: isoOffset(202), fullName: 'Khách Có Tài Khoản', phone: custPhone, email: custEmail }),
  });
  const mine = await api('/bookings', { headers: custAuth });
  if (own.status === 201 && mine.body.items?.length === 1 && mine.body.items[0].id === own.body.booking.id) pass('Đơn đặt khi đăng nhập được gắn vào tài khoản, khách chỉ thấy đơn của mình');
  else fail(`Đơn của khách không đúng: ${own.status}, thấy ${mine.body.items?.length} đơn`);
  const cancelOwn = await api(`/bookings/${own.body.booking?.id}/cancel`, { method: 'POST', headers: custAuth, body: JSON.stringify({ reason: 'test' }) });
  if (cancelOwn.status === 200) pass('Khách tự hủy được đơn đang chờ xác nhận');
  else fail(`Khách hủy đơn thất bại: ${cancelOwn.status}`);

  // Nhân viên: được thanh toán + kho, không được quản lý tài khoản / cấu hình. Khách không vào được API admin.
  const staffLogin = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'nhanvien@example.com', password: 'Staff@123456' }) });
  const staffAuth = { Authorization: `Bearer ${staffLogin.body.accessToken}` };
  const [staffPayments, staffInventory, staffUsers, staffSettings, customerAdmin] = await Promise.all([
    api('/admin/payments', { headers: staffAuth }), api('/admin/products', { headers: staffAuth }),
    api('/admin/users', { headers: staffAuth }), api('/admin/settings', { headers: staffAuth }), api('/admin/payments', { headers: custAuth }),
  ]);
  if (staffPayments.status === 200 && staffInventory.status === 200 && staffUsers.status === 403 && staffSettings.status === 403 && customerAdmin.status === 403) pass('Phân quyền nhân viên: thanh toán + kho được, tài khoản/cấu hình bị chặn; khách bị chặn khỏi API admin');
  else fail(`Phân quyền sai: payments ${staffPayments.status}, kho ${staffInventory.status}, users ${staffUsers.status}, settings ${staffSettings.status}, khách ${customerAdmin.status}`);
  const staffList = await api('/admin/users', { headers: auth });
  if (staffList.body.items?.every((u: { role: { name: string } }) => u.role.name !== 'CUSTOMER')) pass('Quản lý tài khoản chỉ liệt kê tài khoản nội bộ');
  else fail('Danh sách tài khoản nhân viên lẫn tài khoản khách');

  const store = await api('/settings/public');
  if (store.status === 200 && store.body['store.name'] && store.body['store.address'] && !Object.keys(store.body).some((k) => !k.startsWith('store.'))) pass('API thông tin cửa hàng công khai chỉ trả key store.*');
  else fail(`API thông tin cửa hàng sai: ${store.status} ${JSON.stringify(store.body).slice(0, 120)}`);

  const ownId = own.body.booking?.id;
  if (ownId) {
    await prisma.inventoryTransaction.deleteMany({ where: { bookingId: ownId } });
    await prisma.auditLog.deleteMany({ where: { entityId: ownId } });
    await prisma.notification.deleteMany({ where: { entityId: ownId } });
    await prisma.booking.delete({ where: { id: ownId } });
  }
  await prisma.customer.deleteMany({ where: { email: custEmail } });
  await prisma.user.deleteMany({ where: { email: custEmail } });

  // Dọn dữ liệu kiểm thử
  await prisma.inventoryTransaction.deleteMany({ where: { bookingId } });
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