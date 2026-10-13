'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Search, Heart, ShoppingBag, User, Menu, X } from 'lucide-react';
import { Suspense, useState } from 'react';
import { useWishlist } from '@/lib/wishlist';
import { useSession } from '@/lib/use-session';

const links = [
  { href: '/', label: 'Trang chủ' },
  { href: '/collections', label: 'Bộ sưu tập' },
  { href: '/products', label: 'Trang phục' },
  { href: '/products?category=phu-kien', label: 'Phụ kiện' },
  { href: '/orders', label: 'Lịch thuê' },
  { href: '/about', label: 'Về chúng tôi' },
  { href: '/contact', label: 'Liên hệ' },
];

function useIsActive() {
  const pathname = usePathname();
  const category = useSearchParams().get('category');
  return (href: string) => {
    const [path, query] = href.split('?');
    if (query) return pathname === path && category === new URLSearchParams(query).get('category');
    if (path === '/') return pathname === '/';
    // "Trang phục" không sáng khi đang xem mục Phụ kiện (đã có link riêng).
    if (path === '/products') return pathname.startsWith('/products') && category !== 'phu-kien';
    return pathname.startsWith(path);
  };
}

function HeaderContent({ storeName }: { storeName: string }) {
  const user = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isActive = useIsActive();
  const saved = useWishlist().length;

  return (
    <header className="sticky top-0 z-50 bg-[#F8F7F5] border-b border-[#E5E3DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold tracking-wide uppercase text-[#171717]">{storeName}</Link>
            <nav className="hidden lg:flex items-center gap-6">
              {links.map(({ href, label }) => (
                <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} className={`text-sm font-medium transition hover:text-[#C89B6D] ${isActive(href) ? 'text-[#171717]' : 'text-[#6B6B6B]'}`}>{label}</Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/products" title="Tìm trang phục" aria-label="Tìm trang phục" className="p-2 hover:bg-[#E5E3DF] rounded-lg transition">
              <Search className="w-5 h-5 text-[#6B6B6B]" />
            </Link>
            <Link href="/wishlist" title="Yêu thích" aria-label={`Yêu thích (${saved})`} className="relative p-2 hover:bg-[#E5E3DF] rounded-lg transition">
              <Heart className="w-5 h-5 text-[#6B6B6B]" />
              {saved > 0 && <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#C89B6D] text-white text-[10px] flex items-center justify-center">{saved > 9 ? '9+' : saved}</span>}
            </Link>
            <Link href="/orders" title="Đơn thuê của tôi" aria-label="Đơn thuê của tôi" className="p-2 hover:bg-[#E5E3DF] rounded-lg transition">
              <ShoppingBag className="w-5 h-5 text-[#6B6B6B]" />
            </Link>
            <Link href="/account" title={user ? `Tài khoản: ${user.fullName}` : 'Đăng nhập / Đăng ký'} aria-label={user ? 'Tài khoản của tôi' : 'Đăng nhập'} className="p-2 hover:bg-[#E5E3DF] rounded-lg transition">
              {user ? <span className="w-6 h-6 rounded-full bg-[#C89B6D] text-white text-xs font-semibold flex items-center justify-center">{user.fullName.trim().split(' ').pop()?.charAt(0).toUpperCase()}</span> : <User className="w-5 h-5 text-[#6B6B6B]" />}
            </Link>
            <button className="lg:hidden p-2 hover:bg-[#E5E3DF] rounded-lg transition" aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#171717]" /> : <Menu className="w-6 h-6 text-[#171717]" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E5E3DF] bg-white">
          <nav className="px-4 py-4 flex flex-col gap-2" onClick={() => setMobileMenuOpen(false)}>
            {links.map(({ href, label }) => (
              <Link key={href} href={href} className={`px-4 py-3 text-sm font-medium hover:bg-[#F8F7F5] rounded-lg transition ${isActive(href) ? 'text-[#171717] bg-[#F8F7F5]' : 'text-[#6B6B6B]'}`}>{label}</Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

// useSearchParams cần Suspense khi render tĩnh; fallback giữ chỗ để layout không nhảy.
export function Header({ storeName }: { storeName: string }) {
  return <Suspense fallback={<header className="sticky top-0 z-50 h-20 bg-[#F8F7F5] border-b border-[#E5E3DF]" />}><HeaderContent storeName={storeName} /></Suspense>;
}
