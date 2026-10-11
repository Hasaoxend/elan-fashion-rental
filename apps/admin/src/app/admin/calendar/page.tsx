'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getAdminBookings } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { useRealtime } from '@/lib/realtime';
import { useToast } from '@/components/toast';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { events } = useRealtime(['admin']);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1).toISOString();
      const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).toISOString();
      const data = await getAdminBookings({ from, to });
      setBookings(data.items);
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Không thể tải lịch.'); }
    finally { setLoading(false); }
  }, [cursor, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (events[0]?.event.startsWith('booking.')) load(); }, [events, load]);

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7;
    const total = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: Array<{ day: number | null; date: Date | null }> = [];
    for (let i = 0; i < startOffset; i += 1) cells.push({ day: null, date: null });
    for (let day = 1; day <= total; day += 1) cells.push({ day, date: new Date(cursor.getFullYear(), cursor.getMonth(), day) });
    return cells;
  }, [cursor]);

  const bookingsOn = (day: Date) => bookings.filter((b) => { const start = new Date(b.pickupDate); const end = new Date(b.returnDate); const d = new Date(day.getFullYear(), day.getMonth(), day.getDate()); return d >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) && d <= new Date(end.getFullYear(), end.getMonth(), end.getDate()); });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-semibold">Lịch thuê</h1><p className="text-sm text-[#6B6B6B] mt-1">Xem toàn bộ lịch thuê theo tháng, cập nhật realtime.</p></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-2.5 bg-white border border-[#E5E3DF] rounded-lg hover:border-[#171717]"><ChevronLeft className="w-4 h-4" /></button>
          <span className="px-4 font-medium min-w-[160px] text-center">Tháng {cursor.getMonth() + 1}, {cursor.getFullYear()}</span>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-2.5 bg-white border border-[#E5E3DF] rounded-lg hover:border-[#171717]"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E3DF] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[#E5E3DF]">{WEEKDAYS.map((day) => <div key={day} className="px-3 py-3 text-xs uppercase tracking-wide text-[#A0A0A0] text-center">{day}</div>)}</div>
        {loading ? <div className="p-16 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C89B6D]" /></div> : (
          <div className="grid grid-cols-7">
            {days.map((cell, index) => (
              <div key={index} className="min-h-[110px] border-b border-r border-[#F3F2F0] p-2 last:border-r-0">
                {cell.day && (
                  <>
                    <span className={`text-sm ${cell.date && new Date().toDateString() === cell.date.toDateString() ? 'bg-[#171717] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs' : 'text-[#6B6B6B]'}`}>{cell.day}</span>
                    <div className="mt-1 space-y-1">
                      {cell.date && bookingsOn(cell.date).slice(0, 3).map((booking) => <div key={booking.id} className="text-[10px] px-1.5 py-1 rounded bg-[#F5EDE3] text-[#B8843F] truncate" title={`${booking.bookingCode} · ${booking.customer.fullName}`}>#{booking.bookingCode.slice(-4)} {booking.customer.fullName.split(' ').slice(-1)[0]}</div>)}
                      {cell.date && bookingsOn(cell.date).length > 3 && <div className="text-[10px] text-[#A0A0A0] px-1.5">+{bookingsOn(cell.date).length - 3} đơn khác</div>}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-[#E5E3DF] rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Đơn trong tháng</h2>
        {bookings.length ? <div className="space-y-3">{bookings.slice(0, 10).map((booking) => <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl border border-[#E5E3DF] text-sm"><div><p className="font-medium">#{booking.bookingCode} · {booking.customer.fullName}</p><p className="text-xs text-[#A0A0A0]">{new Date(booking.pickupDate).toLocaleDateString('vi-VN')} — {new Date(booking.returnDate).toLocaleDateString('vi-VN')}</p></div><StatusBadge status={booking.status} /></div>)}</div> : <p className="text-sm text-[#A0A0A0]">Không có đơn hàng trong tháng này.</p>}
      </div>
    </div>
  );
}