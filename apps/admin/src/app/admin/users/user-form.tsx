'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, UserCircle } from 'lucide-react';
import { createUser, getRoles, getUser, updateUser } from '@/lib/api';
import { ROLE_LABELS } from '@/lib/labels';
import { EditorTabs } from '@/components/editor-tabs';
import { links } from '@/components/sidebar';
import { useToast } from '@/components/toast';

const inputClass = 'mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D] disabled:bg-[#F8F7F5] disabled:text-[#A0A0A0]';

export function UserForm({ userId }: { userId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [roles, setRoles] = useState<any[]>([]);
  const [form, setForm] = useState({ email: '', fullName: '', password: '', roleId: '', isActive: true, mustChangePassword: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getRoles(), userId ? getUser(userId) : Promise.resolve(null)])
      .then(([roleList, user]) => {
        setRoles(roleList.items);
        if (user) setForm({ email: user.email, fullName: user.fullName, password: '', roleId: user.roleId, isActive: user.isActive, mustChangePassword: user.mustChangePassword });
        else setForm((current) => ({ ...current, roleId: roleList.items[0]?.id ?? '' }));
      })
      .catch((e) => toast('error', e instanceof Error ? e.message : 'Không thể tải người dùng.'))
      .finally(() => setLoading(false));
  }, [userId, toast]);

  const roleName: string = roles.find((r) => r.id === form.roleId)?.name ?? '';
  const menu = links.filter((l) => !l.roles || l.roles.includes(roleName));

  const submit = async () => {
    if (form.fullName.trim().length < 2) { toast('error', 'Họ tên tối thiểu 2 ký tự.'); return; }
    if (!userId && !/^\S+@\S+\.\S+$/.test(form.email)) { toast('error', 'Email không hợp lệ.'); return; }
    if (!userId && form.password.length < 8) { toast('error', 'Mật khẩu tối thiểu 8 ký tự.'); return; }
    if (!form.roleId) { toast('error', 'Vui lòng chọn vai trò.'); return; }
    setSaving(true);
    try {
      if (userId) await updateUser(userId, { fullName: form.fullName, roleId: form.roleId, isActive: form.isActive, mustChangePassword: form.mustChangePassword });
      else await createUser(form);
      toast('success', userId ? 'Cập nhật người dùng thành công.' : 'Tạo người dùng thành công.');
      router.push('/admin/users');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Không thể lưu người dùng.');
    } finally { setSaving(false); }
  };

  const preview = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-[#A0A0A0] mb-4">Hiển thị trong danh sách</p>
        <div className="flex items-center gap-4 p-5 border border-[#E5E3DF] rounded-xl">
          <UserCircle className="w-10 h-10 text-[#C89B6D] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{form.fullName || <span className="text-[#A0A0A0]">Họ tên</span>}</p>
            <p className="text-xs text-[#A0A0A0] truncate">{form.email || 'email@example.com'}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-[#F5EDE3] text-[#C89B6D]">{ROLE_LABELS[roleName] || roleName}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${form.isActive ? 'bg-[#E8F5EE] text-[#3D8B5F]' : 'bg-[#FDECEC] text-[#C94A4A]'}`}>{form.isActive ? 'Hoạt động' : 'Đã khóa'}</span>
          </div>
        </div>
        {!form.isActive && <p className="text-sm text-[#C94A4A] mt-3">Tài khoản bị khóa sẽ không đăng nhập được.</p>}
        {form.mustChangePassword && <p className="text-sm text-[#6B6B6B] mt-3">Người dùng sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập kế tiếp.</p>}
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-[#A0A0A0] mb-4">Các mục menu được truy cập</p>
        <div className="bg-[#171717] rounded-xl p-3 space-y-1">
          {menu.map(({ href, label, icon: Icon }) => (
            <div key={href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70"><Icon className="w-4 h-4" />{label}</div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#171717]"><ArrowLeft className="w-4 h-4" /> Quay lại danh sách</Link>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{userId ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Chuyển sang tab “Xem trước” để kiểm tra vai trò và quyền truy cập.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/users" className="px-5 py-3 bg-white border border-[#E5E3DF] rounded-lg text-sm">Hủy</Link>
          <button onClick={submit} disabled={saving || loading} className="inline-flex items-center gap-2 px-5 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D] disabled:opacity-40">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}{userId ? 'Lưu thay đổi' : 'Tạo người dùng'}
          </button>
        </div>
      </div>

      {loading ? <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C89B6D]" /></div> : (
        <EditorTabs preview={preview}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm">Email *
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" disabled={Boolean(userId)} className={inputClass} />
              {userId && <span className="text-xs text-[#A0A0A0]">Không thể đổi email.</span>}
            </label>
            <label className="block text-sm">Họ tên *<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass} /></label>
            {!userId && (
              <label className="block text-sm">Mật khẩu *
                <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" autoComplete="new-password" className={inputClass} />
                <span className="text-xs text-[#A0A0A0]">Tối thiểu 8 ký tự.</span>
              </label>
            )}
            <label className="block text-sm">Vai trò *
              <select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} className={inputClass}>
                {roles.map((r) => <option key={r.id} value={r.id}>{ROLE_LABELS[r.name] || r.name}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-[#C89B6D]" /><span className="text-sm">Cho phép đăng nhập</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.mustChangePassword} onChange={(e) => setForm({ ...form, mustChangePassword: e.target.checked })} className="w-4 h-4 accent-[#C89B6D]" /><span className="text-sm">Yêu cầu đổi mật khẩu ở lần đăng nhập kế tiếp</span></label>
          </div>
        </EditorTabs>
      )}
    </div>
  );
}
