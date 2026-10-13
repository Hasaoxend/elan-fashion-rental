'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { lookupBooking } from '@/lib/api';

const labels: Record<string, string> = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', preparing: 'Đang chuẩn bị', delivering: 'Đang giao', picked_up: 'Đã nhận', returned: 'Đã trả', completed: 'Hoàn tất', cancelled: 'Đã hủy', rejected: 'Từ chối' };
const steps = ['pending', 'confirmed', 'preparing', 'delivering', 'picked_up', 'returned', 'completed'];

export default function OrdersPage() {
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true); setError(''); setBooking(null);
    try { setBooking(await lookupBooking(code.trim(), phone.trim())); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không tìm thấy đơn hàng.'); }
    finally { setLoading(false); }
  };
  const current = booking ? Math.max(0, steps.indexOf(booking.status)) : -1;
  const stopped = booking?.status === 'cancelled' || booking?.status === 'rejected';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 min-h-[65vh]">
      <div className="text-center mb-10">
        <p className="text-sm tracking-[.2em] uppercase text-[#C89B6D] mb-3">Tra cứu</p>
        <h1 className="font-display text-4xl mb-3">Lịch thuê của bạn</h1>
        <p className="text-[#6B6B6B]">Nhập mã đơn và số điện thoại (hoặc email) để xem trạng thái đơn hàng. Có tài khoản? <a href="/account" className="text-[#C89B6D] underline">Xem tất cả đơn của bạn</a>.</p>
      </div>

      <div className="bg-white border border-[#E5E3DF] rounded-2xl p-6 mb-8">
        <form onSubmit={(e) => { e.preventDefault(); if (code && phone) submit(); }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm">Mã đơn hàng<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ví dụ: BK202610070001" className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" /></label>
          <label className="text-sm">Số điện thoại hoặc email đặt đơn<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="090... hoặc ten@gmail.com" className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" /></label>
        </div>
        {error && <p className="mt-4 text-sm text-[#C94A4A]">{error}</p>}
        <button type="submit" disabled={loading || !code || !phone} className="mt-5 w-full sm:w-auto px-6 py-3 bg-[#171717] text-white rounded-lg text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Tra cứu đơn hàng
        </button>
        </form>
      </div>

      {booking && (
        <div className="bg-white border border-[#E5E3DF] rounded-2xl p-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#E5E3DF] pb-5 mb-6">
            <div><p className="text-xs text-[#A0A0A0] mb-1">MÃ ĐƠN</p><h2 className="text-xl font-semibold">#{booking.bookingCode}</h2></div>
            <span className={`px-3 py-1.5 rounded-full text-xs ${stopped ? 'bg-[#FDECEC] text-[#C94A4A]' : 'bg-[#E8F5EE] text-[#3D8B5F]'}`}>{labels[booking.status] || booking.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-7">
            <div><p className="text-[#A0A0A0] mb-1">Ngày nhận</p><p className="font-medium">{new Date(booking.pickupDate).toLocaleDateString('vi-VN')}</p></div>
            <div><p className="text-[#A0A0A0] mb-1">Ngày trả</p><p className="font-medium">{new Date(booking.returnDate).toLocaleDateString('vi-VN')}</p></div>
          </div>
          {stopped ? <p className="mb-8 p-4 rounded-xl bg-[#FDECEC] text-sm text-[#C94A4A]">Đơn hàng đã {booking.status === 'cancelled' ? 'bị hủy' : 'bị từ chối'}{booking.cancelReason ? `: ${booking.cancelReason}` : '.'}</p> : <div className="flex items-start mb-8 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <div key={step} className="flex items-start min-w-[78px] flex-1">
                <div className="flex flex-col items-center w-full">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${index <= current ? 'bg-[#C89B6D] text-white' : 'bg-[#F3F2F0] text-[#A0A0A0]'}`}>{index < current ? '✓' : index + 1}</div>
                  <p className={`text-[10px] text-center mt-2 ${index <= current ? 'text-[#171717]' : 'text-[#A0A0A0]'}`}>{labels[step]}</p>
                </div>
                {index < steps.length - 1 && <div className={`h-px w-full mt-4 ${index < current ? 'bg-[#C89B6D]' : 'bg-[#E5E3DF]'}`} />}
              </div>
            ))}
          </div>}
          <div className="space-y-3 mb-6">
            {booking.items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-[#F8F7F5] rounded-xl text-sm">
                <div><p className="font-medium">{item.product.name}</p><p className="text-xs text-[#A0A0A0]">Size {item.size} · {item.quantity} sản phẩm · {item.rentalDays} ngày</p></div>
                <span>{item.lineSubtotal.toLocaleString('vi-VN')}đ</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#E5E3DF] pt-4 flex justify-between font-semibold"><span>Tổng tiền</span><span>{booking.total.toLocaleString('vi-VN')}đ</span></div>
        </div>
      )}
    </div>
  );
}