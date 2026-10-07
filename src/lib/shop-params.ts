import type { ProductQuery, ProductSort } from '@/lib/queries/products';

export const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A–Z' },
  { value: 'featured', label: 'Featured' },
  { value: 'best-sellers', label: 'Best sellers' },
];

export const SORT_VALUES = SORT_OPTIONS.map((option) => option.value);

export const PRICE_RANGES: { id: string; label: string; min?: number; max?: number }[] = [
  { id: 'under-500', label: 'Under ₱500', max: 49900 },
  { id: '500-999', label: '₱500 – ₱999', min: 50000, max: 99900 },
  { id: '1000-1999', label: '₱1,000 – ₱1,999', min: 100000, max: 199900 },
  { id: '2000-plus', label: '₱2,000 and up', min: 200000 },
];

export type SearchParamsValue = string | string[] | undefined;

function first(value: SearchParamsValue): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

function list(value: SearchParamsValue): string[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return raw
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 40);
}

export interface ShopParams {
  q: string;
  category: string;
  collection: string;
  price: string;
  sort: ProductSort;
  page: number;
  attributes: Record<string, string[]>;
}

/** Recognised attribute keys, matching the lowercase keys stored by the CMS. */
export const FILTERABLE_ATTRIBUTE_KEYS = ['size', 'color', 'style'] as const;

export function parseShopParams(
  raw: Record<string, SearchParamsValue>,
  options: { defaultSort?: ProductSort } = {},
): ShopParams {
  const sortRaw = first(raw.sort) as ProductSort;
  const pageRaw = Number.parseInt(first(raw.page), 10);
  const fallbackSort: ProductSort = options.defaultSort ?? 'newest';

  const attributes: Record<string, string[]> = {};
  for (const key of FILTERABLE_ATTRIBUTE_KEYS) {
    const values = list(raw[key]);
    if (values.length) attributes[key] = values;
  }
  // Any unknown-but-present keys are ignored so query strings stay safe.

  return {
    q: first(raw.q).slice(0, 120),
    category: first(raw.category).slice(0, 120),
    collection: first(raw.collection).slice(0, 120),
    price: first(raw.price).slice(0, 40),
    sort: SORT_VALUES.includes(sortRaw) ? sortRaw : fallbackSort,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.min(pageRaw, 500) : 1,
    attributes,
  };
}

export function priceRangeFor(id: string) {
  return PRICE_RANGES.find((range) => range.id === id);
}

/** Maps parsed params onto the product query layer (server only). */
export function toProductQuery(params: ShopParams, perPage: number): ProductQuery {
  const range = priceRangeFor(params.price);
  const query: ProductQuery = {
    sort: params.sort,
    page: params.page,
    perPage,
  };
  if (params.q) query.q = params.q;
  if (params.category) query.categorySlug = params.category;
  if (params.collection) query.collectionSlug = params.collection;
  if (range?.min !== undefined) query.priceMin = range.min;
  if (range?.max !== undefined) query.priceMax = range.max;
  if (Object.keys(params.attributes).length > 0) query.attributes = params.attributes;
  return query;
}

/** Query object used to build facet counts (facet-free, ignores page). */
export function toFacetBase(params: ShopParams): Omit<ProductQuery, 'attributes' | 'page' | 'perPage'> {
  const base: Omit<ProductQuery, 'attributes' | 'page' | 'perPage'> = {};
  if (params.q) base.q = params.q;
  if (params.category) base.categorySlug = params.category;
  if (params.collection) base.collectionSlug = params.collection;
  const range = priceRangeFor(params.price);
  if (range?.min !== undefined) base.priceMin = range.min;
  if (range?.max !== undefined) base.priceMax = range.max;
  return base;
}

export type ShopParamPatch = Partial<{
  q: string;
  category: string;
  collection: string;
  price: string;
  sort: string;
  page: number | string;
  size: string[];
  color: string[];
  style: string[];
}>;

/** Builds a `?query` string, dropping empty values and resetting the page. */
export function shopQueryString(params: ShopParams, patch: ShopParamPatch = {}): string {
  const hasPatch = Object.keys(patch).length > 0;
  const next: ShopParams = {
    ...params,
    q: patch.q ?? params.q,
    category: patch.category ?? params.category,
    collection: patch.collection ?? params.collection,
    price: patch.price ?? params.price,
    sort: (patch.sort ?? params.sort) as ProductSort,
    page: patch.page !== undefined ? Math.max(1, Number(patch.page) || 1) : hasPatch ? 1 : params.page,
    attributes: { ...params.attributes },
  };

  for (const key of FILTERABLE_ATTRIBUTE_KEYS) {
    if (!(key in patch)) continue;
    const values = patch[key];
    if (values && values.length > 0) next.attributes[key] = values;
    else delete next.attributes[key];
  }

  const search = new URLSearchParams();
  if (next.q) search.set('q', next.q);
  if (next.category) search.set('category', next.category);
  if (next.collection) search.set('collection', next.collection);
  if (next.price) search.set('price', next.price);
  if (next.sort && next.sort !== 'newest') search.set('sort', next.sort);
  if (next.page && next.page !== 1) search.set('page', String(next.page));

  for (const key of FILTERABLE_ATTRIBUTE_KEYS) {
    const values = next.attributes[key];
    if (values && values.length > 0) search.set(key, values.join(','));
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}
