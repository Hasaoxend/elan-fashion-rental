'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Loader2, UserCircle } from 'lucide-react';
import { changePassword, getMe } from '@/lib/api';
import { ROLE_LABELS } from '@/lib/labels';
import { links } from '@/components/sidebar';
import { useToast } from '@/components/toast';

const inputClass = 'mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]';

export default function ProfilePage() {
  const { toast } = useToast();
  const [me, setMe] = useState<any>(null);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { getMe().then(setMe).catch((e) => toast('error', e instanceof Error ? e.message : 'Không thể tải tài khoản.')); }, [toast]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword.length < 8) { toast('error', 'Mật khẩu mới tối thiểu 8 ký tự.'); return; }
    if (form.newPassword !== form.confirm) { toast('error', 'Mật khẩu nhập lại không khớp.'); return; }
    setSaving(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setMe((current: any) => ({ ...current, mustChangePassword: false }));
      toast('success', 'Đổi mật khẩu thành công.');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Không thể đổi mật khẩu.');
    } finally { setSaving(false); }
  };

  if (!me) return <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C89B6D]" /></div>;
  const menu = links.filter((l) => !l.roles || l.roles.includes(me.role));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold">Tài khoản của tôi</h1>
        <p className="text-sm text-[#6B6B6B] mt-1">Thông tin đăng nhập và quyền truy cập.</p>
      </div>
      {me.mustChangePassword && <div className="p-4 rounded-xl bg-[#FFF4DE] text-sm text-[#B8843F]">Tài khoản đang dùng mật khẩu được cấp. Vui lòng đổi mật khẩu mới.</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E5E3DF] rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <UserCircle className="w-12 h-12 text-[#C89B6D]" />
            <div><p className="font-semibold">{me.fullName}</p><p className="text-sm text-[#6B6B6B]">{me.email}</p></div>
          </div>
          <p className="text-xs uppercase tracking-widest text-[#A0A0A0] mb-2">Vai trò</p>
          <p className="mb-5"><span className="text-xs px-2 py-1 rounded-full bg-[#F5EDE3] text-[#C89B6D]">{ROLE_LABELS[me.role] || me.role}</span></p>
          <p className="text-xs uppercase tracking-widest text-[#A0A0A0] mb-2">Được truy cập</p>
          <div className="flex flex-wrap gap-2">{menu.map((m) => <span key={m.href} className="text-xs px-2 py-1 rounded-full bg-[#F8F7F5] text-[#6B6B6B]">{m.label}</span>)}</div>
        </div>
        <form onSubmit={submit} className="bg-white border border-[#E5E3DF] rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><KeyRound className="w-4 h-4 text-[#C89B6D]" /> Đổi mật khẩu</h2>
          <label className="block text-sm">Mật khẩu hiện tại<input type="password" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className={inputClass} /></label>
          <label className="block text-sm">Mật khẩu mới<input type="password" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className={inputClass} /><span className="text-xs text-[#A0A0A0]">Tối thiểu 8 ký tự.</span></label>
          <label className="block text-sm">Nhập lại mật khẩu mới<input type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className={inputClass} /></label>
          <button type="submit" disabled={saving || !form.currentPassword || !form.newPassword} className="inline-flex items-center gap-2 px-5 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D] disabled:opacity-40">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Cập nhật mật khẩu</button>
          <p className="text-xs text-[#A0A0A0]">Sau khi đổi, các phiên đăng nhập trên thiết bị khác sẽ phải đăng nhập lại.</p>
        </form>
      </div>
    </div>
  );
}
