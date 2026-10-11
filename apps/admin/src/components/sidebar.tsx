'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Shirt, CalendarDays, ShoppingBag, Users, Package, Wrench, CreditCard, BarChart3, Bell, Settings, X, ShieldCheck } from 'lucide-react';
import { getMe } from '@/lib/api';

interface MenuItem {
  href: string;
  label: string;
  icon: any;
  roles?: string[];
}

const links: MenuItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Trang phục', icon: Shirt, roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'WAREHOUSE'] },
  { href: '/admin/calendar', label: 'Lịch thuê', icon: CalendarDays, roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'WAREHOUSE'] },
  { href: '/admin/bookings', label: 'Đơn hàng', icon: ShoppingBag, roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'WAREHOUSE', 'ACCOUNTANT'] },
  { href: '/admin/customers', label: 'Khách hàng', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
  { href: '/admin/inventory', label: 'Kho', icon: Package, roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'WAREHOUSE'] },
  { href: '/admin/maintenance', label: 'Bảo trì', icon: Wrench, roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'WAREHOUSE'] },
  { href: '/admin/payments', label: 'Thanh toán', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
  { href: '/admin/reports', label: 'Báo cáo', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
  { href: '/admin/notifications', label: 'Thông báo', icon: Bell },
  { href: '/admin/users', label: 'Quản trị viên', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [role, setRole] = useState<string>('');

  useEffect(() => {
    getMe().then((me) => setRole(me.role)).catch(() => {});
  }, []);

  const visible = links.filter((l) => !l.roles || l.roles.includes(role));

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/30 lg:hidden ${open ? 'block' : 'hidden'}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#171717] text-white transform transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 px-6 flex items-center justify-between border-b border-white/10">
          <Link href="/admin" className="font-semibold tracking-wide">
            FASHION RENTAL<span className="text-[#C89B6D]">.</span>
            <span className="block text-[10px] uppercase tracking-[.2em] text-white/40 mt-1">Admin workspace</span>
          </Link>
          <button className="lg:hidden" onClick={onClose}><X className="w-5 h-5 text-white/60" /></button>
        </div>
        <nav className="p-4 space-y-1">
          {visible.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} onClick={onClose} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${active ? 'bg-[#C89B6D] text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 inset-x-0 p-4 border-t border-white/10">
          <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 text-sm text-white/60 hover:text-white">
            <Settings className="w-5 h-5" />Cấu hình
          </Link>
        </div>
      </aside>
    </>
  );
}
