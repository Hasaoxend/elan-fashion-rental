'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { UserCircle, ArrowRight, Heart, LogOut, Loader2, KeyRound, Package, UserPlus, LogIn } from 'lucide-react';
import { cancelMyBooking, changePassword, getMe, getMyBookings, type Me } from '@/lib/api';
import { clearSession } from '@/lib/session';
import { useSession } from '@/lib/use-session';

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Chờ xác nhận', className: 'bg-[#FFF4DE] text-[#D99A32]' },
  confirmed: { label: 'Đã xác nhận', className: 'bg-[#E8EEF8] text-[#3B6BB0]' },
  preparing: { label: 'Đang chuẩn bị', className: 'bg-[#F5EDE3] text-[#B8843F]' },
  delivering: { label: 'Đang giao', className: 'bg-[#E8EEF8] text-[#3B6BB0]' },
  picked_up: { label: 'Đã nhận đồ', className: 'bg-[#E8F5EE] text-[#3D8B5F]' },
  returned: { label: 'Đã trả đồ', className: 'bg-[#E8F5EE] text-[#3D8B5F]' },
  completed: { label: 'Hoàn tất', className: 'bg-[#ECECEC] text-[#6B6B6B]' },
  cancelled: { label: 'Đã hủy', className: 'bg-[#FDECEC] text-[#C94A4A]' },
  rejected: { label: 'Bị từ chối', className: 'bg-[#FDECEC] text-[#C94A4A]' },
};
const date = (value: string) => new Date(value).toLocaleDateString('vi-VN');
const inputClass = 'mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]';

