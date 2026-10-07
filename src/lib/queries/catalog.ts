import 'server-only';

import { asc, desc, sql, type SQL } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import { toRows } from '@/lib/db/result';
import {
  categories as categoriesTable,
  collectionProducts,
  collections as collectionsTable,
  media as mediaTable,
  products as productsTable,
  type Collection,
} from '@/lib/db/schema';

export interface CategoryCard {
  id: string;
  slug: string;
  name: string;
  description: string;
  position: number;
  image: { id: string; url: string; alt: string; width: number | null; height: number | null } | null;
  productCount?: number;
}

export interface CollectionCard {
  id: string;
  slug: string;
  name: string;
  description: string;
  isFeatured: boolean;
  position: number;
  coverImage: { id: string; url: string; alt: string; width: number | null; height: number | null } | null;
  productCount?: number;
}

const COVER_COLUMNS = {
  imageId: mediaTable.id,
  imageUrl: mediaTable.url,
  imageAlt: mediaTable.alt,
  imageWidth: mediaTable.width,
  imageHeight: mediaTable.height,
};

function toImage(row: { imageId: string | null; imageUrl: string | null; imageAlt: string | null; imageWidth: number | null; imageHeight: number | null }) {
  if (!row.imageId || !row.imageUrl) return null;
  return {
    id: row.imageId,
    url: row.imageUrl,
    alt: row.imageAlt ?? '',
    width: row.imageWidth,
    height: row.imageHeight,
  };
}

/** Published categories, ordered — used by navigation and the shop page. */
export async function getPublicCategories(): Promise<CategoryCard[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: categoriesTable.id,
      slug: categoriesTable.slug,
      name: categoriesTable.name,
      description: categoriesTable.description,
      position: categoriesTable.position,
      ...COVER_COLUMNS,
    })
    .from(categoriesTable)
    .leftJoin(mediaTable, sql`${mediaTable.id} = ${categoriesTable.imageId}`)
    .where(sql`${categoriesTable.status} = 'published'`)
    .orderBy(asc(categoriesTable.position), asc(categoriesTable.name));

  const counts = await getCategoryCounts();
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    position: row.position,
    image: toImage(row),
    productCount: counts.get(row.id) ?? 0,
  }));
}

async function getCategoryCounts(): Promise<Map<string, number>> {
  const db = await getDb();
  const rows = await db.execute(sql`
    SELECT c.id, COUNT(p.id)::int AS total
    FROM categories c
    LEFT JOIN product_categories pc ON pc.category_id = c.id
    LEFT JOIN products p ON p.id = pc.product_id AND p.status = 'published'
    WHERE c.status = 'published'
    GROUP BY c.id
  `);
  const map = new Map<string, number>();
  for (const row of toRows(rows)) {
    map.set(String(row.id), Number(row.total ?? 0));
  }
  return map;
}

export async function getCategoryBySlug(slug: string): Promise<CategoryCard | null> {
  const db = await getDb();
  const rows = await db
    .select({
      id: categoriesTable.id,
      slug: categoriesTable.slug,
      name: categoriesTable.name,
      description: categoriesTable.description,
      position: categoriesTable.position,
      ...COVER_COLUMNS,
    })
    .from(categoriesTable)
    .leftJoin(mediaTable, sql`${mediaTable.id} = ${categoriesTable.imageId}`)
    .where(sql`${categoriesTable.slug} = ${slug} AND ${categoriesTable.status} = 'published'`)
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const counts = await getCategoryCounts();
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    position: row.position,
    image: toImage(row),
    productCount: counts.get(row.id) ?? 0,
  };
}

async function getCollectionCounts(): Promise<Map<string, number>> {
  const db = await getDb();
  const rows = await db.execute(sql`
    SELECT c.id, COUNT(p.id)::int AS total
    FROM collections c
    LEFT JOIN collection_products cp ON cp.collection_id = c.id
    LEFT JOIN products p ON p.id = cp.product_id AND p.status = 'published'
    WHERE c.status = 'published'
    GROUP BY c.id
  `);
  const map = new Map<string, number>();
  for (const row of toRows(rows)) {
    map.set(String(row.id), Number(row.total ?? 0));
  }
  return map;
}

function baseCollectionQuery(db: Awaited<ReturnType<typeof getDb>>) {
  return db
    .select({
      id: collectionsTable.id,
      slug: collectionsTable.slug,
      name: collectionsTable.name,
      description: collectionsTable.description,
      isFeatured: collectionsTable.isFeatured,
      position: collectionsTable.position,
      ...COVER_COLUMNS,
    })
    .from(collectionsTable)
    .leftJoin(mediaTable, sql`${mediaTable.id} = ${collectionsTable.coverImageId}`);
}

interface CollectionSelectRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  isFeatured: boolean;
  position: number;
  imageId: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
}

function mapCollections(rows: CollectionSelectRow[], counts: Map<string, number>): CollectionCard[] {
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    isFeatured: row.isFeatured,
    position: row.position,
    coverImage: toImage(row),
    productCount: counts.get(row.id) ?? 0,
  }));
}

export async function getPublicCollections(): Promise<CollectionCard[]> {
  const db = await getDb();
  const rows = await baseCollectionQuery(db)
    .where(sql`${collectionsTable.status} = 'published'`)
    .orderBy(asc(collectionsTable.position), asc(collectionsTable.name));
  return mapCollections(rows, await getCollectionCounts());
}

