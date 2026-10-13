import { redirect } from 'next/navigation';

// Thuê theo lịch từng sản phẩm, không có giỏ hàng: đưa khách tới trang theo dõi đơn thuê.
export default function CartPage() {
  redirect('/orders');
}
