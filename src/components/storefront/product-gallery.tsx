'use client';

import Image from 'next/image';
import { useState } from 'react';

import { cn } from '@/lib/utils';

export interface GalleryImage {
  url: string;
  alt: string;
}

export function ProductGallery({
  images,
  layout,
  name,
}: {
  images: GalleryImage[];
  layout: 'stacked' | 'thumbnails';
  name: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center border border-dashed border-line bg-surface text-xs uppercase tracking-[0.2em] text-muted">
        No image yet
      </div>
    );
  }

  if (layout === 'stacked') {
    return (
      <div className="space-y-3">
        {images.map((image, index) => (
          <div key={`${image.url}-${index}`} className="relative aspect-[3/4] w-full overflow-hidden bg-surface">
            <Image
              src={image.url}
              alt={image.alt || `${name} — photo ${index + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={index === 0}
              className="object-cover"
            />
          </div>
        ))}
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div>
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface">
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt || name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 ? (
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View photo ${index + 1}`}
              aria-current={index === active}
              className={cn(
                'relative aspect-square w-16 shrink-0 overflow-hidden border-2 transition',
                index === active ? 'border-ink' : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
