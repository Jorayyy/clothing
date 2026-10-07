import Link from 'next/link';

import { IconSearch } from '@/components/ui/icons';
import type { CategoryCard } from '@/lib/queries/catalog';
import {
  FILTERABLE_ATTRIBUTE_KEYS,
  PRICE_RANGES,
  priceRangeFor,
  shopQueryString,
  type ShopParams,
} from '@/lib/shop-params';
import { cn } from '@/lib/utils';

interface ShopFiltersProps {
  params: ShopParams;
  basePath: string;
  categories: CategoryCard[];
  facets: { key: string; name: string; values: string[] }[];
  /** Unique prefix so the form can be rendered twice (mobile + desktop) safely. */
  idPrefix?: string;
}

function toggle(values: string[] | undefined, value: string): string[] {
  const list = values ?? [];
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function ShopFilters({ params, basePath, categories, facets, idPrefix = 'filter' }: ShopFiltersProps) {
  const searchId = `${idPrefix}-q`;
  const activeCategories = new Set(
    params.category
      ? [params.category]
      : [],
  );

  return (
    <form method="get" action={basePath} className="space-y-8">
      <div>
        <label htmlFor={searchId} className="eyebrow mb-3 block">
          Search
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <IconSearch size={16} />
          </span>
          <input
            id={searchId}
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="Search products"
            className="input w-full pl-9"
          />
        </div>
      </div>

      {categories.length > 0 ? (
        <fieldset>
          <legend className="eyebrow mb-3">Category</legend>
          <ul className="space-y-1.5">
            <li>
              <Link
                href={`${basePath}${shopQueryString(params, { category: '' })}`}
                aria-current={params.category ? undefined : 'page'}
                className={cn(
                  'block text-sm transition-colors hover:text-accent',
                  !params.category ? 'font-semibold text-accent' : 'text-muted',
                )}
              >
                All products
              </Link>
            </li>
            {categories.map((category) => {
              const active = activeCategories.has(category.slug);
              return (
                <li key={category.id}>
                  <Link
                    href={`${basePath}${shopQueryString(params, { category: active ? '' : category.slug })}`}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-baseline justify-between gap-3 text-sm transition-colors hover:text-accent',
                      active ? 'font-semibold text-accent' : 'text-muted',
                    )}
                  >
                    <span>{category.name}</span>
                    {category.productCount !== undefined ? (
                      <span className="text-xs tabular-nums opacity-70">{category.productCount}</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : null}

      <fieldset>
        <legend className="eyebrow mb-3">Price</legend>
        <ul className="space-y-1.5">
          <li>
            <Link
              href={`${basePath}${shopQueryString(params, { price: '' })}`}
              className={cn('block text-sm transition-colors hover:text-accent', !params.price ? 'font-semibold text-accent' : 'text-muted')}
            >
              All prices
            </Link>
          </li>
          {PRICE_RANGES.map((range) => {
            const active = params.price === range.id;
            return (
              <li key={range.id}>
                <Link
                  href={`${basePath}${shopQueryString(params, { price: active ? '' : range.id })}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn('block text-sm transition-colors hover:text-accent', active ? 'font-semibold text-accent' : 'text-muted')}
                >
                  {range.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {facets.map((facet) => {
        const key = facet.key as (typeof FILTERABLE_ATTRIBUTE_KEYS)[number];
        if (!FILTERABLE_ATTRIBUTE_KEYS.includes(key)) return null;
        const selected = params.attributes[key] ?? [];
        if (facet.values.length === 0) return null;

        return (
          <fieldset key={facet.key}>
            <legend className="eyebrow mb-3">{facet.name || facet.key}</legend>
            <ul className="flex flex-wrap gap-2">
              {facet.values.map((value) => {
                const checked = selected.includes(value);
                return (
                  <li key={value}>
                    <label
                      className={cn(
                        'inline-flex cursor-pointer items-center border px-3 py-1.5 text-xs transition',
                        checked ? 'border-ink bg-ink text-bg' : 'border-line text-ink hover:border-ink',
                      )}
                    >
                      <input
                        type="checkbox"
                        name={facet.key}
                        value={value}
                        defaultChecked={checked}
                        className="sr-only"
                      />
                      {value}
                    </label>
                  </li>
                );
              })}
            </ul>
            {/* Preserve values not rendered as options so nothing is silently lost. */}
            {selected
              .filter((value) => !facet.values.includes(value))
              .map((value) => (
                <input key={value} type="hidden" name={facet.key} value={value} />
              ))}
          </fieldset>
        );
      })}

      {/* Preserve scalar state that has no visible control in this form. */}
      {params.sort !== 'newest' ? <input type="hidden" name="sort" value={params.sort} /> : null}
      {params.page > 1 ? <input type="hidden" name="page" value={params.page} /> : null}
      {params.collection ? <input type="hidden" name="collection" value={params.collection} /> : null}

      <div className="flex flex-wrap gap-3 pt-1">
        <button type="submit" className="btn btn-primary btn-sm flex-1">
          Apply filters
        </button>
        <Link href={basePath} className="btn btn-outline btn-sm">
          Clear
        </Link>
      </div>
    </form>
  );
}

export function ActiveFilters({ params, basePath }: { params: ShopParams; basePath: string }) {
  const chips: { label: string; href: string }[] = [];

  if (params.q) chips.push({ label: `“${params.q}”`, href: `${basePath}${shopQueryString(params, { q: '' })}` });
  if (params.category)
    chips.push({ label: params.category.replace(/-/g, ' '), href: `${basePath}${shopQueryString(params, { category: '' })}` });
  if (params.collection)
    chips.push({ label: params.collection.replace(/-/g, ' '), href: `${basePath}${shopQueryString(params, { collection: '' })}` });
  const range = priceRangeFor(params.price);
  if (range) chips.push({ label: range.label, href: `${basePath}${shopQueryString(params, { price: '' })}` });

  for (const key of FILTERABLE_ATTRIBUTE_KEYS) {
    for (const value of params.attributes[key] ?? []) {
      chips.push({
        label: `${key}: ${value}`,
        href: `${basePath}${shopQueryString(params, { [key]: toggle(params.attributes[key], value) })}`,
      });
    }
  }

  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <li key={`${chip.label}-${chip.href}`}>
          <Link
            href={chip.href}
            className="tag tag-outline inline-flex items-center gap-1.5 transition hover:border-accent hover:text-accent"
          >
            {chip.label}
            <span aria-hidden="true">×</span>
            <span className="sr-only">Remove filter</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
