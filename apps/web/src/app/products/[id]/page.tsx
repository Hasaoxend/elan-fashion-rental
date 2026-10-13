import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Star, ChevronRight } from 'lucide-react';
import { getProduct } from '@/lib/api';
import { ProductGallery } from '@/components/product-gallery';
import { BookingForm } from '@/components/booking-form';
import { WishlistButton } from '@/components/wishlist-button';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product;
  try {
    product = await getProduct(id);
  } catch {
    notFound();
  }

  const statusLabels: Record<string, string> = { available: 'Có sẵn', reserved: 'Đang được đặt', rented: 'Đã thuê', maintenance: 'Đang bảo trì' };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="flex items-center gap-2 text-sm text-[#6B6B6B] mb-8">
        <Link href="/" className="hover:text-[#C89B6D]">Trang chủ</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/products" className="hover:text-[#C89B6D]">Trang phục</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-[#171717]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#E8F5EE] text-[#3D8B5F]">{statusLabels[product.status] || 'Có sẵn'}</span>
            <span className="text-xs text-[#A0A0A0]">SKU: {product.sku}</span>
          </div>

          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="font-display text-4xl lg:text-5xl">{product.name}</h1>
            <WishlistButton productId={product.id} className="shrink-0 border border-[#E5E3DF]" />
          </div>

          {product.ratingCount > 0 && (
            <div className="flex items-center gap-2 mb-6">
              <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`w-4 h-4 ${i <= Math.round(product.ratingAvg) ? 'fill-[#C89B6D] text-[#C89B6D]' : 'text-[#E5E3DF]'}`} />)}</div>
              <span className="text-sm text-[#6B6B6B]">{product.ratingAvg.toFixed(1)} ({product.ratingCount} đánh giá)</span>
            </div>
          )}

          <div className="flex items-baseline gap-3 mb-8">
            <span className="text-3xl font-bold">{product.pricePerDay.toLocaleString('vi-VN')}đ</span>
            <span className="text-sm text-[#6B6B6B]">/ ngày</span>
          </div>

          <p className="text-[#6B6B6B] leading-relaxed mb-8 whitespace-pre-line">{product.description}</p>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 py-6 border-y border-[#E5E3DF] mb-8 text-sm">
            <div><dt className="text-[#A0A0A0] mb-1">Kích thước</dt><dd className="font-medium">{Array.from(new Set(product.variants.map((v) => v.size))).join(' / ') || '—'}</dd></div>
            <div><dt className="text-[#A0A0A0] mb-1">Màu sắc</dt><dd className="font-medium">{product.colorName || '—'}</dd></div>
            <div><dt className="text-[#A0A0A0] mb-1">Chất liệu</dt><dd className="font-medium">{product.material || '—'}</dd></div>
            <div><dt className="text-[#A0A0A0] mb-1">Thương hiệu</dt><dd className="font-medium">{product.brand || '—'}</dd></div>
            <div><dt className="text-[#A0A0A0] mb-1">Tồn kho</dt><dd className="font-medium">{product.availableStock ?? 0} sản phẩm</dd></div>
            <div><dt className="text-[#A0A0A0] mb-1">Tiền cọc</dt><dd className="font-medium">{product.depositAmount.toLocaleString('vi-VN')}đ</dd></div>
          </dl>

          <BookingForm product={product} />
        </div>
      </div>
    </div>
  );
}