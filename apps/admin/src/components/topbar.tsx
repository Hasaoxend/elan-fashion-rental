'use client';

import { useEffect, useState } from 'react';
import { Menu, Bell, Search, LogOut, UserCircle, X, Package, ShoppingBag, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clearToken, getNotifications, getMe, searchAdmin } from '@/lib/api';

export function Topbar({ onMenuOpen }: { onMenuOpen: () => void }) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [me, setMe] = useState<{ fullName?: string; role?: string }>({});
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({ products: [], bookings: [], customers: [] });
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    getNotifications().then((d) => setUnread(d.items.filter((n) => !n.isRead).length)).catch(() => undefined);
    getMe().then(setMe).catch(() => undefined);
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) { setResults({ products: [], bookings: [], customers: [] }); setSearching(false); return; }
    setSearching(true);
    const timer = window.setTimeout(() => searchAdmin(value).then(setResults).catch(() => setResults({ products: [], bookings: [], customers: [] })).finally(() => setSearching(false)), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const logout = () => { clearToken(); router.push('/login'); };
  const hasResults = results.products.length || results.bookings.length || results.customers.length;

  return (
    <header className="relative z-30 h-20 bg-white border-b border-[#E5E3DF] flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center gap-4">
        <button className="lg:hidden" onClick={onMenuOpen}><Menu className="w-6 h-6" /></button>
        <div className="relative hidden md:block w-80">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#F8F7F5] rounded-lg text-[#A0A0A0]">
            <Search className="w-4 h-4" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm đơn, khách, sản phẩm..." className="w-full bg-transparent outline-none text-sm text-[#171717]" />
            {query && <button onClick={() => setQuery('')}><X className="w-4 h-4" /></button>}
          </div>
          {query.length >= 2 && (
            <div className="absolute left-0 right-0 top-12 bg-white border border-[#E5E3DF] rounded-xl shadow-xl overflow-hidden">
              {searching ? <p className="p-4 text-sm text-[#A0A0A0]">Đang tìm kiếm...</p> : hasResults ? <div className="max-h-96 overflow-y-auto divide-y divide-[#F3F2F0]">
                {results.products.map((item: any) => <Link key={item.id} href={`/admin/products?search=${encodeURIComponent(item.sku)}`} onClick={() => setQuery('')} className="flex items-center gap-3 p-3 hover:bg-[#FAF9F8]"><Package className="w-4 h-4 text-[#C89B6D]" /><span><b>{item.name}</b><small className="block text-xs text-[#A0A0A0]">{item.sku}</small></span></Link>)}
                {results.bookings.map((item: any) => <Link key={item.id} href={`/admin/bookings?search=${encodeURIComponent(item.bookingCode)}`} onClick={() => setQuery('')} className="flex items-center gap-3 p-3 hover:bg-[#FAF9F8]"><ShoppingBag className="w-4 h-4 text-[#C89B6D]" /><span><b>#{item.bookingCode}</b><small className="block text-xs text-[#A0A0A0]">{item.customer.fullName}</small></span></Link>)}
                {results.customers.map((item: any) => <Link key={item.id} href={`/admin/customers?search=${encodeURIComponent(item.phone)}`} onClick={() => setQuery('')} className="flex items-center gap-3 p-3 hover:bg-[#FAF9F8]"><Users className="w-4 h-4 text-[#C89B6D]" /><span><b>{item.fullName}</b><small className="block text-xs text-[#A0A0A0]">{item.phone}</small></span></Link>)}
              </div> : <p className="p-4 text-sm text-[#A0A0A0]">Không tìm thấy dữ liệu.</p>}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-5"><Link href="/admin/notifications" className="relative p-2 text-[#6B6B6B] hover:text-[#171717]"><Bell className="w-5 h-5" />{unread > 0 && <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#C94A4A] text-white text-[10px] flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}</Link><div className="h-8 w-px bg-[#E5E3DF]" /><div className="flex items-center gap-3"><UserCircle className="w-8 h-8 text-[#C89B6D]" /><div className="hidden sm:block"><p className="text-sm font-medium">{me.fullName || 'Admin'}</p><p className="text-xs text-[#A0A0A0]">{me.role || ''}</p></div></div><button onClick={logout} className="p-2 text-[#A0A0A0] hover:text-[#C94A4A]"><LogOut className="w-5 h-5" /></button></div>
    </header>
  );
}
