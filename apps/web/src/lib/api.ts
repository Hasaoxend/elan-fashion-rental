const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || 'Không thể tải dữ liệu.');
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
