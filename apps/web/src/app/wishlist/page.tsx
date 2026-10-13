'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ArrowRight } from 'lucide-react';
import { getProduct, Product } from '@/lib/api';
import { toggleWishlist, useWishlist } from '@/lib/wishlist';
import { ProductCard } from '@/components/product-card';

export default function WishlistPage() {
  const ids = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ids.length) { setProducts([]); setLoading(false); return; }
    setLoading(true);
    Promise.allSettled(ids.map((id) => getProduct(id))).then((results) => {
      setProducts(results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])));
      // Sản phẩm đã bị gỡ khỏi hệ thống thì bỏ khỏi danh sách đã lưu.
      results.forEach((r, i) => { if (r.status === 'rejected') toggleWishlist(ids[i]); });
    }).finally(() => setLoading(false));
  }, [ids]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[65vh]">
      <div className="mb-10">
        <p className="text-sm tracking-[0.2em] uppercase text-[#C89B6D] mb-3">Đã lưu</p>
        <h1 className="font-display text-4xl sm:text-5xl mb-3">Danh sách yêu thích</h1>
        <p className="text-[#6B6B6B]">Những thiết kế bạn đã lưu trên thiết bị này{ids.length ? ` — ${ids.length} sản phẩm` : ''}.</p>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">{Array.from({ length: Math.max(1, ids.length) }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-white animate-pulse" />)}</div>
      ) : products.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      ) : (
        <div className="max-w-xl mx-auto py-12 text-center">
          <Heart className="w-16 h-16 text-[#C89B6D] mx-auto mb-6" />
          <p className="text-[#6B6B6B] mb-8">Bạn chưa lưu thiết kế nào. Bấm biểu tượng trái tim trên sản phẩm để lưu lại và đặt lịch nhanh hơn sau này.</p>
          <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-[#171717] text-white rounded-lg font-medium hover:bg-[#C89B6D] transition">Khám phá trang phục <ArrowRight className="w-4 h-4" /></Link>
        </div>
      )}
    </div>
  );
}
