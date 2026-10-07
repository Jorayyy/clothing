import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { IconChevronLeft, IconChevronRight } from './icons';

export function Spinner({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn('inline-block animate-spin rounded-full border-2 border-current border-t-transparent', className)}
      style={{ width: size, height: size }}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn('skeleton block', className)} aria-hidden="true" />;
}

export function Badge({
  children,
  tone = 'solid',
  className,
}: {
  children: ReactNode;
  tone?: 'solid' | 'accent' | 'sale' | 'outline';
  className?: string;
}) {
  const toneClass =
    tone === 'accent' ? 'tag-accent' : tone === 'sale' ? 'tag-sale' : tone === 'outline' ? 'tag-outline' : '';
  return <span className={cn('tag', toneClass, className)}>{children}</span>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
  align = 'start',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  align?: 'start' | 'center';
}) {
  return (
    <div
      className={cn(
        'mb-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-3',
        align === 'center' && 'flex-col items-center text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h2 className="section-title">{title}</h2>
        {description ? <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center border border-dashed border-line bg-surface/50 px-6 py-16 text-center',
        className,
      )}
    >
      <p className="section-title text-[1.35rem]">{title}</p>
      {description ? <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{description}</p> : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}

export interface PaginationInfo {
  page: number;
  totalPages: number;
}

function pageWindow(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const output: (number | 'gap')[] = [];
  let previous = 0;
  for (const value of sorted) {
    if (previous && value - previous > 1) output.push('gap');
    output.push(value);
    previous = value;
  }
  return output;
}

/** URL-preserving pagination: keeps every existing search param. */
export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
  className,
}: PaginationInfo & { basePath: string; searchParams?: Record<string, string>; className?: string }) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams ?? {});
    if (target <= 1) params.delete('page');
    else params.set('page', String(target));
    const query = params.toString();
    return `${basePath}${query ? `?${query}` : ''}`;
  };

  const items = pageWindow(page, totalPages);

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-center gap-1.5', className)}>
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          className="flex h-10 w-10 items-center justify-center border border-line text-ink transition hover:border-ink hover:bg-ink hover:text-bg"
        >
          <IconChevronLeft size={16} />
          <span className="sr-only">Previous page</span>
        </Link>
      ) : null}

      {items.map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              'flex h-10 min-w-10 items-center justify-center border px-3 text-sm transition',
              item === page
                ? 'border-ink bg-ink text-bg'
                : 'border-line text-ink hover:border-ink hover:bg-ink hover:text-bg',
            )}
          >
            {item}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          rel="next"
          className="flex h-10 w-10 items-center justify-center border border-line text-ink transition hover:border-ink hover:bg-ink hover:text-bg"
        >
          <IconChevronRight size={16} />
          <span className="sr-only">Next page</span>
        </Link>
      ) : null}
    </nav>
  );
}
