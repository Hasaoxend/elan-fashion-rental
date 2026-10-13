import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Heart, Leaf, Sparkles, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { getStoreInfo } from '@/lib/api';

export const metadata = { title: 'Về chúng tôi' };

const photo = (id: string, w = 1000) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=85`;

const gallery = [
  { id: '1546213290-e1b492ab3eee', caption: 'Showroom trưng bày' },
  { id: '1781269119690-8fa19aafe13d', caption: 'Góc váy cưới' },
  { id: '1766104797322-3826d7158c64', caption: 'Thử đồ và chỉnh dáng' },
  { id: '1718184021018-d2158af6b321', caption: 'Sửa đo theo số đo' },
  { id: '1633655442168-c6ef0ed2f984', caption: 'Vest may đo' },
  { id: '1632378464836-a6a856632552', caption: 'Kiểm tra, chăm sóc sau mỗi lần thuê' },
];

export default async function AboutPage() {
  const store = await getStoreInfo();

  return (
    <div>
      <section className="bg-white border-b border-[#E5E3DF]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-sm tracking-[0.2em] uppercase text-[#C89B6D] mb-4">{store['store.legalName']}</p>
          <h1 className="font-display text-5xl mb-6">Thời trang không nhất thiết phải sở hữu</h1>
          <p className="text-[#6B6B6B] text-lg leading-relaxed">{store['store.tagline']}</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#E9E5DF]">
            <Image src={photo('1441986300917-64674bd600d8', 1200)} alt={`Cửa hàng ${store['store.name']}`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
          <div>
            <h2 className="font-display text-3xl mb-5">Hành trình từ năm {store['store.foundedYear']}</h2>
            <p className="text-[#6B6B6B] leading-relaxed whitespace-pre-line">{store['store.about']}</p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="font-display text-3xl mb-8">Bên trong {store['store.name']}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {gallery.map(({ id, caption }) => (
            <figure key={id} className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#E9E5DF]">
              <Image src={photo(id, 800)} alt={caption} fill className="object-cover group-hover:scale-105 transition duration-500" sizes="(max-width: 768px) 50vw, 33vw" />
              <figcaption className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white text-sm">{caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center"><div className="w-14 h-14 rounded-full bg-[#F5EDE3] flex items-center justify-center mx-auto mb-4"><Sparkles className="w-6 h-6 text-[#C89B6D]" /></div><h3 className="font-semibold mb-2">Tuyển chọn tinh tế</h3><p className="text-sm text-[#6B6B6B]">Hàng trăm thiết kế từ các thương hiệu và nhà thiết kế được chọn lọc.</p></div>
          <div className="text-center"><div className="w-14 h-14 rounded-full bg-[#F5EDE3] flex items-center justify-center mx-auto mb-4"><Heart className="w-6 h-6 text-[#C89B6D]" /></div><h3 className="font-semibold mb-2">Chăm sóc tận tâm</h3><p className="text-sm text-[#6B6B6B]">Đội ngũ tư vấn hỗ trợ bạn chọn đúng phom dáng và phong cách.</p></div>
          <div className="text-center"><div className="w-14 h-14 rounded-full bg-[#F5EDE3] flex items-center justify-center mx-auto mb-4"><Leaf className="w-6 h-6 text-[#C89B6D]" /></div><h3 className="font-semibold mb-2">Thời trang bền vững</h3><p className="text-sm text-[#6B6B6B]">Thuê thay vì mua giúp giảm lãng phí và bảo vệ môi trường.</p></div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="font-display text-3xl mb-8">Ghé thăm cửa hàng</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-[#E5E3DF] rounded-2xl p-8 text-sm flex flex-col">
            <div className="space-y-4">
              <p className="font-semibold text-base">{store['store.legalName']}</p>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store['store.address'])}`} target="_blank" rel="noreferrer" className="flex items-start gap-3 hover:text-[#C89B6D]"><MapPin className="w-5 h-5 text-[#C89B6D] shrink-0" />{store['store.address']}</a>
              <a href={`tel:${store['store.phone'].replace(/[^\d+]/g, '')}`} className="flex items-center gap-3 hover:text-[#C89B6D]"><Phone className="w-5 h-5 text-[#C89B6D]" />{store['store.phone']}</a>
              <a href={`mailto:${store['store.email']}`} className="flex items-center gap-3 hover:text-[#C89B6D]"><Mail className="w-5 h-5 text-[#C89B6D]" />{store['store.email']}</a>
              <p className="flex items-start gap-3"><Clock className="w-5 h-5 text-[#C89B6D] shrink-0" />{store['store.hours']}</p>
            </div>
            <div className="mt-8 lg:mt-auto pt-6 border-t border-[#E5E3DF] flex flex-col sm:flex-row gap-3">
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store['store.address'])}`} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#171717] text-white rounded-lg font-medium hover:bg-[#C89B6D] transition"><MapPin className="w-4 h-4" /> Chỉ đường</a>
              <a href={`tel:${store['store.phone'].replace(/[^\d+]/g, '')}`} className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 border border-[#171717] rounded-lg font-medium hover:bg-[#171717] hover:text-white transition"><Phone className="w-4 h-4" /> Gọi ngay</a>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#E9E5DF]">
            <iframe title={`Bản đồ ${store['store.name']}`} src={`https://www.google.com/maps?q=${encodeURIComponent(store['store.address'])}&output=embed`} className="absolute inset-0 w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
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
