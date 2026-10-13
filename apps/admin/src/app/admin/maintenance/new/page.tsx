'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CalendarX2 } from 'lucide-react';
import { createMaintenance, getAdminProducts } from '@/lib/api';
import { MAINTENANCE_STATUS } from '@/lib/labels';
import { EditorTabs } from '@/components/editor-tabs';
import { useToast } from '@/components/toast';

const currency = (value: number) => value.toLocaleString('vi-VN') + 'đ';
const date = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN');
const inputClass = 'mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]';

export default function NewMaintenancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ productId: '', reason: '', startDate: '', endDate: '', cost: 0, note: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminProducts().then((data) => setProducts(data.items)).catch((e) => toast('error', e instanceof Error ? e.message : 'Không thể tải trang phục.'));
  }, [toast]);

  const product = products.find((p) => p.id === form.productId);

  const submit = async () => {
    if (!form.productId || !form.startDate || !form.endDate) { toast('error', 'Vui lòng chọn trang phục và thời gian bảo trì.'); return; }
    if (form.reason.trim().length < 3) { toast('error', 'Lý do tối thiểu 3 ký tự.'); return; }
    if (form.endDate < form.startDate) { toast('error', 'Ngày kết thúc phải từ ngày bắt đầu trở đi.'); return; }
    setSaving(true);
    try {
      await createMaintenance(form);
      toast('success', 'Tạo phiếu bảo trì thành công.');
      router.push('/admin/maintenance');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Không thể tạo phiếu bảo trì.');
    } finally { setSaving(false); }
  };

  const preview = (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[#A0A0A0] mb-4">Phiếu bảo trì</p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 p-5 border border-[#E5E3DF] rounded-xl text-sm">
          <div><dt className="text-[#A0A0A0] mb-1">Trang phục</dt><dd className="font-medium">{product ? `${product.name} (${product.sku})` : '—'}</dd></div>
          <div><dt className="text-[#A0A0A0] mb-1">Trạng thái</dt><dd><span className={`text-xs px-2 py-1 rounded-full ${MAINTENANCE_STATUS.open.className}`}>{MAINTENANCE_STATUS.open.label}</span></dd></div>
          <div><dt className="text-[#A0A0A0] mb-1">Lý do</dt><dd className="font-medium">{form.reason || '—'}</dd></div>
          <div><dt className="text-[#A0A0A0] mb-1">Thời gian</dt><dd className="font-medium">{form.startDate ? date(form.startDate) : '—'} – {form.endDate ? date(form.endDate) : '—'}</dd></div>
          <div><dt className="text-[#A0A0A0] mb-1">Chi phí</dt><dd className="font-medium">{currency(form.cost)}</dd></div>
          <div><dt className="text-[#A0A0A0] mb-1">Ghi chú</dt><dd className="font-medium whitespace-pre-line">{form.note || '—'}</dd></div>
        </dl>
      </div>
      {product && form.startDate && form.endDate && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FFF4DE] text-[#B8843F] text-sm">
          <CalendarX2 className="w-5 h-5 shrink-0" />
          Khi phiếu đang mở hoặc đang xử lý, khách hàng sẽ không đặt thuê được “{product.name}” cho các ngày từ {date(form.startDate)} đến trước {date(form.endDate)}.
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/admin/maintenance" className="inline-flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#171717]"><ArrowLeft className="w-4 h-4" /> Quay lại danh sách</Link>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Tạo phiếu bảo trì</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Chuyển sang tab “Xem trước” để kiểm tra phiếu trước khi tạo.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/maintenance" className="px-5 py-3 bg-white border border-[#E5E3DF] rounded-lg text-sm">Hủy</Link>
          <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 px-5 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D] disabled:opacity-40">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}Tạo phiếu
          </button>
        </div>
      </div>

      <EditorTabs preview={preview}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-sm">Trang phục *
            <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className={inputClass}>
              <option value="">Chọn trang phục</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </label>
          <label className="block text-sm">Lý do *<input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Ví dụ: Giặt hấp, sửa khóa..." className={inputClass} /></label>
          <label className="block text-sm">Ngày bắt đầu *<input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputClass} /></label>
          <label className="block text-sm">Ngày kết thúc *<input type="date" min={form.startDate || undefined} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} /></label>
          <label className="block text-sm">Chi phí (VND)<input type="number" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} className={inputClass} /></label>
          <label className="block text-sm md:col-span-2">Ghi chú<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className={inputClass} /></label>
        </div>
      </EditorTabs>
    </div>
  );
}
