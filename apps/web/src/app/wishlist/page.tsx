import Link from 'next/link';
import { Heart, ArrowRight } from 'lucide-react';

export default function WishlistPage() {
  return <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 min-h-[65vh] text-center"><Heart className="w-16 h-16 text-[#C89B6D] mx-auto mb-6" /><h1 className="font-display text-4xl mb-4">Danh sách yêu thích</h1><p className="text-[#6B6B6B] mb-8">Lưu lại những thiết kế bạn thích để đặt lịch nhanh hơn sau này.</p><Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-[#171717] text-white rounded-lg font-medium hover:bg-[#C89B6D] transition">Khám phá trang phục <ArrowRight className="w-4 h-4" /></Link></div>;
}