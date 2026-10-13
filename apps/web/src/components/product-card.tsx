'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { Product } from '../lib/api';
import { WishlistButton } from './wishlist-button';

interface ProductCardProps {
  product: Product;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  available: { label: 'Có sẵn', color: 'bg-[#E8F5EE] text-[#3D8B5F]' },
  reserved: { label: 'Đang được đặt', color: 'bg-[#FFF4DE] text-[#D99A32]' },
  rented: { label: 'Đã thuê', color: 'bg-[#FDECEC] text-[#C94A4A]' },
  maintenance: { label: 'Bảo trì', color: 'bg-[#ECECEC] text-[#6B6B6B]' },
};

export function ProductCard({ product }: ProductCardProps) {
  const status = statusConfig[product.status] || statusConfig.available;
  const imageUrl = product.images[0]?.url || 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80';

  return (
    <article className="group bg-white rounded-2xl overflow-hidden border border-[#E5E3DF] hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F8F7F5]">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
        <WishlistButton productId={product.id} className="absolute top-4 right-4" />
        <div className="absolute inset-x-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link
            href={`/products/${product.id}`}
            className="w-full bg-white/95 hover:bg-white py-3 rounded-lg text-center text-sm font-medium text-[#171717] block"
          >
            Xem nhanh
          </Link>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#A0A0A0]">{product.sku}</span>
          {product.ratingCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-[#6B6B6B]">
              <Star className="w-3.5 h-3.5 fill-[#C89B6D] text-[#C89B6D]" />
              {product.ratingAvg.toFixed(1)}
            </div>
          )}
        </div>
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-[#171717] mb-2 hover:text-[#C89B6D] transition line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-[#A0A0A0] mb-4">{product.category?.name}</p>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-lg font-bold text-[#171717]">
              {product.pricePerDay.toLocaleString('vi-VN')}đ
              <span className="text-xs font-normal text-[#6B6B6B]"> / ngày</span>
            </div>
            {product.price3Days > 0 && (
              <div className="text-xs text-[#A0A0A0] mt-1">3 ngày: {product.price3Days.toLocaleString('vi-VN')}đ</div>
            )}
          </div>
          <Link
            href={`/products/${product.id}`}
            className="px-4 py-2 bg-[#171717] text-white text-xs rounded-lg hover:bg-[#C89B6D] transition"
          >
            Đặt lịch
          </Link>
        </div>
      </div>
    </article>
  );
}
