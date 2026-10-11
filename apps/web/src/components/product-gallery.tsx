'use client';

import { useState } from 'react';
import Image from 'next/image';

export function ProductGallery({ images, name }: { images: { url: string; altText?: string }[]; name: string }) {
  const gallery = images.length > 0 ? images : [{ url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=85', altText: name }];
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#F8F7F5] mb-4">
        <Image src={gallery[active].url} alt={gallery[active].altText || name} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
      </div>
      {gallery.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {gallery.map((image, index) => (
            <button key={index} onClick={() => setActive(index)} className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${active === index ? 'border-[#C89B6D]' : 'border-transparent opacity-70 hover:opacity-100'}`}>
              <Image src={image.url} alt={image.altText || name} fill className="object-cover" sizes="120px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}