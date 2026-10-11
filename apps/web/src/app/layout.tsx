import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin', 'vietnamese'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'Fashion Rental — Thuê trang phục cho những khoảnh khắc đặc biệt',
  description: 'Khám phá hàng trăm thiết kế thời trang cao cấp và đặt lịch thuê chỉ trong vài phút.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} ${playfair.variable} bg-[#F8F7F5] text-[#171717] antialiased`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
