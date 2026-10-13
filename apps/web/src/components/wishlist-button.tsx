'use client';

import { Heart } from 'lucide-react';
import { toggleWishlist, useWishlist } from '@/lib/wishlist';

export function WishlistButton({ productId, className = '' }: { productId: string; className?: string }) {
  const saved = useWishlist().includes(productId);
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); toggleWishlist(productId); }}
      aria-pressed={saved}
      aria-label={saved ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
      title={saved ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
      className={`w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition ${className}`}
    >
      <Heart className={`w-5 h-5 ${saved ? 'fill-[#C94A4A] text-[#C94A4A]' : 'text-[#6B6B6B]'}`} />
    </button>
  );
}
