'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Plus, Search, ShieldCheck, Shield, ShieldAlert, Trash2, Pencil } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, getRoles } from '@/lib/api';
import { useToast } from '@/components/toast';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ email: '', fullName: '', password: '', roleId: '', isActive: true, mustChangePassword: false });
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [userList, roleList] = await Promise.all([getUsers(), getRoles()]);
      setUsers(userList.items);
      setRoles(roleList.items);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Không thể tải danh sách người dùng.');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) => !search || u.email.toLowerCase().includes(search.toLowerCase()) || u.fullName.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditing(null);
    setForm({ email: '', fullName: '', password: '', roleId: roles[0]?.id || '', isActive: true, mustChangePassword: false });
    setShowForm(true);
  };

  const openEdit = (user: any) => {
    setEditing(user);
    setForm({ email: user.email, fullName: user.fullName, password: '', roleId: user.roleId, isActive: user.isActive, mustChangePassword: user.mustChangePassword });
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.email || !form.fullName || !form.roleId) {
      toast('error', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (!editing && !form.password) {
      toast('error', 'Vui lòng nhập mật khẩu.');
      return;
    }
    try {
      if (editing) {
        await updateUser(editing.id, { fullName: form.fullName, roleId: form.roleId, isActive: form.isActive, mustChangePassword: form.mustChangePassword });
        toast('success', 'Cập nhật người dùng thành công.');
      } else {
        await createUser({ email: form.email, fullName: form.fullName, password: form.password, roleId: form.roleId });
        toast('success', 'Tạo người dùng thành công.');
      }
      setShowForm(false);
      load();
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Không thể lưu người dùng.'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa người dùng này?')) return;
    try {
      await deleteUser(id);
      toast('success', 'Xóa người dùng thành công.');
      load();
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Không thể xóa người dùng.'); }
  };

  const roleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name || roleId;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Quản trị viên</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Quản lý tài khoản, vai trò và phân quyền.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-3 bg-white border border-[#E5E3DF] rounded-lg"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D] transition"><Plus className="w-4 h-4" /> Thêm người dùng</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-[#E5E3DF] rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">{editing ? 'Cập nhật người dùng' : 'Người dùng mới'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm">Email
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" disabled={!!editing} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D] disabled:bg-[#F8F7F5]" />
            </label>
            <label className="block text-sm">Họ tên
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            {!editing && (
              <label className="block text-sm">Mật khẩu
                <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
              </label>
            )}
            <label className="block text-sm">Vai trò
              <select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]">
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm">Kích hoạt</span>
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input type="checkbox" checked={form.mustChangePassword} onChange={(e) => setForm({ ...form, mustChangePassword: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm">Yêu cầu đổi mật khẩu lần đầu</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button onClick={submit} className="px-5 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D]">Lưu</button>
            <button onClick={() => setShowForm(false)} className="px-5 py-3 bg-white border border-[#E5E3DF] rounded-lg text-sm">Hủy</button>
          </div>
        </div>
      )}

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
                      <p className="font-medium">{u.fullName}</p>
                      <p className="text-xs text-[#A0A0A0]">{u.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-[#F5EDE3] text-[#C89B6D]">
                        {roleName(u.roleId) === 'SUPER_ADMIN' ? <ShieldCheck className="w-3 h-3" /> : roleName(u.roleId) === 'ADMIN' ? <Shield className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {roleName(u.roleId)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${u.isActive ? 'bg-[#E8F5EE] text-[#3D8B5F]' : 'bg-[#FDECEC] text-[#C94A4A]'}`}>
                        {u.isActive ? 'Hoạt động' : 'Khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(u)} className="p-2 text-[#6B6B6B] hover:text-[#171717]"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => remove(u.id)} className="p-2 text-[#C94A4A] hover:text-[#A03030]"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-sm text-[#A0A0A0]">Chưa có người dùng nào.</div>
        )}
      </div>
    </div>
  );
}
