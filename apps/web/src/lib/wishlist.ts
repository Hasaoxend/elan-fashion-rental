'use client';

import { useSyncExternalStore } from 'react';

// Danh sách yêu thích lưu ở trình duyệt (web khách chưa có đăng nhập).
// ponytail: localStorage theo thiết bị; chuyển sang bảng WishlistItem khi khách có tài khoản.
const KEY = 'wishlist';
const EVENT = 'wishlist-change';
const EMPTY: string[] = [];
let cache: { raw: string | null; ids: string[] } = { raw: null, ids: EMPTY };

function read(): string[] {
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(KEY); } catch { return EMPTY; }
  if (raw !== cache.raw) {
    let ids: string[] = EMPTY;
    try { const parsed = JSON.parse(raw ?? '[]'); if (Array.isArray(parsed)) ids = parsed.filter((id): id is string => typeof id === 'string'); } catch { ids = EMPTY; }
    cache = { raw, ids };
  }
  return cache.ids;
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener(EVENT, callback); };
}

export function toggleWishlist(id: string) {
  const ids = read();
  const next = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { return; }
  window.dispatchEvent(new Event(EVENT));
}

export function useWishlist() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
