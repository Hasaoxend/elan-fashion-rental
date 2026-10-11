# Database ERD

```mermaid
erDiagram
  ROLE ||--o{ USER : assigns
  ROLE ||--o{ ROLE_PERMISSION : grants
  PERMISSION ||--o{ ROLE_PERMISSION : includes
  USER ||--o| CUSTOMER : profile
  USER ||--o{ REFRESH_TOKEN : owns
  USER ||--o{ AUDIT_LOG : creates

  CATEGORY ||--o{ PRODUCT : contains
  PRODUCT ||--o{ PRODUCT_IMAGE : has
  PRODUCT ||--o{ PRODUCT_VARIANT : offers
  PRODUCT ||--o{ BOOKING_ITEM : rented_as
  PRODUCT ||--o{ MAINTENANCE : receives
  PRODUCT ||--o{ REVIEW : receives
  PRODUCT_VARIANT ||--o{ BOOKING_ITEM : selected
  PRODUCT_VARIANT ||--o{ INVENTORY_TRANSACTION : tracks

  CUSTOMER ||--o{ BOOKING : places
  CUSTOMER ||--o{ REVIEW : writes
  CUSTOMER ||--o{ WISHLIST_ITEM : saves
  PRODUCT ||--o{ WISHLIST_ITEM : saved_as

  BOOKING ||--o{ BOOKING_ITEM : contains
  BOOKING ||--o{ BOOKING_STATUS_HISTORY : changes
  BOOKING ||--o{ PAYMENT : has
  BOOKING ||--o{ INVENTORY_TRANSACTION : reserves
  PAYMENT ||--o{ PAYMENT_TRANSACTION : records

  USER ||--o{ BOOKING_STATUS_HISTORY : changes
```

## Entity Notes

| Entity | Purpose | Important indexes |
|---|---|---|
| `User`, `Role`, `Permission` | Authentication/RBAC | user.email, role.name, permission.code |
| `Customer` | Hồ sơ khách | email, phone, createdAt |
| `Product`, `ProductVariant` | Catalog + tồn theo size/màu | sku, categoryId, status, productId+size+color |
| `Booking`, `BookingItem` | Đơn thuê và dòng sản phẩm | bookingCode, customerId, pickupDate+returnDate, productId |
| `BookingStatusHistory` | Timeline trạng thái | bookingId |
| `Payment`, `PaymentTransaction` | Thanh toán/hoàn tiền | bookingId, status |
| `Maintenance` | Khoảng thời gian bảo trì | productId, startDate+endDate |
| `InventoryTransaction` | Ledger kho | variantId, bookingId, createdAt |
| `Notification` | Realtime notification center | userId+isRead, createdAt |
| `AuditLog` | Truy vết hành động admin | entityType+entityId, actorId, createdAt |
| `Lock` | SQLite transaction serialization | key |

## Double Booking Safety

SQLite không hỗ trợ `SELECT ... FOR UPDATE`, nên hệ thống dùng row `Lock(key = booking:global)`:

1. Transaction cập nhật row lock đầu tiên.
2. SQLite cấp write lock và tuần tự hóa các transaction đặt lịch cạnh tranh.
3. Transaction chạy `checkAvailability` theo đúng variant.
4. Nếu còn hàng thì tạo `Booking` + `BookingItem` + `InventoryTransaction` trong cùng transaction.
5. Nếu trùng, rollback và trả `PRODUCT_NOT_AVAILABLE`.
6. Chỉ sau khi commit thành công mới phát Socket.IO event.

Khi chuyển sang PostgreSQL, có thể thay row lock bằng advisory lock hoặc `SELECT FOR UPDATE` theo inventory row mà không đổi API contract.