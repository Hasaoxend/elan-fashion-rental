'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { register } from '@/lib/api';

const inputClass = 'mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D] bg-white';

function RegisterForm() {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', confirm: '', agree: false });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (form.fullName.trim().length < 2) return 'Vui lòng nhập họ và tên.';
    if (!/^(\+?84|0)\d{9}$/.test(form.phone.replace(/[\s.-]/g, ''))) return 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Email không hợp lệ.';
    if (form.password.length < 8) return 'Mật khẩu tối thiểu 8 ký tự.';
    if (form.password !== form.confirm) return 'Mật khẩu nhập lại không khớp.';
    if (!form.agree) return 'Vui lòng đồng ý với điều khoản thuê trang phục.';
    return '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = validate();
    if (message) { setError(message); return; }
    setLoading(true); setError('');
    try {
      await register({ fullName: form.fullName.trim(), phone: form.phone, email: form.email.trim(), password: form.password });
      router.push(next?.startsWith('/') && !next.startsWith('//') ? next : '/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo tài khoản.');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 min-h-[70vh]">
      <div className="text-center mb-8">
        <p className="text-sm tracking-[.2em] uppercase text-[#C89B6D] mb-3">Thành viên</p>
        <h1 className="font-display text-4xl mb-3">Tạo tài khoản</h1>
        <p className="text-[#6B6B6B] text-sm">Theo dõi đơn thuê, đặt lịch nhanh hơn và quản lý thông tin của bạn.</p>
      </div>
      <form onSubmit={submit} className="bg-white border border-[#E5E3DF] rounded-2xl p-6 sm:p-8 space-y-4" noValidate>
        <label className="block text-sm">Họ và tên<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} autoComplete="name" className={inputClass} /></label>
        <label className="block text-sm">Số điện thoại<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} type="tel" inputMode="tel" autoComplete="tel" placeholder="09xx xxx xxx" className={inputClass} /></label>
        <label className="block text-sm">Email (Gmail)<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" autoComplete="email" placeholder="ten@gmail.com" className={inputClass} /></label>
        <label className="block text-sm">Mật khẩu
          <div className="relative">
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type={showPassword ? 'text' : 'password'} autoComplete="new-password" className={inputClass} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-3 top-1/2 translate-y-[-25%] text-[#A0A0A0]">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          </div>
          <span className="text-xs text-[#A0A0A0]">Tối thiểu 8 ký tự.</span>
        </label>
        <label className="block text-sm">Nhập lại mật khẩu<input value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} type={showPassword ? 'text' : 'password'} autoComplete="new-password" className={inputClass} /></label>
        <label className="flex items-start gap-2 text-sm text-[#6B6B6B]"><input type="checkbox" checked={form.agree} onChange={(e) => setForm({ ...form, agree: e.target.checked })} className="mt-1 accent-[#C89B6D]" />Tôi đồng ý với điều khoản thuê trang phục và chính sách đặt cọc của cửa hàng.</label>
        {error && <p className="text-sm text-[#C94A4A]" role="alert">{error}</p>}
        <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#171717] text-white rounded-lg font-medium hover:bg-[#C89B6D] disabled:opacity-40 flex items-center justify-center gap-2 transition">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Tạo tài khoản
        </button>
        <p className="text-xs text-[#A0A0A0] text-center">Đã từng đặt đơn không cần tài khoản? Đăng ký bằng đúng số điện thoại và email đã dùng để xem lại các đơn cũ.</p>
      </form>
      <p className="text-center text-sm text-[#6B6B6B] mt-6">Đã có tài khoản? <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-[#C89B6D] font-medium hover:underline">Đăng nhập</Link></p>
    </div>
  );
}

export default function RegisterPage() { return <Suspense><RegisterForm /></Suspense>; }
