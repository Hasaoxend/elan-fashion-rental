'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createPayment, getAdminBookings, getSettings } from '@/lib/api';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS, PAYMENT_TYPE_LABELS } from '@/lib/labels';
import { EditorTabs } from '@/components/editor-tabs';
import { useToast } from '@/components/toast';

const currency = (value: number) => value.toLocaleString('vi-VN') + 'đ';
const inputClass = 'mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]';

export default function NewPaymentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ bookingId: '', amount: 0, method: 'cod', type: 'rental_fee', note: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminBookings().then((data) => setBookings(data.items)).catch((e) => toast('error', e instanceof Error ? e.message : 'Không thể tải đơn hàng.'));
    // Cấu hình chỉ SUPER_ADMIN/ADMIN đọc được; kế toán vẫn xác nhận thanh toán được, chỉ không thấy thông tin tài khoản.
    getSettings().then((settings) => {
      const config: Record<string, string> = {};
      for (const item of settings.items) if (item.group === 'payment') config[item.key] = item.value;
      setPaymentSettings(config);
    }).catch(() => undefined);
  }, [toast]);

  const booking = bookings.find((b) => b.id === form.bookingId);
  const showBankInfo = form.method === 'bank_transfer' || form.method === 'qr';

  const submit = async () => {
    if (!form.bookingId) { toast('error', 'Vui lòng chọn đơn hàng.'); return; }
    if (form.amount < 1000) { toast('error', 'Số tiền tối thiểu 1.000đ.'); return; }
    setSaving(true);
    try {
      await createPayment({ ...form, status: 'paid' });
      toast('success', 'Xác nhận thanh toán thành công.');
      router.push('/admin/payments');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Không thể xác nhận thanh toán.');
    } finally { setSaving(false); }
  };

  const preview = (
    <div className="max-w-md">
      <p className="text-xs uppercase tracking-widest text-[#A0A0A0] mb-4">Giao dịch sẽ được ghi nhận</p>
      <div className="border border-[#E5E3DF] rounded-xl p-5 space-y-3 text-sm">
        <div className="flex justify-between"><span className="text-[#6B6B6B]">Đơn hàng</span><span className="font-medium">{booking ? `#${booking.bookingCode}` : '—'}</span></div>
        <div className="flex justify-between"><span className="text-[#6B6B6B]">Khách hàng</span><span className="font-medium">{booking?.customer.fullName ?? '—'}</span></div>
        <div className="flex justify-between"><span className="text-[#6B6B6B]">Loại</span><span>{PAYMENT_TYPE_LABELS[form.type]}</span></div>
        <div className="flex justify-between"><span className="text-[#6B6B6B]">Phương thức</span><span>{PAYMENT_METHOD_LABELS[form.method]}</span></div>
        <div className="flex justify-between"><span className="text-[#6B6B6B]">Trạng thái</span><span className={`text-xs px-2 py-1 rounded-full ${PAYMENT_STATUS.paid.className}`}>{PAYMENT_STATUS.paid.label}</span></div>
        {form.note && <div className="flex justify-between gap-6"><span className="text-[#6B6B6B]">Ghi chú</span><span className="text-right">{form.note}</span></div>}
        <div className="flex justify-between pt-3 border-t border-[#E5E3DF] text-base font-semibold"><span>Số tiền</span><span>{currency(form.amount)}</span></div>
        {booking && <p className="text-xs text-[#A0A0A0]">Tổng giá trị đơn: {currency(booking.total)} · Tiền cọc: {currency(booking.deposit)}</p>}
      </div>
      <p className="text-xs text-[#A0A0A0] mt-3">Đơn hàng sẽ được đánh dấu “Đã thanh toán” sau khi xác nhận.</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/admin/payments" className="inline-flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#171717]"><ArrowLeft className="w-4 h-4" /> Quay lại danh sách</Link>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Xác nhận thanh toán</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Chuyển sang tab “Xem trước” để kiểm tra giao dịch trước khi xác nhận.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/payments" className="px-5 py-3 bg-white border border-[#E5E3DF] rounded-lg text-sm">Hủy</Link>
          <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 px-5 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D] disabled:opacity-40">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}Xác nhận
          </button>
        </div>
      </div>

      <EditorTabs preview={preview}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm">Đơn hàng *
              <select value={form.bookingId} onChange={(e) => setForm({ ...form, bookingId: e.target.value, amount: bookings.find((b) => b.id === e.target.value)?.total ?? 0 })} className={inputClass}>
                <option value="">Chọn đơn hàng</option>
                {bookings.map((b) => <option key={b.id} value={b.id}>#{b.bookingCode} - {b.customer.fullName} ({currency(b.total)})</option>)}
              </select>
            </label>
            <label className="block text-sm">Số tiền (VND) *<input type="number" min={1000} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className={inputClass} /></label>
            <label className="block text-sm">Phương thức
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className={inputClass}>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="block text-sm">Loại
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
                {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="block text-sm md:col-span-2">Ghi chú<input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={inputClass} /></label>
          </div>
          {showBankInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#FAF9F8] rounded-xl">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#A0A0A0] mb-3">Thông tin chuyển khoản</p>
                <dl className="space-y-2 text-sm">
                  <div><dt className="text-[#A0A0A0]">Ngân hàng</dt><dd className="font-medium">{paymentSettings['payment.bankName'] || 'Chưa cấu hình'}</dd></div>
                  <div><dt className="text-[#A0A0A0]">Số tài khoản</dt><dd className="font-medium">{paymentSettings['payment.accountNumber'] || 'Chưa cấu hình'}</dd></div>
                  <div><dt className="text-[#A0A0A0]">Chủ tài khoản</dt><dd className="font-medium">{paymentSettings['payment.accountName'] || 'Chưa cấu hình'}</dd></div>
                  <div><dt className="text-[#A0A0A0]">Chi nhánh</dt><dd className="font-medium">{paymentSettings['payment.branch'] || 'Chưa cấu hình'}</dd></div>
                  <div><dt className="text-[#A0A0A0]">Nội dung chuyển khoản gợi ý</dt><dd className="font-medium">{booking?.bookingCode ?? '—'}</dd></div>
                </dl>
                <Link href="/admin/settings" className="inline-block mt-4 text-xs text-[#C89B6D] hover:underline">Cập nhật tại Cấu hình</Link>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#A0A0A0] mb-3">Mã QR thanh toán</p>
                {paymentSettings['payment.qrUrl'] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={paymentSettings['payment.qrUrl']} alt="QR thanh toán" className="w-full max-w-[220px] h-auto rounded-xl border border-[#E5E3DF] bg-white" />
                ) : (
                  <div className="h-56 rounded-xl border border-dashed border-[#E5E3DF] flex items-center justify-center text-center px-6 text-sm text-[#A0A0A0]">Chưa có URL ảnh QR. Dán link ảnh vào Cấu hình.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </EditorTabs>
    </div>
  );
}
