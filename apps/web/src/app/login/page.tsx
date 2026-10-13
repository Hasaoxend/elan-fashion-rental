'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import { login } from '@/lib/api';

const inputClass = 'mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D] bg-white';

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(account.trim(), password);
      router.push(next?.startsWith('/') && !next.startsWith('//') ? next : '/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 min-h-[70vh]">
      <div className="text-center mb-8">
        <p className="text-sm tracking-[.2em] uppercase text-[#C89B6D] mb-3">Chào mừng trở lại</p>
        <h1 className="font-display text-4xl mb-3">Đăng nhập</h1>
        <p className="text-[#6B6B6B] text-sm">Dùng số điện thoại hoặc email đã đăng ký.</p>
      </div>
      <form onSubmit={submit} className="bg-white border border-[#E5E3DF] rounded-2xl p-6 sm:p-8 space-y-4">
        <label className="block text-sm">Số điện thoại hoặc email<input value={account} onChange={(e) => setAccount(e.target.value)} autoComplete="username" className={inputClass} /></label>
        <label className="block text-sm">Mật khẩu
          <div className="relative">
            <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" className={inputClass} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-3 top-1/2 translate-y-[-25%] text-[#A0A0A0]">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          </div>
        </label>
        {error && <p className="text-sm text-[#C94A4A]" role="alert">{error}</p>}
        <button type="submit" disabled={loading || !account || !password} className="w-full py-3.5 bg-[#171717] text-white rounded-lg font-medium hover:bg-[#C89B6D] disabled:opacity-40 flex items-center justify-center gap-2 transition">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />} Đăng nhập
        </button>
        <p className="text-xs text-[#A0A0A0] text-center">Quên mật khẩu? Vui lòng <Link href="/contact" className="underline">liên hệ cửa hàng</Link> để được hỗ trợ.</p>
      </form>
      <p className="text-center text-sm text-[#6B6B6B] mt-6">Chưa có tài khoản? <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-[#C89B6D] font-medium hover:underline">Tạo tài khoản</Link></p>
      <p className="text-center text-xs text-[#A0A0A0] mt-3">Không cần tài khoản vẫn có thể đặt lịch và <Link href="/orders" className="underline">tra cứu đơn</Link>.</p>
    </div>
  );
}

export default function LoginPage() { return <Suspense><LoginForm /></Suspense>; }
