import Link from 'next/link';
import type { StoreInfo } from '@/lib/api';

export function Footer({ store }: { store: StoreInfo | null }) {
  return (
    <footer className="bg-[#171717] text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3 className="text-2xl font-bold mb-1 uppercase tracking-wide">{store?.['store.name'] ?? 'Hamin'}</h3>
            {store && <p className="text-xs text-[#C89B6D] mb-4">{store['store.legalName']}</p>}
            <p className="text-[#A0A0A0] text-sm leading-relaxed">{store?.['store.tagline'] ?? 'Thuê trang phục cao cấp cho những khoảnh khắc đặc biệt.'}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Khám phá</h4>
            <div className="flex flex-col gap-3 text-sm text-[#A0A0A0]">
              <Link href="/collections" className="hover:text-white transition">Bộ sưu tập</Link>
              <Link href="/products" className="hover:text-white transition">Trang phục</Link>
              <Link href="/about" className="hover:text-white transition">Về chúng tôi</Link>
              <Link href="/contact" className="hover:text-white transition">Liên hệ</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Hỗ trợ</h4>
            <div className="flex flex-col gap-3 text-sm text-[#A0A0A0]">
              <Link href="/orders" className="hover:text-white transition">Tra cứu đơn hàng</Link>
              <Link href="/account" className="hover:text-white transition">Tài khoản của tôi</Link>
              <Link href="/wishlist" className="hover:text-white transition">Danh sách yêu thích</Link>
              <Link href="/contact" className="hover:text-white transition">Gửi câu hỏi</Link>
            </div>
          </div>
          {store && (
            <div>
              <h4 className="font-semibold mb-4">Liên hệ</h4>
              <div className="flex flex-col gap-3 text-sm text-[#A0A0A0]">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store['store.address'])}`} target="_blank" rel="noreferrer" className="hover:text-white transition">{store['store.address']}</a>
                <a href={`tel:${store['store.phone'].replace(/[^\d+]/g, '')}`} className="hover:text-white transition">{store['store.phone']}</a>
                <a href={`mailto:${store['store.email']}`} className="hover:text-white transition">{store['store.email']}</a>
                <p>{store['store.hours']}</p>
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-[#333] mt-12 pt-8 text-sm text-[#A0A0A0]">
          <p>© {new Date().getFullYear()} {store?.['store.legalName'] ?? 'Hamin'}. Bảo lưu mọi quyền.</p>
        </div>
      </div>
    </footer>
  );
}
