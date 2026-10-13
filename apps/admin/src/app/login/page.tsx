'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { login, getToken } from '@/lib/api';
import { useToast } from '@/components/toast';

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Admin@123456');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Chỉ cho phép quay lại đường dẫn nội bộ (tránh open redirect qua ?next=https://...).
  const nextParam = search.get('next');
  const next = nextParam?.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/admin';

  useEffect(() => { if (getToken()) router.replace(next); }, [router, next]);

  const submit = async () => {
    setLoading(true);
    try {
      await login(email, password);
      toast('success', 'Đăng nhập thành công.');
      router.push(next);
    } catch (error) { toast('error', error instanceof Error ? error.message : 'Đăng nhập thất bại.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#171717]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[.3em] uppercase text-[#C89B6D] mb-3">Hamin</p>
          <h1 className="text-3xl font-semibold text-white">Không gian quản trị</h1>
        </div>
        <div className="bg-white rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-2">Đăng nhập</h2>
          <p className="text-sm text-[#6B6B6B] mb-6">Dành cho admin và nhân viên. Tài khoản do admin cấp.</p>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <label className="block text-sm">Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" /></label>
            <label className="block text-sm">Mật khẩu<div className="relative mt-2"><input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-3 top-1/2 -translate-y-1/2">{showPassword ? <EyeOff className="w-4 h-4 text-[#A0A0A0]" /> : <Eye className="w-4 h-4 text-[#A0A0A0]" />}</button></div></label>
            <button type="submit" disabled={loading || !email || !password} className="w-full py-3.5 bg-[#171717] text-white rounded-lg font-medium hover:bg-[#C89B6D] disabled:opacity-40 flex items-center justify-center gap-2">{loading && <Loader2 className="w-4 h-4 animate-spin" />}{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
            <p className="text-xs text-center text-[#A0A0A0]">Demo admin: admin@example.com / Admin@123456<br />Demo nhân viên: nhanvien@example.com / Staff@123456</p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() { return <Suspense><LoginForm /></Suspense>; }