'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, ShoppingBag, Shirt, PackageCheck, Sparkles, UserPlus, RefreshCw, Bell } from 'lucide-react';
import { getDashboard, getToken, type DashboardData } from '@/lib/api';
import { useRealtime } from '@/lib/realtime';
import { REALTIME_EVENT_LABELS } from '@/lib/labels';
import { StatusBadge } from '@/components/status-badge';
import { useToast } from '@/components/toast';

const currency = (value: number) => value.toLocaleString('vi-VN') + 'đ';

export default function AdminHomePage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { connected, events } = useRealtime(['admin']);
  const { toast } = useToast();

  const load = useCallback(async () => {
    if (!getToken()) { router.replace('/login'); return; }
    setLoading(true);
    try { setData(await getDashboard()); } catch (e) { toast('error', e instanceof Error ? e.message : 'Không thể tải dữ liệu tổng quan.'); }
    finally { setLoading(false); }
  }, [router, toast]);

  useEffect(() => { load(); }, [load]);

  // Realtime: mỗi sự kiện booking làm thay đổi KPI -> gọi lại dashboard, không reload trang.
  useEffect(() => {
    const bookingEvents = events.filter((e) => e.event.startsWith('booking.') || e.event.startsWith('payment.'));
    if (bookingEvents.length > 0) load();
  }, [events, load]);

  const latest = events[0];
  const kpis = data?.kpis;

  const cards = [
    { href: '/admin/reports', label: 'Doanh thu hôm nay', value: kpis ? currency(kpis.revenueToday) : '—', icon: TrendingUp, accent: 'text-[#3D8B5F]', bg: 'bg-[#E8F5EE]' },
    { href: '/admin/bookings', label: 'Đơn hàng hôm nay', value: kpis ? String(kpis.bookingsToday) : '—', icon: ShoppingBag, accent: 'text-[#C89B6D]', bg: 'bg-[#F5EDE3]' },
    { href: '/admin/bookings?status=picked_up', label: 'Đang cho thuê', value: kpis ? String(kpis.renting) : '—', icon: Shirt, accent: 'text-[#D99A32]', bg: 'bg-[#FFF4DE]' },
    { href: '/admin/calendar', label: 'Sắp trả (7 ngày)', value: kpis ? String(kpis.upcomingReturns) : '—', icon: PackageCheck, accent: 'text-[#C94A4A]', bg: 'bg-[#FDECEC]' },
    { href: '/admin/inventory', label: 'Trang phục có sẵn', value: kpis ? String(kpis.available) : '—', icon: Sparkles, accent: 'text-[#171717]', bg: 'bg-[#ECECEC]' },
    { href: '/admin/customers', label: 'Khách hàng mới', value: kpis ? String(kpis.newCustomers) : '—', icon: UserPlus, accent: 'text-[#3D8B5F]', bg: 'bg-[#E8F5EE]' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Tổng quan</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Tổng quan hoạt động hôm nay của hệ thống.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${connected ? 'bg-[#E8F5EE] text-[#3D8B5F]' : 'bg-[#FDECEC] text-[#C94A4A]'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#3D8B5F] animate-pulse' : 'bg-[#C94A4A]'}`} />
            {connected ? 'Đang cập nhật trực tiếp' : 'Mất kết nối trực tiếp'}
          </span>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E3DF] rounded-lg text-sm hover:border-[#171717]"><RefreshCw className="w-4 h-4" /> Làm mới</button>
        </div>
      </div>

      {latest && (
        <div className="bg-[#171717] text-white rounded-2xl p-5 flex items-start gap-4 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-[#C89B6D] flex items-center justify-center shrink-0"><Bell className="w-5 h-5" /></div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-white/50 mb-1">{REALTIME_EVENT_LABELS[latest.event] || latest.event}</p>
            <p className="text-sm">
              {latest.payload?.body || `${latest.payload?.customerName || 'Khách hàng'} vừa đặt ${latest.payload?.productName || ''}`}
              {latest.payload?.bookingCode && <span className="text-[#C89B6D] ml-2">#{latest.payload.bookingCode}</span>}
            </p>
          </div>
          <Link href={latest.payload?.bookingId ? `/admin/bookings?id=${latest.payload.bookingId}` : '/admin/bookings'} className="text-xs text-[#C89B6D] hover:underline shrink-0">Xem đơn</Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map(({ href, label, value, icon: Icon, accent, bg }) => (
          <Link key={label} href={href} className="bg-white border border-[#E5E3DF] rounded-2xl p-6 hover:border-[#C89B6D] transition">
            <div className="flex items-start justify-between mb-6">
              <p className="text-sm text-[#6B6B6B]">{label}</p>
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${accent}`} /></div>
            </div>
            {loading ? <div className="h-9 w-32 bg-[#F8F7F5] rounded animate-pulse" /> : <p className="text-3xl font-semibold tracking-tight">{value}</p>}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-[#E5E3DF] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E5E3DF] flex items-center justify-between">
            <h2 className="font-semibold">Đơn hàng gần đây</h2>
            <Link href="/admin/bookings" className="text-sm text-[#6B6B6B] hover:text-[#C89B6D]">Xem tất cả</Link>
          </div>
          {loading ? (
            <div className="divide-y divide-[#F3F2F0]">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="px-6 py-4"><div className="h-4 w-40 bg-[#F8F7F5] rounded animate-pulse" /></div>)}</div>
          ) : data?.recentBookings?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-[#A0A0A0] bg-[#FAF9F8]">
                  <tr><th className="px-6 py-3 font-medium">Mã đơn</th><th className="px-6 py-3 font-medium">Khách hàng</th><th className="px-6 py-3 font-medium">Sản phẩm</th><th className="px-6 py-3 font-medium">Tổng tiền</th><th className="px-6 py-3 font-medium">Trạng thái</th></tr>
                </thead>
                <tbody className="divide-y divide-[#F3F2F0]">
                  {data.recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-[#FAF9F8]">
                      <td className="px-6 py-4 font-medium"><Link href={`/admin/bookings?id=${booking.id}`} className="hover:text-[#C89B6D]">#{booking.bookingCode}</Link></td>
                      <td className="px-6 py-4 text-[#6B6B6B]">{booking.customer.fullName}</td>
                      <td className="px-6 py-4 text-[#6B6B6B]">{booking.items?.[0]?.product?.name || '—'}</td>
                      <td className="px-6 py-4">{currency(booking.total)}</td>
                      <td className="px-6 py-4"><StatusBadge status={booking.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-[#A0A0A0]">Chưa có đơn hàng nào.</div>
          )}
        </div>

        <div className="bg-white border border-[#E5E3DF] rounded-2xl p-6">
          <h2 className="font-semibold mb-5">Cần xử lý</h2>
          <div className="space-y-4">
            <Link href="/admin/bookings?status=pending" className="flex items-center justify-between p-4 rounded-xl bg-[#FFF4DE] hover:opacity-80 transition">
              <span className="text-sm">Đơn chờ xác nhận</span>
              <span className="text-lg font-semibold text-[#D99A32]">{kpis?.pendingBookings ?? 0}</span>
            </Link>
            <Link href="/admin/calendar" className="flex items-center justify-between p-4 rounded-xl bg-[#F8F7F5] hover:opacity-80 transition">
              <span className="text-sm">Sắp trả trong 7 ngày</span>
              <span className="text-lg font-semibold">{kpis?.upcomingReturns ?? 0}</span>
            </Link>
            <Link href="/admin/products" className="flex items-center justify-between p-4 rounded-xl bg-[#F8F7F5] hover:opacity-80 transition">
              <span className="text-sm">Trang phục có sẵn</span>
              <span className="text-lg font-semibold">{kpis?.available ?? 0}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}