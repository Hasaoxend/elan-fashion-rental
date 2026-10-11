'use client';

import Link from 'next/link';
import { Search, Heart, ShoppingBag, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#F8F7F5] border-b border-[#E5E3DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-[#171717]">
              FASHION RENTAL
            </Link>

            <nav className="hidden lg:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-[#171717] hover:text-[#C89B6D] transition">
                Trang chủ
              </Link>
              <Link href="/collections" className="text-sm font-medium text-[#6B6B6B] hover:text-[#C89B6D] transition">
                Bộ sưu tập
              </Link>
              <Link href="/products" className="text-sm font-medium text-[#6B6B6B] hover:text-[#C89B6D] transition">
                Trang phục
              </Link>
              <Link href="/products?category=accessories" className="text-sm font-medium text-[#6B6B6B] hover:text-[#C89B6D] transition">
                Phụ kiện
              </Link>
              <Link href="/orders" className="text-sm font-medium text-[#6B6B6B] hover:text-[#C89B6D] transition">
                Lịch thuê
              </Link>
              <Link href="/about" className="text-sm font-medium text-[#6B6B6B] hover:text-[#C89B6D] transition">Về chúng tôi</Link>
              <Link href="/contact" className="text-sm font-medium text-[#6B6B6B] hover:text-[#C89B6D] transition">
                Liên hệ
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-[#E5E3DF] rounded-lg transition">
              <Search className="w-5 h-5 text-[#6B6B6B]" />
            </button>
            <Link href="/wishlist" className="p-2 hover:bg-[#E5E3DF] rounded-lg transition">
              <Heart className="w-5 h-5 text-[#6B6B6B]" />
            </Link>
            <Link href="/cart" className="p-2 hover:bg-[#E5E3DF] rounded-lg transition">
              <ShoppingBag className="w-5 h-5 text-[#6B6B6B]" />
            </Link>
            <Link href="/account" className="p-2 hover:bg-[#E5E3DF] rounded-lg transition">
              <User className="w-5 h-5 text-[#6B6B6B]" />
            </Link>

            <button
              className="lg:hidden p-2 hover:bg-[#E5E3DF] rounded-lg transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-[#171717]" />
              ) : (
                <Menu className="w-6 h-6 text-[#171717]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E5E3DF] bg-white">
          <nav className="px-4 py-4 flex flex-col gap-2">
            <Link href="/" className="px-4 py-3 text-sm font-medium text-[#171717] hover:bg-[#F8F7F5] rounded-lg transition">
              Trang chủ
            </Link>
            <Link href="/collections" className="px-4 py-3 text-sm font-medium text-[#6B6B6B] hover:bg-[#F8F7F5] rounded-lg transition">
              Bộ sưu tập
            </Link>
            <Link href="/products" className="px-4 py-3 text-sm font-medium text-[#6B6B6B] hover:bg-[#F8F7F5] rounded-lg transition">
              Trang phục
            </Link>
            <Link href="/products?category=accessories" className="px-4 py-3 text-sm font-medium text-[#6B6B6B] hover:bg-[#F8F7F5] rounded-lg transition">
              Phụ kiện
            </Link>
            <Link href="/orders" className="px-4 py-3 text-sm font-medium text-[#6B6B6B] hover:bg-[#F8F7F5] rounded-lg transition">
              Lịch thuê
            </Link>
            <Link href="/about" className="px-4 py-3 text-sm font-medium text-[#6B6B6B] hover:bg-[#F8F7F5] rounded-lg transition">Về chúng tôi</Link>
            <Link href="/contact" className="px-4 py-3 text-sm font-medium text-[#6B6B6B] hover:bg-[#F8F7F5] rounded-lg transition">
              Liên hệ
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
