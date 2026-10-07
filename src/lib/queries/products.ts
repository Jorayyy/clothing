import 'server-only';

import { and, count, desc, or, sql, asc, inArray, type SQL } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import {
  categories as categoriesTable,
  collectionProducts,
  media as mediaTable,
  productAttributes,
  productCategories,
  productImages,
  products as productsTable,
  productVariants,
  type Product,
} from '@/lib/db/schema';

import { toRows } from '@/lib/db/result';
import { getPublicCategories } from './catalog';

export interface MediaRef {
  id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  mimeType: string;
}

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  summary: string;
  price: number;
  compareAt: number | null;
  labels: string[];
  featured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  image: MediaRef | null;
  gallery: MediaRef[];
  categorySlugs: string[];
  updatedAt: string;
}

export interface ProductDetailData extends ProductCardData {
  status: Product['status'];
  description: string;
  richContent: Product['richContent'];
  label: string;
  sku: string | null;
  material: string | null;
  fit: string | null;
  measurements: string | null;
  care: string | null;
  videoUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  metadata: Record<string, string>;
  trackStock: boolean;
  stockQuantity: number;
  attributes: { id: string; key: string; name: string; values: string[] }[];
  variants: VariantData[];
  publishedAt: string | null;
  createdAt: string;
}

export interface VariantData {
  id: string;
  name: string;
  sku: string | null;
  price: number | null;
  options: Record<string, string>;
  trackStock: boolean;
  stockQuantity: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export type ProductSort =
  | 'newest'
  | 'oldest'
  | 'price-asc'
  | 'price-desc'
  | 'featured'
  | 'name-asc'
  | 'best-sellers';

export interface ProductQuery {
  q?: string;
  status?: Product['status'] | 'all';
  categorySlug?: string;
  collectionSlug?: string;
  priceMin?: number;
  priceMax?: number;
  /** Standard filter keys, lowercase: size / color / style. */
  attributes?: Record<string, string[]>;
  newArrivals?: boolean;
  bestSellers?: boolean;
  featured?: boolean;
  sort?: ProductSort;
  page?: number;
  perPage?: number;
  ids?: string[];
}

const DEFAULT_PER_PAGE = 24;

function effectivePrice(): SQL<number> {
  return sql<number>`COALESCE(${productsTable.salePrice}, ${productsTable.price})`;
}

function buildConditions(query: ProductQuery, includeDrafts: boolean): SQL[] {
  const conditions: SQL[] = [];

  if (includeDrafts) {
    if (query.status && query.status !== 'all') {
      conditions.push(sql`${productsTable.status} = ${query.status}`);
    }
  } else {
    conditions.push(sql`${productsTable.status} = 'published'`);
  }

  if (query.q && query.q.trim()) {
    const needle = `%${query.q.trim().replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    conditions.push(
      or(
        sql`${productsTable.name} ILIKE ${needle} ESCAPE '\\'`,
        sql`${productsTable.slug} ILIKE ${needle} ESCAPE '\\'`,
        sql`${productsTable.summary} ILIKE ${needle} ESCAPE '\\'`,
        sql`${productsTable.label} ILIKE ${needle} ESCAPE '\\'`,
        sql`${productsTable.description} ILIKE ${needle} ESCAPE '\\'`,
        sql`EXISTS (
          SELECT 1 FROM product_attributes pa
          WHERE pa.product_id = ${productsTable.id}
            AND (pa.name ILIKE ${needle} ESCAPE '\\' OR pa.values::text ILIKE ${needle} ESCAPE '\\')
        )`,
        sql`EXISTS (
          SELECT 1 FROM product_variants pv
          WHERE pv.product_id = ${productsTable.id}
            AND (pv.name ILIKE ${needle} ESCAPE '\\' OR pv.options::text ILIKE ${needle} ESCAPE '\\')
        )`,
      )!,
    );
  }

  if (query.categorySlug) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM product_categories pc
      JOIN categories c ON c.id = pc.category_id
      WHERE pc.product_id = ${productsTable.id} AND c.slug = ${query.categorySlug}
    )`);
  }

