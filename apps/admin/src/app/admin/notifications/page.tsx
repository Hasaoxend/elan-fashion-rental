'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Loader2, Check, ShoppingBag, CreditCard, Ban, Wrench } from 'lucide-react';
import { getNotifications, getToken } from '@/lib/api';
import { useToast } from '@/components/toast';
import { useRealtime } from '@/lib/realtime';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const icons: Record<string, any> = { new_booking: ShoppingBag, payment: CreditCard, cancellation: Ban, maintenance: Wrench, system: Bell };

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { events } = useRealtime(['admin']);
  const load = useCallback(async () => { setLoading(true); try { setItems((await getNotifications()).items); } catch (e) { toast('error', e instanceof Error ? e.message : 'Không thể tải thông báo.'); } finally { setLoading(false); } }, [toast]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (events[0]?.event === 'notification.created') load(); }, [events, load]);
  const markRead = async (id: string) => { try { await fetch(`${API_URL}/admin/notifications/${id}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${getToken()}` } }); setItems((current) => current.map((n) => n.id === id ? { ...n, isRead: true } : n)); } catch { /* giữ trạng thái cũ */ } };
  const unread = items.filter((n) => !n.isRead).length;
  return <div className="space-y-8"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-semibold">Thông báo</h1><p className="text-sm text-[#6B6B6B] mt-1">{unread} thông báo chưa đọc.</p></div></div><div className="bg-white border border-[#E5E3DF] rounded-2xl overflow-hidden">{loading ? <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C89B6D]" /></div> : items.length ? <div className="divide-y divide-[#F3F2F0]">{items.map((item) => { const Icon = icons[item.type] || Bell; return <div key={item.id} className={`flex items-start gap-4 p-5 ${item.isRead ? '' : 'bg-[#FAF9F8]'}`}><div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.isRead ? 'bg-[#F3F2F0] text-[#A0A0A0]' : 'bg-[#F5EDE3] text-[#C89B6D]'}`}><Icon className="w-5 h-5" /></div><div className="flex-1"><p className="font-medium text-sm">{item.title}</p><p className="text-sm text-[#6B6B6B] mt-1">{item.body}</p><p className="text-xs text-[#A0A0A0] mt-2">{new Date(item.createdAt).toLocaleString('vi-VN')}</p></div><div className="flex items-center gap-2 shrink-0">{item.entityType === 'booking' && item.entityId && <Link href="/admin/bookings" className="text-xs text-[#C89B6D] hover:underline">Xem đơn</Link>}{!item.isRead && <button onClick={() => markRead(item.id)} className="p-2 text-[#A0A0A0] hover:text-[#3D8B5F]" title="Đánh dấu đã đọc"><Check className="w-4 h-4" /></button>}</div></div>; })}</div> : <div className="p-16 text-center text-sm text-[#A0A0A0]"><Bell className="w-8 h-8 mx-auto mb-3 text-[#D0CDC8]" />Chưa có thông báo nào.</div>}</div></div>;
}