'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, Plus, Search, ShieldCheck, Shield, ShieldAlert, Trash2, Pencil } from 'lucide-react';
import { getUsers, deleteUser } from '@/lib/api';
import { ROLE_LABELS } from '@/lib/labels';
import { useToast } from '@/components/toast';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers((await getUsers()).items);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Không thể tải danh sách người dùng.');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const keyword = search.toLowerCase();
  const filtered = users.filter((u) => !search || u.email.toLowerCase().includes(keyword) || u.fullName.toLowerCase().includes(keyword));

  const remove = async (user: any) => {
    if (!confirm(`Xóa người dùng "${user.fullName}"?`)) return;
    try {
      await deleteUser(user.id);
      toast('success', 'Xóa người dùng thành công.');
      load();
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Không thể xóa người dùng.'); }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Tài khoản nhân viên</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Chỉ admin tạo và quản lý tài khoản. Vai trò quyết định các mục nhân viên được truy cập.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} title="Làm mới" aria-label="Làm mới" className="p-3 bg-white border border-[#E5E3DF] rounded-lg hover:border-[#171717]"><RefreshCw className="w-4 h-4" /></button>
          <Link href="/admin/users/new" className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D] transition"><Plus className="w-4 h-4" /> Thêm người dùng</Link>
        </div>
      </div>

      <div className="bg-white border border-[#E5E3DF] rounded-2xl p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-[#A0A0A0]" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo email hoặc họ tên..." className="flex-1 bg-transparent outline-none text-sm" />
      </div>

      <div className="bg-white border border-[#E5E3DF] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C89B6D]" /></div>
        ) : filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-[#A0A0A0] bg-[#FAF9F8]">
                <tr>
                  <th className="px-6 py-4 font-medium">Người dùng</th>
                  <th className="px-6 py-4 font-medium">Vai trò</th>
                  <th className="px-6 py-4 font-medium">Trạng thái</th>
                  <th className="px-6 py-4 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F2F0]">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAF9F8]">
                    <td className="px-6 py-4">
                      <Link href={`/admin/users/${u.id}/edit`} className="font-medium hover:text-[#C89B6D]">{u.fullName}</Link>
                      <p className="text-xs text-[#A0A0A0]">{u.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-[#F5EDE3] text-[#C89B6D]">
                        {u.role.name === 'SUPER_ADMIN' ? <ShieldCheck className="w-3 h-3" /> : u.role.name === 'ADMIN' ? <Shield className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {ROLE_LABELS[u.role.name] || u.role.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${u.isActive ? 'bg-[#E8F5EE] text-[#3D8B5F]' : 'bg-[#FDECEC] text-[#C94A4A]'}`}>
                        {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link href={`/admin/users/${u.id}/edit`} title="Chỉnh sửa" aria-label="Chỉnh sửa" className="p-2 text-[#6B6B6B] hover:text-[#171717]"><Pencil className="w-4 h-4" /></Link>
                        <button onClick={() => remove(u)} title="Xóa" aria-label="Xóa" className="p-2 text-[#C94A4A] hover:text-[#A03030]"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-sm text-[#A0A0A0]">{search ? 'Không tìm thấy người dùng phù hợp.' : 'Chưa có người dùng nào.'}</div>
        )}
      </div>
    </div>
  );
}