  if (query.collectionSlug) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM collection_products cp
      JOIN collections col ON col.id = cp.collection_id
      WHERE cp.product_id = ${productsTable.id} AND col.slug = ${query.collectionSlug}
    )`);
  }

  if (typeof query.priceMin === 'number') {
    conditions.push(sql`${effectivePrice()} >= ${query.priceMin}`);
  }
  if (typeof query.priceMax === 'number') {
    conditions.push(sql`${effectivePrice()} <= ${query.priceMax}`);
  }

  if (query.attributes) {
    for (const [key, values] of Object.entries(query.attributes)) {
      if (!values.length) continue;
      const normalisedKey = key.toLowerCase();
      const list = values.map((value) => value.toLowerCase());
      const placeholders = sql.join(list.map((value) => sql`${value}`), sql`, `);
      conditions.push(sql`EXISTS (
        SELECT 1 FROM product_attributes pa
        WHERE pa.product_id = ${productsTable.id}
          AND pa.key = ${normalisedKey}
          AND EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(pa.values) AS v(value)
            WHERE lower(v.value) IN (${placeholders})
          )
      )`);
    }
  }

  if (query.newArrivals) conditions.push(sql`${productsTable.isNewArrival} = true`);
  if (query.bestSellers) conditions.push(sql`${productsTable.isBestSeller} = true`);
  if (query.featured) conditions.push(sql`${productsTable.featured} = true`);

  if (query.ids && query.ids.length > 0) {
    conditions.push(inArray(productsTable.id, query.ids));
  }

  return conditions;
}

function orderClause(sort: ProductSort = 'newest'): SQL {
  switch (sort) {
    case 'price-asc':
      return sql`${effectivePrice()} ASC, ${productsTable.createdAt} DESC`;
    case 'price-desc':
      return sql`${effectivePrice()} DESC, ${productsTable.createdAt} DESC`;
    case 'oldest':
      return sql`${productsTable.createdAt} ASC`;
    case 'name-asc':
      return sql`${productsTable.name} ASC`;
    case 'featured':
      return sql`${productsTable.featured} DESC, ${productsTable.isNewArrival} DESC, ${productsTable.createdAt} DESC`;
    case 'best-sellers':
      return sql`${productsTable.isBestSeller} DESC, ${productsTable.featured} DESC, ${productsTable.createdAt} DESC`;
    case 'newest':
    default:
      return sql`${productsTable.createdAt} DESC`;
  }
}

function toCard(
  row: Product & { seoTitle?: string | null },
  images: Map<string, MediaRef[]>,
  categoryMap: Map<string, string[]>,
): ProductCardData {
  const gallery = images.get(row.id) ?? [];
  const price = row.salePrice ?? row.price;
  const compareAt =
    row.salePrice !== null && row.salePrice !== undefined ? row.price : (row.compareAtPrice ?? null);
  const labels = [
    row.featured ? 'Featured' : '',
    row.isNewArrival ? 'New' : '',
    row.isBestSeller ? 'Best seller' : '',
    row.label ?? '',
    compareAt !== null && compareAt > price ? 'Sale' : '',
  ].filter((label, index, all) => label && all.indexOf(label) === index);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary ?? '',
    price,
    compareAt,
    labels,
    featured: row.featured,
    isNewArrival: row.isNewArrival,
    isBestSeller: row.isBestSeller,
    image: gallery[0] ?? null,
    gallery,
    categorySlugs: categoryMap.get(row.id) ?? [],
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function hydrate(rows: Product[]): Promise<ProductCardData[]> {
  if (rows.length === 0) return [];
  const db = await getDb();
  const ids = rows.map((row) => row.id);

  const imageRows = await db
    .select({
      productId: productImages.productId,
      position: productImages.position,
      alt: productImages.alt,
      id: mediaTable.id,
      url: mediaTable.url,
      width: mediaTable.width,
      height: mediaTable.height,
      mimeType: mediaTable.mimeType,
      mediaAlt: mediaTable.alt,
    })
    .from(productImages)
    .innerJoin(mediaTable, sql`${mediaTable.id} = ${productImages.mediaId}`)
    .where(inArray(productImages.productId, ids))
    .orderBy(asc(productImages.position));

  const categoryRows = await db
    .select({ productId: productCategories.productId, slug: categoriesTable.slug })
    .from(productCategories)
    .innerJoin(categoriesTable, sql`${categoriesTable.id} = ${productCategories.categoryId}`)
    .where(inArray(productCategories.productId, ids));

  const images = new Map<string, MediaRef[]>();
  for (const row of imageRows) {
    const list = images.get(row.productId) ?? [];
    list.push({
      id: row.id,
      url: row.url,
      alt: row.alt || row.mediaAlt,
      width: row.width,
      height: row.height,
      mimeType: row.mimeType,
    });
    images.set(row.productId, list);
  }

  const categoryMap = new Map<string, string[]>();
  for (const row of categoryRows) {
    const list = categoryMap.get(row.productId) ?? [];
    list.push(row.slug);
    categoryMap.set(row.productId, list);
  }

  return rows.map((row) => toCard(row, images, categoryMap));
}

export async function listProducts(query: ProductQuery = {}): Promise<Paginated<ProductCardData>> {
  const db = await getDb();
  const includeDrafts = query.status !== undefined;
  const conditions = buildConditions(query, includeDrafts);
  const where = conditions.length ? and(...conditions) : undefined;
  const page = Math.max(1, query.page ?? 1);
  const perPage = Math.min(96, Math.max(1, query.perPage ?? DEFAULT_PER_PAGE));

  const [totalRow] = await db.select({ value: count() }).from(productsTable).where(where);
  const total = totalRow?.value ?? 0;

  const rows = await db
    .select()
    .from(productsTable)
    .where(where)
    .orderBy(orderClause(query.sort))
    .limit(perPage)
    .offset((page - 1) * perPage);

  const items = await hydrate(rows);
  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/** Product ids ordered for a given sort — used by section renderers. */
export async function listProductIds(query: ProductQuery, limit: number): Promise<string[]> {
  const db = await getDb();
  const includeDrafts = query.status !== undefined;
  const conditions = buildConditions(query, includeDrafts);
  const where = conditions.length ? and(...conditions) : undefined;
  const rows = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(where)
    .orderBy(orderClause(query.sort))
    .limit(limit);
  return rows.map((row) => row.id);
}

export async function getProductsByIds(ids: string[]): Promise<ProductCardData[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  const rows = await db
    .select()
    .from(productsTable)
    .where(inArray(productsTable.id, ids))
    .orderBy(desc(productsTable.createdAt));
  const cards = await hydrate(rows);
  const order = new Map(ids.map((id, index) => [id, index]));
  return cards.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function getProductBySlug(
  slug: string,
  options: { includeUnpublished?: boolean } = {},
): Promise<ProductDetailData | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(productsTable)
    .where(
      options.includeUnpublished
        ? sql`${productsTable.slug} = ${slug}`
        : and(sql`${productsTable.slug} = ${slug}`, sql`${productsTable.status} = 'published'`),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const [card] = await hydrate([row]);
  if (!card) return null;

  const attributeRows = await db
    .select()
    .from(productAttributes)
    .where(sql`${productAttributes.productId} = ${row.id}`)
    .orderBy(asc(productAttributes.position));

  const variantRows = await db
    .select()
    .from(productVariants)
    .where(sql`${productVariants.productId} = ${row.id}`)
    .orderBy(asc(productVariants.position));

  const seoTitle = row.seoTitle;

  return {
    ...card,
    status: row.status,
    description: row.description,
    richContent: row.richContent ?? [],
    label: row.label,
    sku: row.sku,
    material: row.material,
    fit: row.fit,
    measurements: row.measurements,
    care: row.care,
    videoUrl: row.videoUrl,
    seoTitle,
    seoDescription: row.seoDescription,
    metadata: row.metadata ?? {},
    trackStock: row.trackStock,
    stockQuantity: row.stockQuantity,
    attributes: attributeRows.map((attribute) => ({
      id: attribute.id,
      key: attribute.key,
      name: attribute.name,
      values: (attribute.values ?? []) as string[],
    })),
    variants: variantRows.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      price: variant.price,
      options: (variant.options ?? {}) as Record<string, string>,
      trackStock: variant.trackStock,
      stockQuantity: variant.stockQuantity,
    })),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getRelatedProducts(
  product: { id: string; categorySlugs: string[] },
  limit = 4,
): Promise<ProductCardData[]> {
  const categories = await getPublicCategories();
  const shared = categories
    .filter((category) => product.categorySlugs.includes(category.slug))
    .map((category) => category.slug);

  if (shared.length > 0) {
    const related = await listProducts({
      categorySlug: shared[0],
      sort: 'featured',
      perPage: limit + 8,
    });
    const filtered = related.items.filter((item) => item.id !== product.id).slice(0, limit);
    if (filtered.length > 0) return filtered;
  }

  const fallback = await listProducts({ featured: true, sort: 'newest', perPage: limit + 8 });
  return fallback.items.filter((item) => item.id !== product.id).slice(0, limit);
}

export async function searchProductSuggestions(
  term: string,
  limit = 6,
): Promise<{ id: string; slug: string; name: string; image: MediaRef | null }[]> {
  if (!term.trim()) return [];
  const result = await listProducts({ q: term, perPage: limit, sort: 'newest' });
  return result.items.map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    image: item.image,
  }));
}

/** Distinct attribute values across the visible catalog, for filter facets. */
export async function getAttributeFacets(
  base: Omit<ProductQuery, 'attributes' | 'page' | 'perPage'> = {},
): Promise<{ key: string; name: string; values: string[] }[]> {
  const db = await getDb();
  const filters: SQL[] = [sql`p.status = 'published'`];

  if (base.categorySlug) {
    filters.push(sql`EXISTS (
      SELECT 1 FROM product_categories pc2
      JOIN categories c2 ON c2.id = pc2.category_id
      WHERE pc2.product_id = p.id AND c2.slug = ${base.categorySlug}
    )`);
  }
  if (base.collectionSlug) {
    filters.push(sql`EXISTS (
      SELECT 1 FROM collection_products cp2
      JOIN collections col2 ON col2.id = cp2.collection_id
      WHERE cp2.product_id = p.id AND col2.slug = ${base.collectionSlug}
    )`);
  }
  if (base.q && base.q.trim()) {
    const needle = `%${base.q.trim().replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    filters.push(sql`p.name ILIKE ${needle} ESCAPE '\\'`);
  }
  if (typeof base.priceMin === 'number') filters.push(sql`${effectivePrice()} >= ${base.priceMin}`);
  if (typeof base.priceMax === 'number') filters.push(sql`${effectivePrice()} <= ${base.priceMax}`);
  if (base.newArrivals) filters.push(sql`p.is_new_arrival = true`);
  if (base.bestSellers) filters.push(sql`p.is_best_seller = true`);
  if (base.featured) filters.push(sql`p.featured = true`);

  const raw = await db.execute(sql`
    SELECT pa.key, pa.name, v.value
    FROM product_attributes pa
    JOIN products p ON p.id = pa.product_id
    CROSS JOIN LATERAL jsonb_array_elements_text(pa.values) AS v(value)
    WHERE ${sql.join(filters, sql` AND `)}
    ORDER BY pa.position, pa.name, v.value
  `);

  const facets = new Map<string, { key: string; name: string; values: string[] }>();
  for (const row of toRows(raw)) {
    const key = String(row.key);
    const value = String(row.value);
    if (!value) continue;
    const existing = facets.get(key) ?? { key, name: String(row.name), values: [] };
    if (!existing.values.includes(value)) existing.values.push(value);
    facets.set(key, existing);
  }
  return [...facets.values()];
}



export async function getProductCountByCategory(categoryId: string): Promise<number> {
  const db = await getDb();
  const [row] = await db
    .select({ value: count() })
    .from(productCategories)
    .innerJoin(productsTable, sql`${productsTable.id} = ${productCategories.productId}`)
    .where(
      and(
        sql`${productCategories.categoryId} = ${categoryId}`,
        sql`${productsTable.status} = 'published'`,
      ),
    );
  return row?.value ?? 0;
}

export async function getProductCountByCollection(collectionId: string): Promise<number> {
  const db = await getDb();
  const [row] = await db
    .select({ value: count() })
    .from(collectionProducts)
    .innerJoin(productsTable, sql`${productsTable.id} = ${collectionProducts.productId}`)
    .where(
      and(
        sql`${collectionProducts.collectionId} = ${collectionId}`,
        sql`${productsTable.status} = 'published'`,
      ),
    );
  return row?.value ?? 0;
}

/** Every published product slug, newest first — used by the sitemap. */
export async function listPublicProductsForSitemap(): Promise<{ slug: string; updatedAt: string }[]> {
  const db = await getDb();
  const rows = await db
    .select({ slug: productsTable.slug, updatedAt: productsTable.updatedAt })
    .from(productsTable)
    .where(sql`${productsTable.status} = 'published'`)
    .orderBy(desc(productsTable.updatedAt));
  return rows.map((row) => ({ slug: row.slug, updatedAt: row.updatedAt.toISOString() }));
}
