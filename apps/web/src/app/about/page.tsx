import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Heart, Leaf, Sparkles } from 'lucide-react';

export const metadata = { title: 'Về chúng tôi — Fashion Rental' };

export default function AboutPage() {
  return (
    <div>
      <section className="bg-white border-b border-[#E5E3DF]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-sm tracking-[0.2em] uppercase text-[#C89B6D] mb-4">Câu chuyện của chúng tôi</p>
          <h1 className="font-display text-5xl mb-6">Thời trang không nhất thiết phải sở hữu</h1>
          <p className="text-[#6B6B6B] text-lg leading-relaxed">Chúng tôi tin rằng mỗi khoảnh khắc quan trọng xứng đáng có một thiết kế hoàn hảo, và bạn không cần phải mua để tỏa sáng.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#E9E5DF]">
            <Image src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85" alt="Showroom" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
          <div>
            <h2 className="font-display text-3xl mb-5">Hành trình từ năm 2020</h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">Bắt đầu từ một showroom nhỏ tại Quận 1, chúng tôi mang đến giải pháp thuê trang phục cao cấp cho những dịp đặc biệt: dạ tiệc, lễ cưới, sự kiện, biểu diễn và cả những bộ ảnh đáng nhớ.</p>
            <p className="text-[#6B6B6B] leading-relaxed">Mỗi thiết kế đều được tuyển chọn kỹ lưỡng, vệ sinh chuyên nghiệp và kiểm tra tỉ mỉ sau mỗi lần thuê trước khi đến tay khách hàng tiếp theo.</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center"><div className="w-14 h-14 rounded-full bg-[#F5EDE3] flex items-center justify-center mx-auto mb-4"><Sparkles className="w-6 h-6 text-[#C89B6D]" /></div><h3 className="font-semibold mb-2">Tuyển chọn tinh tế</h3><p className="text-sm text-[#6B6B6B]">Hàng trăm thiết kế từ các thương hiệu và nhà thiết kế được chọn lọc.</p></div>
          <div className="text-center"><div className="w-14 h-14 rounded-full bg-[#F5EDE3] flex items-center justify-center mx-auto mb-4"><Heart className="w-6 h-6 text-[#C89B6D]" /></div><h3 className="font-semibold mb-2">Chăm sóc tận tâm</h3><p className="text-sm text-[#6B6B6B]">Đội ngũ tư vấn hỗ trợ bạn chọn đúng phom dáng và phong cách.</p></div>
          <div className="text-center"><div className="w-14 h-14 rounded-full bg-[#F5EDE3] flex items-center justify-center mx-auto mb-4"><Leaf className="w-6 h-6 text-[#C89B6D]" /></div><h3 className="font-semibold mb-2">Thời trang bền vững</h3><p className="text-sm text-[#6B6B6B]">Thuê thay vì mua giúp giảm lãng phí và bảo vệ môi trường.</p></div>
        </div>
      </section>

      <section className="bg-[#171717] text-white py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-4xl mb-5">Sẵn sàng tìm thiết kế dành cho bạn?</h2>
          <p className="text-white/65 mb-8">Khám phá bộ sưu tập và đặt lịch thuê chỉ trong vài phút.</p>
          <Link href="/products" className="inline-flex items-center gap-2 px-7 py-4 bg-[#C89B6D] rounded-lg font-medium hover:bg-[#B88A5C] transition">Khám phá trang phục <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section>
    </div>
  );
}