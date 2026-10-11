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

  useEffect(() => { if (getToken()) router.replace(search.get('next') || '/admin'); }, [router, search]);

  const submit = async () => {
    setLoading(true);
    try {
      await login(email, password);
      toast('success', 'Đăng nhập thành công.');
      router.push(search.get('next') || '/admin');
    } catch (error) { toast('error', error instanceof Error ? error.message : 'Đăng nhập thất bại.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#171717]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[.3em] uppercase text-[#C89B6D] mb-3">Fashion Rental</p>
          <h1 className="text-3xl font-semibold text-white">Không gian quản trị</h1>
        </div>
        <div className="bg-white rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-2">Đăng nhập</h2>
          <p className="text-sm text-[#6B6B6B] mb-6">Sử dụng tài khoản quản trị được cấp.</p>
          <div className="space-y-4">
            <label className="block text-sm">Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" /></label>
            <label className="block text-sm">Mật khẩu<div className="relative mt-2"><input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} className="w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">{showPassword ? <EyeOff className="w-4 h-4 text-[#A0A0A0]" /> : <Eye className="w-4 h-4 text-[#A0A0A0]" />}</button></div></label>
            <button onClick={submit} disabled={loading || !email || !password} className="w-full py-3.5 bg-[#171717] text-white rounded-lg font-medium hover:bg-[#C89B6D] disabled:opacity-40 flex items-center justify-center gap-2">{loading && <Loader2 className="w-4 h-4 animate-spin" />}{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
            <p className="text-xs text-center text-[#A0A0A0]">Tài khoản demo: admin@example.com / Admin@123456</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() { return <Suspense><LoginForm /></Suspense>; }