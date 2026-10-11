'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Wrench, Plus, Search } from 'lucide-react';
import { getMaintenance, createMaintenance, updateMaintenance, getAdminProducts } from '@/lib/api';
import { useToast } from '@/components/toast';

const currency = (value: number) => value.toLocaleString('vi-VN') + 'đ';

export default function MaintenancePage() {
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productId: '', reason: '', startDate: '', endDate: '', cost: 0, note: '' });
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [maintenance, productList] = await Promise.all([getMaintenance(), getAdminProducts()]);
      setItems(maintenance.items);
      setProducts(productList.items);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Không thể tải dữ liệu bảo trì.');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((m) => !search || m.product?.name?.toLowerCase().includes(search.toLowerCase()) || m.reason.toLowerCase().includes(search.toLowerCase()));

  const submit = async () => {
    if (!form.productId || !form.reason || !form.startDate || !form.endDate) {
      toast('error', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    try {
      await createMaintenance({ ...form, cost: Number(form.cost) });
      toast('success', 'Tạo phiếu bảo trì thành công.');
      setShowForm(false);
      setForm({ productId: '', reason: '', startDate: '', endDate: '', cost: 0, note: '' });
      load();
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Không thể tạo phiếu bảo trì.'); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateMaintenance(id, { status });
      toast('success', 'Cập nhật trạng thái bảo trì.');
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
          <button onClick={load} className="p-3 bg-white border border-[#E5E3DF] rounded-lg"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D] transition"><Plus className="w-4 h-4" /> Tạo phiếu bảo trì</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-[#E5E3DF] rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Phiếu bảo trì mới</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm">Trang phục
              <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]">
                <option value="">Chọn trang phục</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </label>
            <label className="block text-sm">Lý do
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Ví dụ: Giặt hấp, sửa khóa..." className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Ngày bắt đầu
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Ngày kết thúc
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Chi phí (VND)
              <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Ghi chú
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
          </div>
          <div className="flex gap-3">
            <button onClick={submit} className="px-5 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D]">Tạo phiếu</button>
            <button onClick={() => setShowForm(false)} className="px-5 py-3 bg-white border border-[#E5E3DF] rounded-lg text-sm">Hủy</button>
          </div>
        </div>
      )}

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
                    <td className="px-6 py-4 font-medium">{m.product?.name || 'Chua co'}</td>
                    <td className="px-6 py-4 text-[#6B6B6B]">{m.reason}</td>
                    <td className="px-6 py-4 text-[#6B6B6B]">{m.startDate ? new Date(m.startDate).toLocaleDateString('vi-VN') : 'Chua co'} den {m.endDate ? new Date(m.endDate).toLocaleDateString('vi-VN') : 'Chua co'}</td>
                    <td className="px-6 py-4">{currency(m.cost)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${m.status === 'done' ? 'bg-[#E8F5EE] text-[#3D8B5F]' : m.status === 'in_progress' ? 'bg-[#FFF4DE] text-[#D99A32]' : 'bg-[#FDECEC] text-[#C94A4A]'}`}>
                        {m.status === 'done' ? 'Hoàn tất' : m.status === 'in_progress' ? 'Đang xử lý' : 'Mở'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {m.status !== 'done' && (
                          <>
                            <button onClick={() => updateStatus(m.id, 'in_progress')} className="text-xs px-3 py-1.5 bg-[#FFF4DE] text-[#D99A32] rounded-lg hover:opacity-80">Bắt đầu</button>
                            <button onClick={() => updateStatus(m.id, 'done')} className="text-xs px-3 py-1.5 bg-[#E8F5EE] text-[#3D8B5F] rounded-lg hover:opacity-80">Hoàn tất</button>
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
          <div className="p-16 text-center text-sm text-[#A0A0A0]">Chưa có phiếu bảo trì nào.</div>
        )}
      </div>
    </div>
  );
}
