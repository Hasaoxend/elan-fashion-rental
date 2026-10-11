'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

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
              <h2 className="text-xl font-semibold mb-2">Thông tin đã sẵn sàng</h2>
              <p className="text-sm text-[#6B6B6B]">Form minh họa không lưu dữ liệu. Bạn có thể liên hệ trực tiếp qua số điện thoại hoặc email bên dưới.</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-6">Gửi tin nhắn</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="text-sm">Họ và tên<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" /></label>
                  <label className="text-sm">Số điện thoại<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" /></label>
                </div>
                <label className="block text-sm">Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" /></label>
                <label className="block text-sm">Nội dung<textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D] resize-none" /></label>
                <button
                  disabled={!form.name || !form.email || !form.message}
                  onClick={() => setSubmitted(true)}
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
            <h3 className="font-semibold mb-4">Thông tin showroom</h3>
            <div className="space-y-4 text-sm">
              <p className="flex items-start gap-3"><MapPin className="w-5 h-5 text-[#C89B6D] shrink-0" />123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
              <p className="flex items-center gap-3"><Phone className="w-5 h-5 text-[#C89B6D]" />+84 28 1234 5678</p>
              <p className="flex items-center gap-3"><Mail className="w-5 h-5 text-[#C89B6D]" />hello@fashionrental.vn</p>
              <p className="flex items-start gap-3"><Clock className="w-5 h-5 text-[#C89B6D] shrink-0" />Thứ 2 - Chủ nhật: 9:00 - 21:00</p>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#E9E5DF]">
            <div className="absolute inset-0 flex items-center justify-center text-[#A0A0A0] text-sm">Bản đồ showroom</div>
          </div>
        </div>
      </div>
    </div>
  );
}
