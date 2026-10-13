import './globals.css';
import { AdminShell } from '@/components/admin-shell';

export const metadata = { title: 'Hamin — Quản trị' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body><AdminShell>{children}</AdminShell></body></html>;
}
