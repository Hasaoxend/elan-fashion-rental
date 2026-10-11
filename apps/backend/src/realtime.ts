import type { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export function initSocket(server: HttpServer, allowedOrigins: string[]): SocketServer {
  io = new SocketServer(server, {
    cors: { origin: allowedOrigins, credentials: true },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    // Client chủ động subscribe vào các room theo vai trò.
    // Room 'admin' nhận mọi sự kiện vận hành; room user:{id} nhận thông báo cá nhân.
    socket.on('subscribe', (payload: { rooms?: string[] } | string) => {
      const rooms = typeof payload === 'string' ? [payload] : payload?.rooms ?? [];
      for (const room of rooms) {
        if (typeof room === 'string' && room.length < 120) {
          socket.join(room);
        }
      }
    });

    socket.on('unsubscribe', (room: string) => {
      if (typeof room === 'string') socket.leave(room);
    });
  });

  return io;
}

/** Phát sự kiện tới toàn bộ client đang lắng nghe. */
export function emitEvent(event: string, payload: unknown, rooms?: string | string[]): void {
  if (!io) return;
  const target = rooms ?? 'admin';
  io.to(target).emit(event, payload);
}

export function getSocket(): SocketServer | null {
  return io;
}