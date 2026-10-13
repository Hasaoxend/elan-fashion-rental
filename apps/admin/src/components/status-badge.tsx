const config: Record<string, { label: string; className: string }> = {
  pending: { label: 'Chờ xác nhận', className: 'bg-[#FFF4DE] text-[#D99A32]' },
  confirmed: { label: 'Đã xác nhận', className: 'bg-[#E8EEF8] text-[#3B6BB0]' },
  preparing: { label: 'Đang chuẩn bị', className: 'bg-[#F5EDE3] text-[#B8843F]' },
  delivering: { label: 'Đang giao', className: 'bg-[#E8EEF8] text-[#3B6BB0]' },
  picked_up: { label: 'Đã nhận', className: 'bg-[#E8F5EE] text-[#3D8B5F]' },
  returned: { label: 'Đã trả', className: 'bg-[#E8F5EE] text-[#3D8B5F]' },
  completed: { label: 'Hoàn tất', className: 'bg-[#ECECEC] text-[#6B6B6B]' },
  cancelled: { label: 'Đã hủy', className: 'bg-[#FDECEC] text-[#C94A4A]' },
  rejected: { label: 'Từ chối', className: 'bg-[#FDECEC] text-[#C94A4A]' },
  available: { label: 'Có sẵn', className: 'bg-[#E8F5EE] text-[#3D8B5F]' },
  reserved: { label: 'Đang giữ', className: 'bg-[#FFF4DE] text-[#D99A32]' },
  rented: { label: 'Đã thuê', className: 'bg-[#FDECEC] text-[#C94A4A]' },
  maintenance: { label: 'Bảo trì', className: 'bg-[#ECECEC] text-[#6B6B6B]' },
  inactive: { label: 'Ngừng kinh doanh', className: 'bg-[#ECECEC] text-[#6B6B6B]' },
  paid: { label: 'Đã thanh toán', className: 'bg-[#E8F5EE] text-[#3D8B5F]' },
  partial: { label: 'Thanh toán một phần', className: 'bg-[#FFF4DE] text-[#D99A32]' },
  refunded: { label: 'Đã hoàn tiền', className: 'bg-[#ECECEC] text-[#6B6B6B]' },
  failed: { label: 'Thất bại', className: 'bg-[#FDECEC] text-[#C94A4A]' },
};

export const statusLabel = (status: string) => config[status]?.label || status;

export function StatusBadge({ status }: { status: string }) {
  const item = config[status] || { label: status, className: 'bg-[#ECECEC] text-[#6B6B6B]' };
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${item.className}`}>{item.label}</span>;
}