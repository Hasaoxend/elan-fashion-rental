'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Eye, Filter, Loader2, Search, X } from 'lucide-react';
import { getAdminBookings, getBooking, updateBookingStatus } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { useToast } from '@/components/toast';
import { useRealtime } from '@/lib/realtime';

const currency = (value: number) => value.toLocaleString('vi-VN') + 'đ';
const date = (value: string) => new Date(value).toLocaleDateString('vi-VN');

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();
  const { events, connected } = useRealtime(['admin']);

  const load = useCallback(async () => {
    setLoading(true);
    try { const data = await getAdminBookings(status ? { status } : {}); setBookings(data.items); }
    catch (e) { toast('error', e instanceof Error ? e.message : 'Không thể tải đơn hàng.'); }
    finally { setLoading(false); }
  }, [status, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (events[0]?.event.startsWith('booking.')) load(); }, [events, load]);

  const openDetail = async (id: string) => {
    setSelected({ id });
    try { setSelected(await getBooking(id)); } catch { toast('error', 'Không thể tải chi tiết đơn.'); }
  };

  const changeStatus = async (next: string) => {
    if (!selected?.id) return;
    setUpdating(true);
    try {
      const result = await updateBookingStatus(selected.id, next);
      setSelected(result.booking);
      setBookings((current) => current.map((b) => b.id === selected.id ? { ...b, status: next } : b));
      toast('success', 'Trạng thái đơn đã được cập nhật.');
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Không thể cập nhật.'); }
    finally { setUpdating(false); }
  };

  const filtered = bookings.filter((b) => !search || b.bookingCode.toLowerCase().includes(search.toLowerCase()) || b.customer.fullName.toLowerCase().includes(search.toLowerCase()) || b.customer.phone.includes(search));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-semibold">Đơn hàng</h1><p className="text-sm text-[#6B6B6B] mt-1">Theo dõi và xử lý toàn bộ đơn thuê.</p></div>
        <div className={`text-xs flex items-center gap-2 ${connected ? 'text-[#3D8B5F]' : 'text-[#C94A4A]'}`}><span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#3D8B5F]' : 'bg-[#C94A4A]'}`} /> Realtime</div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E3DF] p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-3 flex-1 px-3 py-2.5 bg-[#F8F7F5] rounded-lg"><Search className="w-4 h-4 text-[#A0A0A0]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã đơn, tên khách, số điện thoại..." className="bg-transparent outline-none text-sm w-full" /></div>
        <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-[#A0A0A0]" /><select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2.5 border border-[#E5E3DF] rounded-lg text-sm bg-white"><option value="">Tất cả trạng thái</option><option value="pending">Chờ xác nhận</option><option value="confirmed">Đã xác nhận</option><option value="preparing">Đang chuẩn bị</option><option value="picked_up">Đã nhận</option><option value="returned">Đã trả</option><option value="completed">Hoàn tất</option><option value="cancelled">Đã hủy</option></select></div>
      </div>

      <div className="bg-white border border-[#E5E3DF] rounded-2xl overflow-hidden"><div className="overflow-x-auto">
        {loading ? <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C89B6D]" /></div> :
          filtered.length ? <table className="w-full text-sm"><thead className="text-left text-xs uppercase tracking-wide text-[#A0A0A0] bg-[#FAF9F8]"><tr><th className="px-6 py-4 font-medium">Mã đơn</th><th className="px-6 py-4 font-medium">Khách hàng</th><th className="px-6 py-4 font-medium">Trang phục</th><th className="px-6 py-4 font-medium">Ngày thuê</th><th className="px-6 py-4 font-medium">Tổng tiền</th><th className="px-6 py-4 font-medium">Trạng thái</th><th className="px-6 py-4" /></tr></thead>
            <tbody className="divide-y divide-[#F3F2F0]">{filtered.map((booking) => <tr key={booking.id} className="hover:bg-[#FAF9F8]"><td className="px-6 py-4 font-medium">#{booking.bookingCode}</td><td className="px-6 py-4"><p>{booking.customer.fullName}</p><p className="text-xs text-[#A0A0A0]">{booking.customer.phone}</p></td><td className="px-6 py-4 text-[#6B6B6B]">{booking.items?.[0]?.product?.name || '—'}{booking.items?.length > 1 && <span className="text-xs"> +{booking.items.length - 1}</span>}</td><td className="px-6 py-4 text-[#6B6B6B]">{date(booking.pickupDate)} — {date(booking.returnDate)}</td><td className="px-6 py-4 font-medium">{currency(booking.total)}</td><td className="px-6 py-4"><StatusBadge status={booking.status} /></td><td className="px-6 py-4"><button onClick={() => openDetail(booking.id)} className="p-2 text-[#6B6B6B] hover:text-[#C89B6D]"><Eye className="w-4 h-4" /></button></td></tr>)}</tbody></table> :
            <div className="p-16 text-center text-sm text-[#A0A0A0]">Không có đơn hàng phù hợp.</div>}
      </div></div>

      {selected?.id && <div className="fixed inset-0 z-[70]"><div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} /><aside className="absolute top-0 right-0 bottom-0 bg-white w-full max-w-xl overflow-y-auto animate-slide-in">
        <div className="px-6 py-5 border-b border-[#E5E3DF] flex justify-between items-start"><div><p className="text-xs text-[#A0A0A0] mb-1">BOOKING</p><h2 className="text-xl font-semibold">#{selected.bookingCode || '...'}</h2></div><button onClick={() => setSelected(null)}><X className="w-5 h-5 text-[#6B6B6B]" /></button></div>
        {selected.bookingCode ? <div className="p-6 space-y-7">
          <div className="flex items-center justify-between"><StatusBadge status={selected.status} /><select disabled={updating} value={selected.status} onChange={(e) => changeStatus(e.target.value)} className="px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm bg-white">{['pending','confirmed','preparing','delivering','picked_up','returned','completed','cancelled','rejected'].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          <section><h3 className="font-semibold mb-3">Khách hàng</h3><div className="p-4 bg-[#F8F7F5] rounded-xl text-sm space-y-1"><p className="font-medium">{selected.customer.fullName}</p><p className="text-[#6B6B6B]">{selected.customer.phone}</p><p className="text-[#6B6B6B]">{selected.customer.email}</p><p className="text-[#6B6B6B]">{selected.address || selected.customer.address || 'Nhận tại cửa hàng'}</p></div></section>
          <section><h3 className="font-semibold mb-3">Lịch thuê</h3><div className="flex items-center gap-3 p-4 bg-[#F8F7F5] rounded-xl"><CalendarDays className="w-5 h-5 text-[#C89B6D]" /><div className="text-sm"><p>{date(selected.pickupDate)} — {date(selected.returnDate)}</p><p className="text-[#6B6B6B]">{selected.rentalDays} ngày · {selected.deliveryMethod === 'home_delivery' ? 'Giao tận nơi' : 'Nhận tại cửa hàng'}</p></div></div></section>
          <section><h3 className="font-semibold mb-3">Sản phẩm</h3><div className="space-y-3">{selected.items?.map((item: any) => <div key={item.id} className="flex items-center justify-between p-3 border border-[#E5E3DF] rounded-xl text-sm"><div><p className="font-medium">{item.product.name}</p><p className="text-xs text-[#A0A0A0]">Size {item.size} · SL {item.quantity}</p></div><span>{currency(item.lineSubtotal)}</span></div>)}</div></section>
          <section className="border-t border-[#E5E3DF] pt-4 space-y-2 text-sm"><div className="flex justify-between"><span className="text-[#6B6B6B]">Tạm tính</span><span>{currency(selected.subtotal)}</span></div><div className="flex justify-between"><span className="text-[#6B6B6B]">Phí dịch vụ</span><span>{currency(selected.serviceFee)}</span></div><div className="flex justify-between font-semibold text-base pt-3 border-t border-[#E5E3DF]"><span>Tổng tiền</span><span>{currency(selected.total)}</span></div><div className="flex justify-between text-xs text-[#A0A0A0]"><span>Tiền cọc</span><span>{currency(selected.deposit)}</span></div></section>
        </div> : <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C89B6D]" /></div>}
      </aside></div>}
    </div>
  );
}