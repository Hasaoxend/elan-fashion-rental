// Phiên đăng nhập của khách lưu ở trình duyệt (không import React: api.ts dùng cả ở server component).
const KEY = 'customer_session';
const EVENT = 'session-change';

interface Session { user: { id: string; email: string; fullName: string; role: string; customerId?: string }; accessToken: string; refreshToken: string; }

let cache: { raw: string | null; session: Session | null } = { raw: null, session: null };

function read(): Session | null {
  if (typeof window === 'undefined') return null;
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(KEY); } catch { return null; }
  if (raw !== cache.raw) {
    let session: Session | null = null;
    try { session = raw ? JSON.parse(raw) : null; } catch { session = null; }
    cache = { raw, session };
  }
  return cache.session;
}

function write(value: Session | null) {
  try {
    if (value) window.localStorage.setItem(KEY, JSON.stringify(value));
    else window.localStorage.removeItem(KEY);
  } catch { return; }
  window.dispatchEvent(new Event(EVENT));
}

export const getAccessToken = () => read()?.accessToken ?? null;
export const getRefreshToken = () => read()?.refreshToken ?? null;
export const saveSession = (session: Session) => write(session);
export const clearSession = () => write(null);

export function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener(EVENT, callback); };
}
export const getSessionUser = () => read()?.user ?? null;
