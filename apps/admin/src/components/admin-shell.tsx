'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { ToastProvider } from './toast';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAuthRoute = pathname === '/login';

  return (
    <ToastProvider>
      {isAuthRoute ? (
        <div className="min-h-screen bg-[#F8F7F5]">{children}</div>
      ) : (
        <div className="min-h-screen bg-[#F8F7F5]">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="lg:pl-64">
            <Topbar onMenuOpen={() => setSidebarOpen(true)} />
            <main className="p-4 sm:p-8">{children}</main>
          </div>
        </div>
      )}
    </ToastProvider>
  );
}