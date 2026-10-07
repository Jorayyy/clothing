import Image from 'next/image';
import Link from 'next/link';

import { IconArrowUpRight, IconMessenger } from '@/components/ui/icons';
import { formatPrice } from '@/lib/format';
import type { ProductCardData } from '@/lib/queries/products';
import type { Settings } from '@/lib/settings';
import { cn } from '@/lib/utils';

const RATIO_CLASS = {
  portrait: 'aspect-[3/4]',
  square: 'aspect-square',
  tall: 'aspect-[4/5]',
} as const;

export interface ProductCardProps {
  product: ProductCardData;
  settings: Settings;
  sizes?: string;
  /** Optional messenger deep link shown when the theme asks for an inquire button. */
  inquireHref?: string | null;
  priority?: boolean;
  showCategoryName?: string;
}

export function ProductCard({
  product,
  settings,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  inquireHref,
  priority,
  showCategoryName,
}: ProductCardProps) {
  const card = settings.theme.productCard;
  const onSale = product.compareAt !== null && product.compareAt > product.price;
  const hoverImage = card.hoverEffect === 'swap' ? (product.gallery[1] ?? null) : null;

  return (
    <article className="group/card flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="relative block overflow-hidden rounded-site bg-surface"
        aria-label={product.name}
      >
        <div className={cn('relative w-full', RATIO_CLASS[card.imageRatio])}>
          {product.image ? (
            <Image
              src={product.image.url}
              alt={product.image.alt || product.name}
              fill
              sizes={sizes}
              priority={priority}
              className={cn(
                'object-cover transition-transform duration-500',
                card.hoverEffect === 'zoom' && 'group-hover/card:scale-105',
              )}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface text-xs uppercase tracking-[0.2em] text-muted">
              No image
            </div>
          )}

          {hoverImage ? (
            <Image
              src={hoverImage.url}
              alt={hoverImage.alt || product.name}
              fill
              sizes={sizes}
              className="absolute inset-0 object-cover opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
            />
          ) : null}
        </div>

        {card.showLabel && product.labels.length > 0 ? (
          <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
            {product.labels.slice(0, 2).map((label) => (
              <span
                key={label}
                className={cn(
                  'px-2 py-1 text-[0.6rem] font-bold uppercase tracking-[0.16em]',
                  label.toLowerCase() === 'sale'
                    ? 'bg-sale text-white'
                    : label.toLowerCase() === 'new'
                      ? 'bg-accent text-on-accent'
                      : 'bg-primary text-on-primary',
                )}
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col pt-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[0.95rem] font-medium leading-snug">
              <Link href={`/products/${product.slug}`} className="transition-colors hover:text-accent">
                {product.name}
              </Link>
            </h3>
            {card.showCategory && showCategoryName ? (
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">{showCategoryName}</p>
            ) : null}
          </div>
          <p className={cn('shrink-0 text-[0.95rem] font-semibold', onSale && 'text-sale')}>
            {formatPrice(product.price)}
            {onSale ? (
              <span className="ml-2 text-xs font-normal text-muted line-through">
                {formatPrice(product.compareAt)}
              </span>
            ) : null}
          </p>
        </div>

        {product.summary ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{product.summary}</p>
        ) : null}

        {card.showInquireButton && inquireHref ? (
          <a
            href={inquireHref}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[0.7rem] font-semibold transition hover:border-accent hover:text-accent"
          >
            <IconMessenger size={13} />
            Inquire
            <IconArrowUpRight size={12} className="opacity-60" />
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function ProductGrid({
  children,
  density,
  className,
}: {
  children: React.ReactNode;
  density: '2' | '3' | '4';
  className?: string;
}) {
  const columns = density === '2' ? 'grid-cols-1 sm:grid-cols-2' : density === '4' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3';
  return <div className={cn('grid gap-x-5 gap-y-10', columns, className)}>{children}</div>;
}
