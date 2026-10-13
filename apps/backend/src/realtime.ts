import type { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { STAFF_ROLES, verifyAccessToken, type AuthUser } from './middleware/auth';

let io: SocketServer | null = null;

export function initSocket(server: HttpServer, allowedOrigins: string[]): SocketServer {
  io = new SocketServer(server, {
    cors: { origin: allowedOrigins, credentials: true },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    // Xác thực bằng access token gửi qua handshake (socket.io-client: { auth: { token } }).
    let user: AuthUser | null = null;
    const token = socket.handshake.auth?.token;
    if (typeof token === 'string') {
      try { user = verifyAccessToken(token); } catch { user = null; }
    }

    // Room 'admin' (sự kiện vận hành: tên khách, mã đơn, số tiền) chỉ dành cho nhân viên;
    // room user:{id} chỉ cho chính người dùng đó. Room khác bị bỏ qua.
    socket.on('subscribe', (payload: { rooms?: string[] } | string) => {
      const rooms = typeof payload === 'string' ? [payload] : payload?.rooms ?? [];
      for (const room of rooms) {
        const allowed = (room === 'admin' && user !== null && STAFF_ROLES.includes(user.role)) || (user !== null && room === `user:${user.id}`);
        if (allowed) socket.join(room);
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