export async function getFeaturedCollections(limit = 6): Promise<CollectionCard[]> {
  const db = await getDb();
  const rows = await baseCollectionQuery(db)
    .where(sql`${collectionsTable.status} = 'published' AND ${collectionsTable.isFeatured} = true`)
    .orderBy(asc(collectionsTable.position))
    .limit(limit);
  return mapCollections(rows, await getCollectionCounts());
}

export async function getCollectionBySlug(slug: string): Promise<CollectionCard | null> {
  const db = await getDb();
  const rows = await baseCollectionQuery(db)
    .where(sql`${collectionsTable.slug} = ${slug} AND ${collectionsTable.status} = 'published'`)
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const counts = await getCollectionCounts();
  return mapCollections([row], counts)[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* Admin-facing reads (include drafts)                                */
/* ------------------------------------------------------------------ */

export async function getAllCategories(): Promise<(CategoryCard & { status: string })[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: categoriesTable.id,
      slug: categoriesTable.slug,
      name: categoriesTable.name,
      description: categoriesTable.description,
      position: categoriesTable.position,
      status: categoriesTable.status,
      ...COVER_COLUMNS,
    })
    .from(categoriesTable)
    .leftJoin(mediaTable, sql`${mediaTable.id} = ${categoriesTable.imageId}`)
    .orderBy(asc(categoriesTable.position), asc(categoriesTable.name));

  const counts = await db.execute(sql`
    SELECT c.id, COUNT(p.id)::int AS total
    FROM categories c
    LEFT JOIN product_categories pc ON pc.category_id = c.id
    LEFT JOIN products p ON p.id = pc.product_id AND p.status = 'published'
    GROUP BY c.id
  `);
  const map = new Map<string, number>();
  for (const row of toRows(counts)) {
    map.set(String(row.id), Number(row.total ?? 0));
  }

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    position: row.position,
    status: row.status,
    image: toImage(row),
    productCount: map.get(row.id) ?? 0,
  }));
}

export async function getAllCollections(): Promise<(CollectionCard & { status: string; selectionMode: string })[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: collectionsTable.id,
      slug: collectionsTable.slug,
      name: collectionsTable.name,
      description: collectionsTable.description,
      isFeatured: collectionsTable.isFeatured,
      position: collectionsTable.position,
      status: collectionsTable.status,
      selectionMode: collectionsTable.selectionMode,
      ...COVER_COLUMNS,
    })
    .from(collectionsTable)
    .leftJoin(mediaTable, sql`${mediaTable.id} = ${collectionsTable.coverImageId}`)
    .orderBy(asc(collectionsTable.position), asc(collectionsTable.name));

  const counts = await db.execute(sql`
    SELECT c.id, COUNT(p.id)::int AS total
    FROM collections c
    LEFT JOIN collection_products cp ON cp.collection_id = c.id
    LEFT JOIN products p ON p.id = cp.product_id AND p.status = 'published'
    GROUP BY c.id
  `);
  const map = new Map<string, number>();
  for (const row of toRows(counts)) {
    map.set(String(row.id), Number(row.total ?? 0));
  }

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    isFeatured: row.isFeatured,
    position: row.position,
    status: row.status,
    selectionMode: row.selectionMode,
    coverImage: toImage(row),
    productCount: map.get(row.id) ?? 0,
  }));
}

/** Resolves the product ids for a rule-based collection. */
export async function resolveCollectionProductIds(collection: Collection): Promise<string[]> {
  const db = await getDb();
  if (collection.selectionMode === 'manual') {
    const rows = await db
      .select({ productId: collectionProducts.productId })
      .from(collectionProducts)
      .where(sql`${collectionProducts.collectionId} = ${collection.id}`)
      .orderBy(asc(collectionProducts.position));
    return rows.map((row) => row.productId);
  }

  const rules = collection.rules ?? [];
  const grouped = new Map<string, SQL[]>();

  const push = (field: string, fragment: SQL) => {
    const list = grouped.get(field) ?? [];
    list.push(fragment);
    grouped.set(field, list);
  };

  for (const rule of rules) {
    switch (rule.field) {
      case 'category': {
        const slug = String(rule.value);
        push(
          'category',
          sql`EXISTS (
            SELECT 1 FROM product_categories pc
            JOIN categories c ON c.id = pc.category_id
            WHERE pc.product_id = p.id AND c.slug = ${slug}
          )`,
        );
        break;
      }
      case 'featured':
        push('featured', sql`p.featured = true`);
        break;
      case 'newArrival':
        push('newArrival', sql`p.is_new_arrival = true`);
        break;
      case 'bestSeller':
        push('bestSeller', sql`p.is_best_seller = true`);
        break;
      case 'priceBelow':
        push('priceBelow', sql`COALESCE(p.sale_price, p.price) <= ${Number(rule.value) * 100}`);
        break;
      case 'priceAbove':
        push('priceAbove', sql`COALESCE(p.sale_price, p.price) >= ${Number(rule.value) * 100}`);
        break;
      default:
        break;
    }
  }

  const conditions: SQL[] = [sql`p.status = 'published'`];
  for (const fragments of grouped.values()) {
    conditions.push(
      fragments.length === 1 ? fragments[0] : sql`(${sql.join(fragments, sql` OR `)})`,
    );
  }

  const result = await db.execute(sql`
    SELECT p.id
    FROM products p
    WHERE ${sql.join(conditions, sql` AND `)}
    ORDER BY p.created_at DESC
    LIMIT 500
  `);
  return toRows(result).map((row) => String(row.id));
}

export async function getRecentProducts(limit = 8): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(sql`${productsTable.status} = 'published'`)
    .orderBy(desc(productsTable.createdAt))
    .limit(limit);
  return rows.map((row) => row.id);
}
