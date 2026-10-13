// Nhãn tiếng Việt cho các giá trị mã (enum) trả về từ backend.

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Admin',
  ADMIN: 'Quản lý',
  STAFF: 'Nhân viên',
  WAREHOUSE: 'Thủ kho',
  ACCOUNTANT: 'Kế toán',
  CUSTOMER: 'Khách hàng',
};

export const BOOKING_STATUSES = ['pending', 'confirmed', 'preparing', 'delivering', 'picked_up', 'returned', 'completed', 'cancelled', 'rejected'];

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  available: 'Có sẵn',
  reserved: 'Đang giữ',
  rented: 'Đang thuê',
  maintenance: 'Bảo trì',
  inactive: 'Ngừng kinh doanh',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'Tiền mặt (COD)',
  bank_transfer: 'Chuyển khoản',
  qr: 'Mã QR',
  ewallet: 'Ví điện tử',
  online: 'Thanh toán trực tuyến',
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  rental_fee: 'Phí thuê',
  deposit: 'Tiền cọc',
  shipping: 'Phí giao hàng',
  refund: 'Hoàn tiền',
};

export const PAYMENT_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Chờ thanh toán', className: 'bg-[#FFF4DE] text-[#D99A32]' },
  paid: { label: 'Đã thanh toán', className: 'bg-[#E8F5EE] text-[#3D8B5F]' },
  partial: { label: 'Thanh toán một phần', className: 'bg-[#FFF4DE] text-[#D99A32]' },
  refunded: { label: 'Đã hoàn tiền', className: 'bg-[#ECECEC] text-[#6B6B6B]' },
  failed: { label: 'Thất bại', className: 'bg-[#FDECEC] text-[#C94A4A]' },
  cancelled: { label: 'Đã hủy', className: 'bg-[#FDECEC] text-[#C94A4A]' },
};

export const MAINTENANCE_STATUS: Record<string, { label: string; className: string }> = {
  open: { label: 'Mới tạo', className: 'bg-[#FDECEC] text-[#C94A4A]' },
  in_progress: { label: 'Đang xử lý', className: 'bg-[#FFF4DE] text-[#D99A32]' },
  done: { label: 'Hoàn tất', className: 'bg-[#E8F5EE] text-[#3D8B5F]' },
  cancelled: { label: 'Đã hủy', className: 'bg-[#ECECEC] text-[#6B6B6B]' },
};

export const REALTIME_EVENT_LABELS: Record<string, string> = {
  'booking.created': 'Đơn hàng mới',
  'booking.updated': 'Cập nhật đơn hàng',
  'booking.confirmed': 'Đơn đã xác nhận',
  'booking.cancelled': 'Đơn đã hủy',
  'booking.returned': 'Đơn đã trả',
  'product.updated': 'Cập nhật trang phục',
  'inventory.updated': 'Cập nhật kho',
  'payment.updated': 'Cập nhật thanh toán',
  'notification.created': 'Thông báo mới',
};

export const SETTING_GROUP_LABELS: Record<string, string> = {
  general: 'Thông tin cửa hàng (hiển thị trên website)',
  rental: 'Chính sách thuê',
  payment: 'Thanh toán',
};

export const SETTING_LABELS: Record<string, string> = {
  'store.name': 'Tên thương hiệu',
  'store.legalName': 'Tên hộ kinh doanh',
  'store.tagline': 'Khẩu hiệu',
  'store.address': 'Địa chỉ cửa hàng',
  'store.phone': 'Số điện thoại',
  'store.email': 'Email liên hệ',
  'store.hours': 'Giờ mở cửa',
  'store.foundedYear': 'Năm thành lập',
  'store.about': 'Giới thiệu (trang Về chúng tôi)',
  'rental.bufferDays': 'Số ngày dọn dẹp giữa hai lượt thuê',
  'rental.minDays': 'Số ngày thuê tối thiểu',
  'rental.maxDays': 'Số ngày thuê tối đa',
  'payment.bankName': 'Ngân hàng',
  'payment.accountNumber': 'Số tài khoản',
  'payment.accountName': 'Chủ tài khoản',
  'payment.branch': 'Chi nhánh',
  'payment.qrUrl': 'URL ảnh mã QR',
};
