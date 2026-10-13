import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, ShieldCheck, Truck, CalendarDays } from 'lucide-react';
import { getCategories, getProducts } from '@/lib/api';
import { ProductCard } from '@/components/product-card';

export default async function HomePage() {
  const [categoriesResult, productsResult] = await Promise.allSettled([getCategories(), getProducts({ pageSize: 8, sort: 'popular' })]);
  const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
  const products = productsResult.status === 'fulfilled' ? productsResult.value.items : [];

  return (
    <div>
      <section className="relative min-h-[620px] lg:min-h-[700px] flex items-center overflow-hidden bg-[#E9E5DF]">
        <Image src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2000&q=85" alt="Người mẫu thời trang" fill priority className="object-cover object-center" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl text-white">
            <p className="text-sm tracking-[0.3em] uppercase mb-6 text-white/80">Thuê thời trang cao cấp</p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.08] mb-6">Thuê trang phục cho những khoảnh khắc đặc biệt</h1>
            <p className="text-lg text-white/85 leading-relaxed mb-10 max-w-lg">Khám phá hàng trăm thiết kế thời trang cao cấp và đặt lịch thuê chỉ trong vài phút.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/collections" className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white text-[#171717] rounded-lg font-medium hover:bg-[#C89B6D] hover:text-white transition">Xem bộ sưu tập <ArrowRight className="w-4 h-4" /></Link>
              <Link href="/products" className="inline-flex items-center justify-center px-7 py-4 border border-white text-white rounded-lg font-medium hover:bg-white hover:text-[#171717] transition">Đặt lịch ngay</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div><p className="text-sm tracking-[0.2em] uppercase text-[#C89B6D] mb-3">Khám phá</p><h2 className="font-display text-4xl text-[#171717]">Bộ sưu tập của chúng tôi</h2></div>
            <Link href="/collections" className="inline-flex items-center gap-2 text-sm font-medium text-[#6B6B6B] hover:text-[#C89B6D] transition">Xem tất cả <ArrowRight className="w-4 h-4" /></Link>
          </div>
          {categories.length > 0 ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{categories.slice(0, 8).map((category, index) => <Link key={category.id} href={`/products?category=${category.slug}`} className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#E9E5DF]"><Image src={category.imageUrl || `https://images.unsplash.com/photo-${['1496747611176-843222e1e57c','1539109136881-3be0616acf4b','1515372039744-b8f02a3ae446','1483985988355-763728e1935b'][index % 4]}?auto=format&fit=crop&w=700&q=85`} alt={category.name} fill className="object-cover group-hover:scale-105 transition duration-500" sizes="(max-width: 768px) 50vw, 25vw" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" /><div className="absolute bottom-5 left-5 right-5 text-white"><h3 className="font-semibold text-lg mb-1">{category.name}</h3><p className="text-xs text-white/70">{category._count?.products || 0} thiết kế</p></div></Link>)}</div> : <div className="p-12 text-center bg-[#F8F7F5] rounded-2xl text-[#6B6B6B]">Chưa có bộ sưu tập nào.</div>}
        </div>
      </section>

      <section className="py-20 bg-[#F8F7F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10"><div><p className="text-sm tracking-[0.2em] uppercase text-[#C89B6D] mb-3">Được yêu thích</p><h2 className="font-display text-4xl text-[#171717]">Thiết kế nổi bật</h2></div><Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium text-[#6B6B6B] hover:text-[#C89B6D] transition">Khám phá tất cả <ArrowRight className="w-4 h-4" /></Link></div>
          {products.length > 0 ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="p-12 text-center bg-white rounded-2xl text-[#6B6B6B]">Không thể tải sản phẩm. Vui lòng thử lại sau.</div>}
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10"><p className="text-sm tracking-[0.2em] uppercase text-[#C89B6D] mb-3">Cách thuê</p><h2 className="font-display text-4xl text-[#171717]">Thuê đồ chỉ với 4 bước</h2></div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { photo: '1781269119690-8fa19aafe13d', title: 'Chọn thiết kế', text: 'Lọc theo dịp, size, màu và xem tình trạng còn trống theo ngày.' },
              { photo: '1766104797322-3826d7158c64', title: 'Đặt lịch & thử đồ', text: 'Đặt lịch online, ghé showroom thử và chỉnh dáng cho vừa vặn.' },
              { photo: '1707944145479-12755f0434d8', title: 'Nhận đồ', text: 'Nhận tại cửa hàng hoặc giao tận nơi, trang phục đã được làm sạch.' },
              { photo: '1632378464836-a6a856632552', title: 'Trả đồ', text: 'Trả đúng hẹn, cửa hàng kiểm tra, chăm sóc và hoàn cọc cho bạn.' },
            ].map((step, index) => (
              <li key={step.title}>
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#E9E5DF] mb-4">
                  <Image src={`https://images.unsplash.com/photo-${step.photo}?auto=format&fit=crop&w=700&q=85`} alt={step.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                  <span className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white text-[#171717] font-semibold flex items-center justify-center">{index + 1}</span>
                </div>
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pb-20 bg-white"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="grid grid-cols-1 md:grid-cols-3 gap-8"><div className="flex gap-4"><div className="w-12 h-12 rounded-full bg-[#F8F7F5] flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5 text-[#C89B6D]" /></div><div><h3 className="font-semibold mb-2">Thiết kế tuyển chọn</h3><p className="text-sm text-[#6B6B6B] leading-relaxed">Mỗi thiết kế được chọn lọc kỹ để bạn luôn xuất hiện với phong cách riêng.</p></div></div><div className="flex gap-4"><div className="w-12 h-12 rounded-full bg-[#F8F7F5] flex items-center justify-center shrink-0"><ShieldCheck className="w-5 h-5 text-[#C89B6D]" /></div><div><h3 className="font-semibold mb-2">Chăm sóc chuyên nghiệp</h3><p className="text-sm text-[#6B6B6B] leading-relaxed">Trang phục được vệ sinh và kiểm tra sau mỗi lần thuê.</p></div></div><div className="flex gap-4"><div className="w-12 h-12 rounded-full bg-[#F8F7F5] flex items-center justify-center shrink-0"><CalendarDays className="w-5 h-5 text-[#C89B6D]" /></div><div><h3 className="font-semibold mb-2">Đặt lịch linh hoạt</h3><p className="text-sm text-[#6B6B6B] leading-relaxed">Kiểm tra tình trạng và đặt lịch online bất cứ lúc nào.</p></div></div></div></div></section>

      <section className="relative py-24 overflow-hidden bg-[#171717] text-white"><div className="max-w-3xl mx-auto px-4 text-center relative z-10"><p className="text-sm tracking-[0.2em] uppercase text-[#C89B6D] mb-4">Bắt đầu phong cách của bạn</p><h2 className="font-display text-4xl sm:text-5xl mb-6">Sẵn sàng cho khoảnh khắc đáng nhớ?</h2><p className="text-white/65 mb-8">Đặt lịch thử trang phục tại showroom hoặc khám phá ngay bộ sưu tập online.</p><Link href="/products" className="inline-flex items-center gap-2 px-7 py-4 bg-[#C89B6D] text-white rounded-lg font-medium hover:bg-[#B88A5C] transition">Khám phá trang phục <ArrowRight className="w-4 h-4" /></Link></div></section>
    </div>
  );
}
