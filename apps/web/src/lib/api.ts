import { clearSession, getAccessToken, getRefreshToken, saveSession } from './session';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // Token khách chỉ có ở trình duyệt; khi render phía server luôn gọi như khách vãng lai.
  const send = (token: string | null) => fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options?.headers || {}) },
  });
  let response = await send(getAccessToken());
  let body = await response.json().catch(() => ({}));

  // Access token hết hạn: refresh một lần rồi gửi lại.
  const refreshToken = getRefreshToken();
  if (response.status === 401 && refreshToken) {
    const refreshed = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
    const data = await refreshed.json().catch(() => ({}));
    if (refreshed.ok) {
      saveSession(data);
      response = await send(data.accessToken);
      body = await response.json().catch(() => ({}));
    } else clearSession();
  }

  if (!response.ok) {
    const issues: Array<{ message: string }> = body.issues || [];
    throw new Error(issues.length ? `${body.message} ${issues.map((i) => i.message).join(' ')}` : body.message || 'Không thể tải dữ liệu.');
  }
  return body;
}

export interface ProductImage { id: string; url: string; altText?: string; sortOrder: number; }
export interface ProductVariant { id: string; size: string; color: string; stockTotal: number; stockBroken: number; stockReservedForMaintenance: number; }
export interface Category { id: string; name: string; slug: string; description?: string; imageUrl?: string; _count?: { products: number }; }
export interface Product {
  id: string; sku: string; name: string; slug: string; description: string; shortDescription?: string;
  pricePerDay: number; price3Days: number; price7Days: number; depositAmount: number; serviceFeeRate: number;
  brand?: string; material?: string; colorName?: string; sizeLabel?: string; status: string;
  isFeatured: boolean; ratingAvg: number; ratingCount: number; rentalCount: number;
  images: ProductImage[]; variants: ProductVariant[]; category: Category; availableStock?: number;
}
export interface ProductsResponse { items: Product[]; total: number; page: number; pageSize: number; totalPages: number; }
export interface AvailabilityResult {
  available: boolean; remainingQuantity: number; totalStock: number; reason?: string; nextAvailableDate?: string;
  conflicts: Array<{ bookingId: string; bookingCode: string; startDate: string; endDate: string; quantity: number }>;
  blockedByMaintenance: Array<{ id: string; startDate: string; endDate: string; reason: string }>;
}

export async function getProducts(params: Record<string, string | number | undefined> = {}) {
  const query = Object.entries(params).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => `${key}=${encodeURIComponent(value!)}`).join('&');
  return request<ProductsResponse>(`/products${query ? `?${query}` : ''}`);
}
export async function getProduct(id: string) { return request<Product>(`/products/${id}`); }
export async function getCategories() { return (await request<{ categories: Category[] }>('/products/meta')).categories; }
export async function checkAvailability(productId: string, startDate: string, endDate: string, quantity = 1, variantId?: string) { return request<AvailabilityResult>(`/products/${productId}/availability?startDate=${startDate}&endDate=${endDate}&quantity=${quantity}${variantId ? `&variantId=${encodeURIComponent(variantId)}` : ''}`); }
export async function createBooking(payload: {
  productId: string; variantId?: string; size: string; color: string; quantity: number; pickupDate: string; returnDate: string;
  fullName: string; phone: string; email: string; address?: string; note?: string;
  deliveryMethod: 'store_pickup' | 'home_delivery'; paymentMethod: 'cod' | 'bank_transfer' | 'qr' | 'ewallet' | 'online';
}) { return request<{ booking: any }>('/bookings', { method: 'POST', body: JSON.stringify(payload) }); }
export async function getBooking(id: string) { return request<any>(`/bookings/${id}`); }
export async function lookupBooking(bookingCode: string, phone: string) {
  return request<any>(`/bookings/lookup/${encodeURIComponent(bookingCode)}?phone=${encodeURIComponent(phone)}`);
}

/** Thông tin cửa hàng (key store.*), admin sửa ở Cấu hình. */
export interface StoreInfo {
  'store.name': string; 'store.legalName': string; 'store.tagline': string; 'store.address': string;
  'store.phone': string; 'store.email': string; 'store.hours': string; 'store.foundedYear': string; 'store.about': string;
}
export async function getStoreInfo() { return request<StoreInfo>('/settings/public'); }

export interface SessionUser { id: string; email: string; fullName: string; role: string; customerId?: string; }
export interface Me extends SessionUser { phone: string | null; mustChangePassword: boolean; }

async function startSession(path: string, payload: object) {
  const data = await request<{ user: SessionUser; accessToken: string; refreshToken: string }>(path, { method: 'POST', body: JSON.stringify(payload) });
  // Website dành cho khách; tài khoản nhân viên đăng nhập ở trang quản trị.
  if (data.user.role !== 'CUSTOMER') throw new Error('Tài khoản nhân viên vui lòng đăng nhập ở trang quản trị.');
  saveSession(data);
  return data.user;
}
export function register(payload: { fullName: string; phone: string; email: string; password: string }) { return startSession('/auth/register', payload); }
export function login(email: string, password: string) { return startSession('/auth/login', { email, password }); }
export function getMe() { return request<Me>('/auth/me'); }
export function getMyBookings() { return request<{ items: any[] }>('/bookings?pageSize=50'); }
export function cancelMyBooking(id: string, reason: string) { return request<{ booking: any }>(`/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }); }
export function changePassword(currentPassword: string, newPassword: string) {
  return request<{ ok: boolean }>('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
}
