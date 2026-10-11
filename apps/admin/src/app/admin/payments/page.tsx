'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, RefreshCw, CreditCard, Search, Plus } from 'lucide-react';
import { getPayments, createPayment, updatePayment, getAdminBookings, getSettings } from '@/lib/api';
import { useToast } from '@/components/toast';

const currency = (value: number) => value.toLocaleString('vi-VN') + 'đ';

export default function PaymentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bookingId: '', amount: 0, method: 'cod', type: 'rental_fee', note: '' });
  const [paymentSettings, setPaymentSettings] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [payments, bookingList, settings] = await Promise.all([getPayments(), getAdminBookings(), getSettings()]);
      setItems(payments.items);
      setBookings(bookingList.items);
      const paymentConfig: Record<string, string> = {};
      for (const item of settings.items) if (item.group === 'payment') paymentConfig[item.key] = item.value;
      setPaymentSettings(paymentConfig);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Không thể tải dữ liệu thanh toán.');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((p) => {
    const matchSearch = !search || p.booking?.bookingCode?.toLowerCase().includes(search.toLowerCase()) || p.booking?.customer?.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const submit = async () => {
    if (!form.bookingId || !form.amount) {
      toast('error', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    try {
      await createPayment({ ...form, amount: Number(form.amount), status: 'paid' });
      toast('success', 'Xác nhận thanh toán thành công.');
      setShowForm(false);
      setForm({ bookingId: '', amount: 0, method: 'cod', type: 'rental_fee', note: '' });
      load();
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Không thể xác nhận thanh toán.'); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await updatePayment(id, { status });
      toast('success', 'Cập nhật trạng thái thanh toán.');
      load();
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Không thể cập nhật.'); }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Thanh toán</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Theo dõi giao dịch, tiền cọc và hoàn tiền.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-3 bg-white border border-[#E5E3DF] rounded-lg"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D] transition"><Plus className="w-4 h-4" /> Xác nhận thanh toán</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-[#E5E3DF] rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Xác nhận thanh toán</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm">Đơn hàng
              <select value={form.bookingId} onChange={(e) => setForm({ ...form, bookingId: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]">
                <option value="">Chọn đơn hàng</option>
                {bookings.map((b) => <option key={b.id} value={b.id}>#{b.bookingCode} - {b.customer?.fullName} ({currency(b.total)})</option>)}
              </select>
            </label>
            <label className="block text-sm">Số tiền (VND)
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="0" className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Phương thức
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]">
                <option value="cod">COD</option>
                <option value="bank_transfer">Chuyển khoản</option>
                <option value="qr">QR</option>
                <option value="ewallet">Ví điện tử</option>
              </select>
            </label>
            <label className="block text-sm">Loại
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]">
                <option value="rental_fee">Phí thuê</option>
                <option value="deposit">Tiền cọc</option>
                <option value="shipping">Phí giao hàng</option>
                <option value="refund">Hoàn tiền</option>
              </select>
            </label>
            <label className="block text-sm md:col-span-2">Ghi chú
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
          </div>
          {(form.method === 'bank_transfer' || form.method === 'qr') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#FAF9F8] rounded-xl">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#A0A0A0] mb-3">Thông tin chuyển khoản</p>
                <dl className="space-y-2 text-sm">
                  <div><dt className="text-[#A0A0A0]">Ngân hàng</dt><dd className="font-medium">{paymentSettings['payment.bankName'] || 'Chưa cấu hình'}</dd></div>
                  <div><dt className="text-[#A0A0A0]">Số tài khoản</dt><dd className="font-medium">{paymentSettings['payment.accountNumber'] || 'Chưa cấu hình'}</dd></div>
                  <div><dt className="text-[#A0A0A0]">Chủ tài khoản</dt><dd className="font-medium">{paymentSettings['payment.accountName'] || 'Chưa cấu hình'}</dd></div>
                  <div><dt className="text-[#A0A0A0]">Chi nhánh</dt><dd className="font-medium">{paymentSettings['payment.branch'] || 'Chưa cấu hình'}</dd></div>
                  <div><dt className="text-[#A0A0A0]">Nội dung gợi ý</dt><dd className="font-medium">{form.bookingId ? bookings.find((b) => b.id === form.bookingId)?.bookingCode : ''}</dd></div>
                </dl>
                <Link href="/admin/settings" className="inline-block mt-4 text-xs text-[#C89B6D] hover:underline">Cập nhật tại Cấu hình</Link>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#A0A0A0] mb-3">Mã QR thanh toán</p>
                {paymentSettings['payment.qrUrl'] ? (
                  <div className="rounded-xl overflow-hidden border border-[#E5E3DF] bg-white">
                    <Image src={paymentSettings['payment.qrUrl']} alt="QR thanh toán" width={220} height={220} className="w-full h-auto" unoptimized />
                  </div>
                ) : (
                  <div className="h-56 rounded-xl border border-dashed border-[#E5E3DF] flex items-center justify-center text-sm text-[#A0A0A0]">Chưa có URL ảnh QR. Dán link ảnh vào Cấu hình.</div>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={submit} className="px-5 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D]">Xác nhận</button>
            <button onClick={() => setShowForm(false)} className="px-5 py-3 bg-white border border-[#E5E3DF] rounded-lg text-sm">Hủy</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#E5E3DF] rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Search className="w-4 h-4 text-[#A0A0A0]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã đơn hoặc khách hàng..." className="flex-1 bg-transparent outline-none text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-[#E5E3DF] rounded-lg text-sm outline-none focus:border-[#C89B6D]">
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ thanh toán</option>
          <option value="paid">Đã thanh toán</option>
          <option value="partial">Thanh toán một phần</option>
          <option value="refunded">Đã hoàn</option>
          <option value="failed">Thất bại</option>
        </select>
      </div>

      <div className="bg-white border border-[#E5E3DF] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C89B6D]" /></div>
        ) : filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-[#A0A0A0] bg-[#FAF9F8]">
                <tr>
                  <th className="px-6 py-4 font-medium">Mã giao dịch</th>
                  <th className="px-6 py-4 font-medium">Đơn hàng</th>
                  <th className="px-6 py-4 font-medium">Khách hàng</th>
                  <th className="px-6 py-4 font-medium">Số tiền</th>
                  <th className="px-6 py-4 font-medium">Phương thức</th>
                  <th className="px-6 py-4 font-medium">Trạng thái</th>
                  <th className="px-6 py-4 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F2F0]">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF9F8]">
                    <td className="px-6 py-4 font-medium">#{p.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-[#6B6B6B]">{p.booking ? `#${p.booking.bookingCode}` : 'Chua co'}</td>
                    <td className="px-6 py-4 text-[#6B6B6B]">{p.booking?.customer?.fullName || 'Chua co'}</td>
                    <td className="px-6 py-4">{currency(p.amount)}</td>
                    <td className="px-6 py-4 text-[#6B6B6B]">{p.method}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'paid' ? 'bg-[#E8F5EE] text-[#3D8B5F]' : p.status === 'pending' ? 'bg-[#FFF4DE] text-[#D99A32]' : p.status === 'refunded' ? 'bg-[#ECECEC] text-[#6B6B6B]' : 'bg-[#FDECEC] text-[#C94A4A]'}`}>
                        {p.status === 'paid' ? 'Đã thanh toán' : p.status === 'pending' ? 'Chờ thanh toán' : p.status === 'partial' ? 'Một phần' : p.status === 'refunded' ? 'Đã hoàn' : 'Thất bại'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {p.status !== 'paid' && p.status !== 'refunded' && (
                          <>
                            <button onClick={() => updateStatus(p.id, 'paid')} className="text-xs px-3 py-1.5 bg-[#E8F5EE] text-[#3D8B5F] rounded-lg hover:opacity-80">Xác nhận</button>
                            <button onClick={() => updateStatus(p.id, 'refunded')} className="text-xs px-3 py-1.5 bg-[#FDECEC] text-[#C94A4A] rounded-lg hover:opacity-80">Hoàn tiền</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-sm text-[#A0A0A0]">Chưa có giao dịch thanh toán nào.</div>
        )}
      </div>
    </div>
  );
}
