'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, Plus, Search } from 'lucide-react';
import { getMaintenance, updateMaintenance } from '@/lib/api';
import { MAINTENANCE_STATUS } from '@/lib/labels';
import { useToast } from '@/components/toast';

const currency = (value: number) => value.toLocaleString('vi-VN') + 'đ';

export default function MaintenancePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems((await getMaintenance()).items);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Không thể tải dữ liệu bảo trì.');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const keyword = search.toLowerCase();
  const filtered = items.filter((m) => !search || m.product.name.toLowerCase().includes(keyword) || m.reason.toLowerCase().includes(keyword));

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateMaintenance(id, { status });
      toast('success', 'Đã cập nhật trạng thái bảo trì.');
      load();
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Không thể cập nhật.'); }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Bảo trì</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Quản lý lịch bảo trì, giặt và sửa trang phục.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} title="Làm mới" aria-label="Làm mới" className="p-3 bg-white border border-[#E5E3DF] rounded-lg hover:border-[#171717]"><RefreshCw className="w-4 h-4" /></button>
          <Link href="/admin/maintenance/new" className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D] transition"><Plus className="w-4 h-4" /> Tạo phiếu bảo trì</Link>
        </div>
      </div>

      <div className="bg-white border border-[#E5E3DF] rounded-2xl p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-[#A0A0A0]" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên trang phục hoặc lý do..." className="flex-1 bg-transparent outline-none text-sm" />
      </div>

      <div className="bg-white border border-[#E5E3DF] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C89B6D]" /></div>
        ) : filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-[#A0A0A0] bg-[#FAF9F8]">
                <tr>
                  <th className="px-6 py-4 font-medium">Trang phục</th>
                  <th className="px-6 py-4 font-medium">Lý do</th>
                  <th className="px-6 py-4 font-medium">Thời gian</th>
                  <th className="px-6 py-4 font-medium">Chi phí</th>
                  <th className="px-6 py-4 font-medium">Trạng thái</th>
                  <th className="px-6 py-4 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F2F0]">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-[#FAF9F8]">
                    <td className="px-6 py-4 font-medium"><Link href={`/admin/products/${m.productId}/edit`} className="hover:text-[#C89B6D]">{m.product.name}</Link></td>
                    <td className="px-6 py-4 text-[#6B6B6B]">{m.reason}</td>
                    <td className="px-6 py-4 text-[#6B6B6B]">{new Date(m.startDate).toLocaleDateString('vi-VN')} – {new Date(m.endDate).toLocaleDateString('vi-VN')}</td>
                    <td className="px-6 py-4">{currency(m.cost)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${MAINTENANCE_STATUS[m.status]?.className}`}>{MAINTENANCE_STATUS[m.status]?.label || m.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {m.status === 'open' && <button onClick={() => updateStatus(m.id, 'in_progress')} className="text-xs px-3 py-1.5 bg-[#FFF4DE] text-[#D99A32] rounded-lg hover:opacity-80">Bắt đầu</button>}
                        {(m.status === 'open' || m.status === 'in_progress') && <button onClick={() => updateStatus(m.id, 'done')} className="text-xs px-3 py-1.5 bg-[#E8F5EE] text-[#3D8B5F] rounded-lg hover:opacity-80">Hoàn tất</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-sm text-[#A0A0A0]">Chưa có phiếu bảo trì nào.</div>
        )}
      </div>
    </div>
  );
}
