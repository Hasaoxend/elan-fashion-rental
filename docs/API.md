# API Documentation

Base URL: `http://localhost:4000/api`

Tất cả response lỗi có dạng:

```json
{ "code": "ERROR_CODE", "message": "Mô tả lỗi" }
```

Xác thực dùng JWT: gửi header `Authorization: Bearer <accessToken>`.
Access token hết hạn sau 30 phút; dùng `POST /auth/refresh` với `refreshToken` để cấp mới.

---

## Auth

### POST /auth/login
Đăng nhập.

Body:
```json
{ "email": "admin@example.com", "password": "Admin@123456" }
```
Trả về: `{ user, mustChangePassword, accessToken, refreshToken }`

### POST /auth/register
Đăng ký tài khoản khách hàng.

Body: `{ fullName, email, phone, password }` (password ≥ 8 ký tự)

### POST /auth/change-password  🔒
Body: `{ currentPassword, newPassword }`. Thu hồi toàn bộ refresh token cũ.

### GET /auth/me  🔒
Trả về người dùng hiện tại kèm `permissions` và `customerId`.

### POST /auth/refresh
Body: `{ refreshToken }`. Trả về access token mới.

---

## Products

### GET /products
Query: `page`, `pageSize`, `category` (slug), `minPrice`, `maxPrice`, `size`, `color`, `status`, `brand`, `search`, `sort` (`newest` | `price_asc` | `price_desc` | `popular` | `rating`).

```json
{
  "items": [{ "id": "...", "sku": "DRESS-0001", "name": "...", "pricePerDay": 450000, "availableStock": 7, "images": [], "variants": [] }],
  "total": 50, "page": 1, "pageSize": 12, "totalPages": 5
}
```

### GET /products/meta
Trả về `{ categories, brands, sizes }` để dựng bộ lọc.

### GET /products/:id
Chi tiết sản phẩm kèm ảnh, biến thể, đánh giá.

### GET /products/:id/availability
**Điểm kiểm tra khả dụng realtime.**

Query: `startDate` (YYYY-MM-DD), `endDate`, `quantity`, `variantId` (tùy chọn).

```json
{
  "available": false,
  "remainingQuantity": 0,
  "totalStock": 3,
  "reason": "OVERLAP",
  "nextAvailableDate": "2026-10-25T00:00:00.000Z",
  "conflicts": [{ "bookingCode": "BK202610070012", "startDate": "...", "endDate": "...", "quantity": 2 }],
  "blockedByMaintenance": []
}
```

`reason`: `OVERLAP` | `MAINTENANCE` | `NO_STOCK` | `PRODUCT_INACTIVE` | `INVENTORY_DAMAGED`.

### GET /products/:id/calendar
Query: `from`, `to`. Trả về mảng ngày với `status`: `available` | `pending` | `rented` | `maintenance`.

---

## Bookings

### POST /bookings
Tạo đơn thuê. Không bắt buộc đăng nhập (khách vãng lai được phép).

Body:
```json
{
  "productId": "...", "variantId": "...", "size": "M", "color": "default", "quantity": 1,
  "pickupDate": "2026-10-20", "returnDate": "2026-10-23",
  "fullName": "Nguyễn Văn A", "phone": "0901234567", "email": "a@example.com",
  "address": "...", "note": "...",
  "deliveryMethod": "store_pickup", "paymentMethod": "cod"
}
```

Trả về `201` với `{ booking }`.

Lỗi quan trọng:
- `409 PRODUCT_NOT_AVAILABLE` — khoảng ngày bị trùng hoặc hết tồn.
- `400 INVALID_VARIANT` — size/biến thể không khớp sản phẩm.
- `400 INVALID_DATE_RANGE` — ngày trả không sau ngày nhận.

> Toàn bộ kiểm tra khả dụng và tạo đơn diễn ra trong một transaction có lock, không tin dữ liệu client.

### GET /bookings  🔒
Danh sách đơn. Khách hàng chỉ thấy đơn của mình; admin thấy tất cả. Query: `page`, `pageSize`, `status`, `customerId`.

### GET /bookings/:id  🔒
Chi tiết đơn kèm `items`, `history`, `payments`.

### GET /bookings/lookup/:bookingCode?phone=...
Tra cứu công khai. Yêu cầu đúng **cả** mã đơn và số điện thoại.

### PATCH /bookings/:id/status  🔒 (SUPER_ADMIN | ADMIN | STAFF)
Body: `{ status, note }`. Ghi `BookingStatusHistory`, `AuditLog` và phát event realtime.

### POST /bookings/:id/cancel
Hủy đơn. Khách đã đăng nhập cần đúng chủ đơn; khách vãng lai phải gửi kèm `phone`.

---

## Admin

Tất cả endpoint dưới đây yêu cầu đăng nhập với role quản trị.

### GET /admin/dashboard
```json
{
  "kpis": {
    "revenueToday": 12500000, "bookingsToday": 28, "renting": 87,
    "upcomingReturns": 16, "available": 324, "newCustomers": 42, "pendingBookings": 5
  },
  "recentBookings": []
}
```

### GET /admin/bookings
Query: `from`, `to`, `status`. Dùng cho Calendar và bảng đơn hàng.

### GET /admin/customers
Query: `search` (tên / email / số điện thoại).

### GET /admin/notifications
Danh sách thông báo broadcast và thông báo cá nhân.

### PATCH /admin/notifications/:id/read
Đánh dấu đã đọc.

---

## WebSocket (Socket.IO)

URL: `http://localhost:4000` (mặc định namespace).

Client subscribe room:
```js
socket.emit('subscribe', { rooms: ['admin'] });
socket.emit('subscribe', { rooms: ['user:<userId>', 'product:<productId>'] });
```

### Server events
| Event | Payload |
|---|---|
| `booking.created` | `{ bookingId, bookingCode, customerName, productName, total, status }` |
| `booking.updated` | `{ bookingId, bookingCode, status, previousStatus }` |
| `booking.confirmed` / `booking.cancelled` / `booking.returned` | như trên |
| `payment.updated` | `{ bookingId, paymentStatus }` |
| `inventory.updated` | `{ variantId, balance }` |
| `product.updated` | `{ productId, status }` |
| `notification.created` | `{ type, title, body, entityType, entityId }` |

### Rooms
`admin` — toàn bộ sự kiện vận hành. `user:{id}` — thông báo cá nhân. `product:{id}`, `booking:{id}` — theo dõi một đối tượng.

---

## Availability Engine

`checkAvailability(db, { productId, startDate, endDate, quantity, variantId, excludeBookingId, bufferDays })`

Quy tắc:
- Overlap: `existing.start < requested.end + buffer AND existing.end + buffer > requested.start`.
- Booking `cancelled` / `rejected` không tính.
- Maintenance `open` / `in_progress` chặn toàn bộ khoảng ngày.
- Tồn kho tính theo biến thể: `stockTotal − stockBroken − stockReservedForMaintenance`.
- Khi không khả dụng, trả `nextAvailableDate` bằng cách quét tối đa 60 ngày.

### Mã lỗi
`BAD_REQUEST`, `INVALID_INPUT`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `PRODUCT_NOT_FOUND`, `BOOKING_NOT_FOUND`, `PRODUCT_NOT_AVAILABLE`, `INVALID_VARIANT`, `INVALID_DATE_RANGE`, `INVALID_STATUS`, `DUPLICATE`, `INTERNAL_ERROR`.