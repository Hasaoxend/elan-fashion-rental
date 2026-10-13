'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, CheckCircle2 } from 'lucide-react';
import type { StoreInfo } from '@/lib/api';

export function ContactView({ store }: { store: StoreInfo }) {
  const STORE_EMAIL = store['store.email'];
  const ADDRESS = store['store.address'];
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  // Chưa có API nhận tin nhắn: mở ứng dụng email của khách với nội dung soạn sẵn.
  const send = () => {
    const body = `${form.message}\n\n—\nHọ tên: ${form.name}\nEmail: ${form.email}${form.phone ? `\nSố điện thoại: ${form.phone}` : ''}`;
    window.location.href = `mailto:${STORE_EMAIL}?subject=${encodeURIComponent(`Liên hệ từ ${form.name}`)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl mb-12">
        <p className="text-sm tracking-[0.2em] uppercase text-[#C89B6D] mb-3">Liên hệ</p>
        <h1 className="font-display text-5xl mb-4">Chúng tôi luôn sẵn sàng hỗ trợ</h1>
        <p className="text-[#6B6B6B]">Gửi câu hỏi hoặc ghé thăm showroom để trải nghiệm trực tiếp bộ sưu tập.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12">
        <div className="bg-white border border-[#E5E3DF] rounded-2xl p-8">
          {submitted ? (
            <div className="py-16 text-center">
              <CheckCircle2 className="w-14 h-14 text-[#3D8B5F] mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Đã mở ứng dụng email</h2>
              <p className="text-sm text-[#6B6B6B] mb-6">Hãy bấm Gửi trong ứng dụng email để hoàn tất. Nếu ứng dụng không mở, bạn có thể gửi trực tiếp tới <a href={`mailto:${STORE_EMAIL}`} className="text-[#C89B6D] underline">{STORE_EMAIL}</a>.</p>
              <button onClick={() => setSubmitted(false)} className="text-sm text-[#6B6B6B] underline hover:text-[#171717]">Quay lại form</button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-6">Gửi tin nhắn</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="text-sm">Họ và tên<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" /></label>
                  <label className="text-sm">Số điện thoại<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" /></label>
                </div>
                <label className="block text-sm">Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" autoComplete="email" className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" /></label>
                <label className="block text-sm">Nội dung<textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D] resize-none" /></label>
                <button
                  disabled={!form.name || !/^\S+@\S+\.\S+$/.test(form.email) || !form.message}
                  onClick={send}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#171717] text-white rounded-lg font-medium hover:bg-[#C89B6D] disabled:opacity-40 transition"
                >
                  Gửi tin nhắn
                </button>
              </div>
            </>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-[#E5E3DF] rounded-2xl p-6">
            <h3 className="font-semibold mb-4">{store['store.legalName']}</h3>
            <div className="space-y-4 text-sm">
              <p className="flex items-start gap-3"><MapPin className="w-5 h-5 text-[#C89B6D] shrink-0" />{ADDRESS}</p>
              <a href={`tel:${store['store.phone'].replace(/[^\d+]/g, '')}`} className="flex items-center gap-3 hover:text-[#C89B6D]"><Phone className="w-5 h-5 text-[#C89B6D]" />{store['store.phone']}</a>
              <a href={`mailto:${STORE_EMAIL}`} className="flex items-center gap-3 hover:text-[#C89B6D]"><Mail className="w-5 h-5 text-[#C89B6D]" />{STORE_EMAIL}</a>
              <p className="flex items-start gap-3"><Clock className="w-5 h-5 text-[#C89B6D] shrink-0" />{store['store.hours']}</p>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#E9E5DF]">
            <iframe title="Bản đồ showroom" src={`https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&output=embed`} className="absolute inset-0 w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </div>
      </div>
    </div>
  );
}
