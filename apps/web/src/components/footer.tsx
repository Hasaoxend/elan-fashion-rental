import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#171717] text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3 className="text-2xl font-bold mb-4">FASHION RENTAL</h3>
            <p className="text-[#A0A0A0] text-sm leading-relaxed">
              Thuê trang phục cao cấp cho những khoảnh khắc đặc biệt. Phong cách của bạn, câu chuyện của bạn.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Khám phá</h4>
            <div className="flex flex-col gap-3 text-sm text-[#A0A0A0]">
              <Link href="/collections" className="hover:text-white transition">Bộ sưu tập</Link>
              <Link href="/products" className="hover:text-white transition">Trang phục</Link>
              <Link href="/about" className="hover:text-white transition">Về chúng tôi</Link>
              <Link href="/contact" className="hover:text-white transition">Liên hệ</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Hỗ trợ</h4>
            <div className="flex flex-col gap-3 text-sm text-[#A0A0A0]">
              <Link href="/faq" className="hover:text-white transition">Câu hỏi thường gặp</Link>
              <Link href="/shipping" className="hover:text-white transition">Chính sách giao hàng</Link>
              <Link href="/returns" className="hover:text-white transition">Chính sách đổi trả</Link>
              <Link href="/terms" className="hover:text-white transition">Điều khoản sử dụng</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Liên hệ</h4>
            <div className="flex flex-col gap-3 text-sm text-[#A0A0A0]">
              <p>123 Nguyễn Huệ, Quận 1, TP.HCM</p>
              <p>+84 28 1234 5678</p>
              <p>hello@fashionrental.vn</p>
              <p>Thứ 2 - Chủ nhật: 9:00 - 21:00</p>
            </div>
          </div>
        </div>
        <div className="border-t border-[#333] mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[#A0A0A0]">
          <p>© 2026 Fashion Rental. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition">Chính sách bảo mật</Link>
            <Link href="/terms" className="hover:text-white transition">Điều khoản</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
