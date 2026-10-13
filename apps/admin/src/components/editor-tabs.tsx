'use client';

import { useState } from 'react';
import { Eye, PenLine } from 'lucide-react';

/** Khung form có 2 tab "Nhập thông tin" / "Xem trước" giống trình soạn issue của GitHub. */
export function EditorTabs({ preview, children }: { preview: React.ReactNode; children: React.ReactNode }) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const tabs = [
    { key: 'write' as const, label: 'Nhập thông tin', icon: PenLine },
    { key: 'preview' as const, label: 'Xem trước', icon: Eye },
  ];

  return (
    <div className="bg-white border border-[#E5E3DF] rounded-2xl overflow-hidden">
      <div role="tablist" className="flex gap-1 px-3 pt-3 bg-[#FAF9F8] border-b border-[#E5E3DF]">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-t-lg border transition ${tab === key ? 'bg-white border-[#E5E3DF] border-b-white font-medium text-[#171717]' : 'border-transparent text-[#6B6B6B] hover:text-[#171717]'}`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="p-6">{tab === 'write' ? children : preview}</div>
    </div>
  );
}
