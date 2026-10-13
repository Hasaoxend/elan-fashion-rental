const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('admin_token');
}
export function setToken(token: string, refreshToken?: string) {
  window.localStorage.setItem('admin_token', token);
  if (refreshToken) window.localStorage.setItem('admin_refresh', refreshToken);
}
export function clearToken() {
  window.localStorage.removeItem('admin_token');
  window.localStorage.removeItem('admin_refresh');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const send = (token: string | null) => fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });

  let response = await send(getToken());
  let body = await response.json().catch(() => ({}));

  // Access token hết hạn: refresh một lần rồi retry request gốc.
  if (response.status === 401 && typeof window !== 'undefined') {
    const refreshToken = window.localStorage.getItem('admin_refresh');
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }),
      });
      const refreshed = await refreshResponse.json().catch(() => ({}));
      if (refreshResponse.ok && refreshed.accessToken) {
        setToken(refreshed.accessToken, refreshed.refreshToken);
        response = await send(refreshed.accessToken);
        body = await response.json().catch(() => ({}));
      }
    }
  }

  if (!response.ok) {
    // Hết phiên (refresh cũng thất bại): về trang đăng nhập, giữ lại trang hiện tại để quay lại.
    if (response.status === 401 && path !== '/auth/login') {
      clearToken();
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }
    const issues: Array<{ path: Array<string | number>; message: string }> = body.issues || [];
    const detail = issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(detail ? `${body.message} ${detail}` : body.message || 'Không thể tải dữ liệu.');
  }
  return body;
}

export interface DashboardData {
  kpis: { revenueToday: number; bookingsToday: number; renting: number; upcomingReturns: number; available: number; newCustomers: number; pendingBookings: number };
  recentBookings: Array<{ id: string; bookingCode: string; status: string; total: number; pickupDate: string; customer: { fullName: string }; items: Array<{ product: { name: string } }> }>;
}

export async function login(email: string, password: string) {
  const data = await request<{ user: any; accessToken: string; refreshToken: string; mustChangePassword: boolean }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (data.user.role === 'CUSTOMER') throw new Error('Tài khoản khách hàng không thể đăng nhập trang quản trị.');
  setToken(data.accessToken, data.refreshToken);
  return data;
}

export async function searchAdmin(query: string) {
  return request<{ products: any[]; bookings: any[]; customers: any[] }>(`/admin/search?q=${encodeURIComponent(query)}`);
}

export async function getDashboard() { return request<DashboardData>('/admin/dashboard'); }
export async function getAdminBookings(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  return request<{ items: any[] }>(`/admin/bookings${query ? `?${query}` : ''}`);
}
export async function getAdminCustomers(search = '') { return request<{ items: any[] }>(`/admin/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`); }
export async function getNotifications() { return request<{ items: any[] }>('/admin/notifications'); }
export async function markNotificationRead(id: string) { return request<any>(`/admin/notifications/${id}/read`, { method: 'PATCH' }); }
export async function updateBookingStatus(id: string, status: string, note?: string) {
  return request<{ booking: any }>(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) });
}
export async function getBooking(id: string) { return request<any>(`/bookings/${id}`); }
export async function getAdminProducts() { return request<{ items: any[] }>('/admin/products'); }
export async function getProduct(id: string) { return request<any>(`/products/${id}`); }
export async function getCategories() { return request<{ categories: any[] }>('/products/meta').then((meta) => meta.categories); }
export async function createProduct(data: any) { return request<any>('/products', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateProduct(id: string, data: any) { return request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function deleteProduct(id: string) { return request<any>(`/products/${id}`, { method: 'DELETE' }); }
export async function updateVariant(productId: string, variantId: string, data: any) {
  return request<any>(`/products/${productId}/variants/${variantId}`, { method: 'POST', body: JSON.stringify(data) });
}
export async function getMaintenance() { return request<{ items: any[] }>('/admin/maintenance'); }
export async function createMaintenance(data: any) { return request<any>('/admin/maintenance', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateMaintenance(id: string, data: any) { return request<any>(`/admin/maintenance/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
export async function getPayments(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  return request<{ items: any[] }>(`/admin/payments${query ? `?${query}` : ''}`);
}
export async function createPayment(data: any) { return request<any>('/admin/payments', { method: 'POST', body: JSON.stringify(data) }); }
export async function updatePayment(id: string, data: any) { return request<any>(`/admin/payments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
export async function getReports(days = 30) { return request<any>(`/admin/reports?days=${days}`); }
export async function getSettings() { return request<{ items: any[] }>('/admin/settings'); }
export async function saveSetting(key: string, value: string, group = 'general') {
  return request<any>('/admin/settings', { method: 'PUT', body: JSON.stringify({ key, value, group }) });
}
export async function getUsers() { return request<{ items: any[] }>('/admin/users'); }
export async function getUser(id: string) { return request<any>(`/admin/users/${id}`); }
export async function createUser(data: any) { return request<any>('/admin/users', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateUser(id: string, data: any) { return request<any>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
export async function deleteUser(id: string) { return request<any>(`/admin/users/${id}`, { method: 'DELETE' }); }
export async function getRoles() { return request<{ items: any[] }>('/admin/roles'); }
export async function updateRolePermissions(id: string, permissionIds: string[]) {
  return request<any>(`/admin/roles/${id}/permissions`, { method: 'PATCH', body: JSON.stringify({ permissionIds }) });
}
export async function getMe() { return request<any>('/auth/me'); }
export async function changePassword(currentPassword: string, newPassword: string) {
  return request<{ ok: boolean }>('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
}