function Guest() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 min-h-[65vh] text-center">
      <UserCircle className="w-16 h-16 text-[#C89B6D] mx-auto mb-6" />
      <h1 className="font-display text-4xl mb-4">Tài khoản của bạn</h1>
      <p className="text-[#6B6B6B] mb-8">Đăng nhập để xem lịch sử thuê và đặt lịch nhanh hơn. Bạn vẫn có thể đặt lịch và tra cứu đơn mà không cần tài khoản.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        <Link href="/login" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#171717] text-white rounded-lg font-medium hover:bg-[#C89B6D] transition"><LogIn className="w-4 h-4" /> Đăng nhập</Link>
        <Link href="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#171717] rounded-lg font-medium hover:bg-[#171717] hover:text-white transition"><UserPlus className="w-4 h-4" /> Tạo tài khoản</Link>
      </div>
      <div className="flex justify-center gap-6 text-sm text-[#6B6B6B]">
        <Link href="/orders" className="inline-flex items-center gap-1 hover:text-[#C89B6D]">Tra cứu đơn hàng <ArrowRight className="w-4 h-4" /></Link>
        <Link href="/wishlist" className="inline-flex items-center gap-1 hover:text-[#C89B6D]"><Heart className="w-4 h-4" /> Yêu thích</Link>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const user = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [bookings, setBookings] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    Promise.all([getMe(), getMyBookings()])
      .then(([profile, list]) => { setMe(profile); setBookings(list.items); })
      .catch((e) => setError(e instanceof Error ? e.message : 'Không thể tải tài khoản.'));
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  if (!user) return <Guest />;

  const cancel = async (booking: any) => {
    if (!confirm(`Hủy đơn #${booking.bookingCode}?`)) return;
    try { await cancelMyBooking(booking.id, 'Khách hủy trên website'); load(); setMessage(`Đã hủy đơn #${booking.bookingCode}.`); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể hủy đơn.'); }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setMessage('');
    if (password.next.length < 8) { setError('Mật khẩu mới tối thiểu 8 ký tự.'); return; }
    if (password.next !== password.confirm) { setError('Mật khẩu nhập lại không khớp.'); return; }
    setBusy(true);
    try { await changePassword(password.current, password.next); setPassword({ current: '', next: '', confirm: '' }); setMessage('Đổi mật khẩu thành công.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể đổi mật khẩu.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 min-h-[65vh]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm tracking-[.2em] uppercase text-[#C89B6D] mb-2">Tài khoản</p>
          <h1 className="font-display text-4xl">Xin chào, {user.fullName}</h1>
        </div>
        <button onClick={clearSession} className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#E5E3DF] rounded-lg text-sm hover:border-[#C94A4A] hover:text-[#C94A4A]"><LogOut className="w-4 h-4" /> Đăng xuất</button>
      </div>
      {error && <p className="mb-4 p-3 rounded-lg bg-[#FDECEC] text-sm text-[#C94A4A]" role="alert">{error}</p>}
      {message && <p className="mb-4 p-3 rounded-lg bg-[#E8F5EE] text-sm text-[#3D8B5F]">{message}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <section className="bg-white border border-[#E5E3DF] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-[#C89B6D]" /> Đơn thuê của tôi</h2>
            <Link href="/products" className="text-sm text-[#C89B6D] hover:underline">Đặt lịch mới</Link>
          </div>
          {bookings === null ? <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C89B6D]" /></div>
            : bookings.length ? (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="p-4 border border-[#E5E3DF] rounded-xl">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium">#{b.bookingCode}</p>
                        <p className="text-xs text-[#A0A0A0]">{date(b.pickupDate)} — {date(b.returnDate)} · {b.rentalDays} ngày</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs ${STATUS[b.status]?.className}`}>{STATUS[b.status]?.label || b.status}</span>
                    </div>
                    <p className="text-sm text-[#6B6B6B]">{b.items.map((item: any) => `${item.product.name} (size ${item.size} × ${item.quantity})`).join(', ')}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-semibold">{b.total.toLocaleString('vi-VN')}đ</span>
                      {(b.status === 'pending' || b.status === 'confirmed') && <button onClick={() => cancel(b)} className="text-xs px-3 py-1.5 bg-[#FDECEC] text-[#C94A4A] rounded-lg hover:opacity-80">Hủy đơn</button>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-[#6B6B6B]">Bạn chưa có đơn thuê nào. <Link href="/products" className="text-[#C89B6D] underline">Khám phá trang phục</Link></div>
            )}
        </section>

        <div className="space-y-6">
          <section className="bg-white border border-[#E5E3DF] rounded-2xl p-6 text-sm">
            <h2 className="font-semibold mb-4">Thông tin cá nhân</h2>
            {me ? (
              <dl className="space-y-3">
                <div><dt className="text-[#A0A0A0]">Họ và tên</dt><dd className="font-medium">{me.fullName}</dd></div>
                <div><dt className="text-[#A0A0A0]">Số điện thoại</dt><dd className="font-medium">{me.phone ?? '—'}</dd></div>
                <div><dt className="text-[#A0A0A0]">Email</dt><dd className="font-medium break-all">{me.email}</dd></div>
              </dl>
            ) : <Loader2 className="w-5 h-5 animate-spin text-[#C89B6D]" />}
          </section>
          <form onSubmit={updatePassword} className="bg-white border border-[#E5E3DF] rounded-2xl p-6 space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><KeyRound className="w-4 h-4 text-[#C89B6D]" /> Đổi mật khẩu</h2>
            <label className="block text-sm">Mật khẩu hiện tại<input type="password" autoComplete="current-password" value={password.current} onChange={(e) => setPassword({ ...password, current: e.target.value })} className={inputClass} /></label>
            <label className="block text-sm">Mật khẩu mới<input type="password" autoComplete="new-password" value={password.next} onChange={(e) => setPassword({ ...password, next: e.target.value })} className={inputClass} /></label>
            <label className="block text-sm">Nhập lại mật khẩu mới<input type="password" autoComplete="new-password" value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} className={inputClass} /></label>
            <button type="submit" disabled={busy || !password.current || !password.next} className="w-full py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D] disabled:opacity-40">Cập nhật mật khẩu</button>
          </form>
          <Link href="/wishlist" className="flex items-center justify-between p-4 bg-white border border-[#E5E3DF] rounded-2xl text-sm hover:border-[#C89B6D]"><span className="flex items-center gap-2"><Heart className="w-4 h-4 text-[#C89B6D]" /> Danh sách yêu thích</span><ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    </div>
  );
}
