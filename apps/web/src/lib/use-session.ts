'use client';

import { useSyncExternalStore } from 'react';
import { getSessionUser, subscribe } from './session';

/** Người dùng đang đăng nhập (null nếu là khách vãng lai); tự cập nhật khi đăng nhập/đăng xuất. */
export function useSession() {
  return useSyncExternalStore(subscribe, getSessionUser, () => null);
}
