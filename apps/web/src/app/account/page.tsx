import Link from 'next/link';
import { UserCircle, ArrowRight } from 'lucide-react';

export default function AccountPage() {
  return <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 min-h-[65vh] text-center"><UserCircle className="w-16 h-16 text-[#C89B6D] mx-auto mb-6" /><h1 className="font-display text-4xl mb-4">Tài khoản của bạn</h1><p className="text-[#6B6B6B] mb-8">Đăng nhập để xem lịch sử thuê, danh sách yêu thích và thông tin cá nhân.</p><Link href="/orders" className="inline-flex items-center gap-2 px-6 py-3 bg-[#171717] text-white rounded-lg font-medium hover:bg-[#C89B6D] transition">Tra cứu đơn hàng <ArrowRight className="w-4 h-4" /></Link></div>;
}
