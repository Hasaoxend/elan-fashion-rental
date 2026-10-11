'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

export interface RealtimeEvent { event: string; payload: any; at: number; }

/**
 * Kết nối Socket.IO và đăng ký room admin. Trả về danh sách sự kiện gần nhất
 * để UI tự cập nhật counter doanh thu/đơn hàng mà không cần reload.
 */
export function useRealtime(rooms: string[] = ['admin']) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'], reconnection: true });
    socketRef.current = socket;
    socket.on('connect', () => { setConnected(true); socket.emit('subscribe', { rooms }); });
    socket.on('disconnect', () => setConnected(false));

    const handler = (event: string) => (payload: any) => setEvents((current) => [{ event, payload, at: Date.now() }, ...current].slice(0, 50));
    const names = ['booking.created', 'booking.updated', 'booking.confirmed', 'booking.cancelled', 'booking.returned', 'product.updated', 'inventory.updated', 'payment.updated', 'notification.created'];
    for (const name of names) socket.on(name, handler(name));

    return () => { socket.disconnect(); socketRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { connected, events, socket: socketRef };
}