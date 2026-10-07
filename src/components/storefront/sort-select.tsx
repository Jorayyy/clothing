'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { SORT_OPTIONS } from '@/lib/shop-params';

/**
 * Native `<select>` kept inside the GET form so filtering still works without
 * JavaScript; when JS is available the change navigates immediately.
 */
export function SortSelect({ id = 'sort' }: { id?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('sort') ?? 'newest';

  return (
    <div className="flex items-center gap-2.5">
      <label htmlFor={id} className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted">
        Sort by
      </label>
      <select
        id={id}
        name="sort"
        value={current}
        onChange={(event) => {
          const next = new URLSearchParams(searchParams.toString());
          const value = event.target.value;
          if (value === 'newest') next.delete('sort');
          else next.set('sort', value);
          next.delete('page');
          const query = next.toString();
          router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
        }}
        className="border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition focus:border-ink"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
