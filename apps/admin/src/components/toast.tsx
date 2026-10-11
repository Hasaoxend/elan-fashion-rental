'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface Toast { id: number; type: 'success' | 'error' | 'info'; message: string; }
interface ToastContextValue { toast: (type: Toast['type'], message: string) => void; }

const ToastContext = createContext<ToastContextValue>({ toast: () => undefined });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, type, message }]);
    setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 4000);
  }, []);

  const icons = { success: <CheckCircle2 className="w-5 h-5 text-[#3D8B5F]" />, error: <AlertCircle className="w-5 h-5 text-[#C94A4A]" />, info: <Info className="w-5 h-5 text-[#D99A32]" /> };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[80] space-y-3 w-[320px]">
        {items.map((item) => (
          <div key={item.id} className="bg-white border border-[#E5E3DF] rounded-xl shadow-lg p-4 flex items-start gap-3 animate-slide-in">
            {icons[item.type]}
            <p className="text-sm flex-1">{item.message}</p>
            <button onClick={() => setItems((current) => current.filter((t) => t.id !== item.id))}><X className="w-4 h-4 text-[#A0A0A0]" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }