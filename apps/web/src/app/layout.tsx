import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getStoreInfo } from '@/lib/api';

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin', 'vietnamese'], variable: '--font-playfair' });

// API tạm lỗi thì site vẫn hiển thị được, chỉ thiếu thông tin liên hệ.
const loadStore = () => getStoreInfo().catch(() => null);

export async function generateMetadata(): Promise<Metadata> {
  const store = await loadStore();
  const name = store?.['store.name'] ?? 'Hamin';
  return {
    title: { default: `${name} — ${store?.['store.tagline'] ?? 'Thuê trang phục'}`, template: `%s — ${name}` },
    description: 'Khám phá hàng trăm thiết kế thời trang cao cấp và đặt lịch thuê chỉ trong vài phút.',
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const store = await loadStore();
  return (
    <html lang="vi">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-[#F8F7F5] text-[#171717] antialiased`}>
        <Header storeName={store?.['store.name'] ?? 'Hamin'} />
        <main>{children}</main>
        <Footer store={store} />
      </body>
    </html>
  );
}
