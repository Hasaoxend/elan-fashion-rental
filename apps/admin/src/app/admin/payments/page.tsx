'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, Search, Plus } from 'lucide-react';
import { getPayments, updatePayment } from '@/lib/api';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS, PAYMENT_TYPE_LABELS } from '@/lib/labels';
import { useToast } from '@/components/toast';

const currency = (value: number) => value.toLocaleString('vi-VN') + 'đ';

export default function PaymentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems((await getPayments()).items);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Không thể tải dữ liệu thanh toán.');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const keyword = search.toLowerCase();
  const filtered = items.filter((p) => {
    const matchSearch = !search || p.booking.bookingCode.toLowerCase().includes(keyword) || p.booking.customer.fullName.toLowerCase().includes(keyword);
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (id: string, status: string) => {
    if (status === 'refunded' && !confirm('Đánh dấu giao dịch này là đã hoàn tiền?')) return;
    try {
      await updatePayment(id, { status });
      toast('success', 'Đã cập nhật trạng thái thanh toán.');
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
          <button onClick={load} title="Làm mới" aria-label="Làm mới" className="p-3 bg-white border border-[#E5E3DF] rounded-lg hover:border-[#171717]"><RefreshCw className="w-4 h-4" /></button>
          <Link href="/admin/payments/new" className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D] transition"><Plus className="w-4 h-4" /> Xác nhận thanh toán</Link>
        </div>
      </div>

      <div className="bg-white border border-[#E5E3DF] rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Search className="w-4 h-4 text-[#A0A0A0]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã đơn hoặc khách hàng..." className="flex-1 bg-transparent outline-none text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-[#E5E3DF] rounded-lg text-sm bg-white outline-none focus:border-[#C89B6D]">
          <option value="">Tất cả trạng thái</option>
          {Object.entries(PAYMENT_STATUS).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
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
                    <td className="px-6 py-4 text-[#6B6B6B]">
                      <Link href={`/admin/bookings?id=${p.bookingId}`} className="hover:text-[#C89B6D]">#{p.booking.bookingCode}</Link>
                      <p className="text-xs text-[#A0A0A0]">{PAYMENT_TYPE_LABELS[p.type] || p.type}</p>
                    </td>
                    <td className="px-6 py-4 text-[#6B6B6B]">{p.booking.customer.fullName}</td>
                    <td className="px-6 py-4">{currency(p.amount)}</td>
                    <td className="px-6 py-4 text-[#6B6B6B]">{PAYMENT_METHOD_LABELS[p.method] || p.method}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${PAYMENT_STATUS[p.status]?.className}`}>{PAYMENT_STATUS[p.status]?.label || p.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {p.status !== 'paid' && p.status !== 'refunded' && <button onClick={() => updateStatus(p.id, 'paid')} className="text-xs px-3 py-1.5 bg-[#E8F5EE] text-[#3D8B5F] rounded-lg hover:opacity-80 whitespace-nowrap">Xác nhận</button>}
                        {p.status !== 'refunded' && <button onClick={() => updateStatus(p.id, 'refunded')} className="text-xs px-3 py-1.5 bg-[#FDECEC] text-[#C94A4A] rounded-lg hover:opacity-80 whitespace-nowrap">Hoàn tiền</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-sm text-[#A0A0A0]">{search || statusFilter ? 'Không có giao dịch phù hợp.' : 'Chưa có giao dịch thanh toán nào.'}</div>
        )}
      </div>
    </div>
  );
}
