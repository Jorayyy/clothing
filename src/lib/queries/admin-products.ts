import 'server-only';

import { asc, count, desc, or, sql, type SQL } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import { media, productImages, products } from '@/lib/db/schema';

export interface AdminProductRow {
  id: string;
  slug: string;
  name: string;
  status: 'draft' | 'published' | 'archived';
  price: number;
  salePrice: number | null;
  updatedAt: Date;
  imageUrl: string | null;
}

export interface AdminProductList {
  items: AdminProductRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface AdminProductListParams {
  q?: string;
  status?: 'all' | 'draft' | 'published' | 'archived';
  page?: number;
  perPage?: number;
}

export async function listAdminProducts(params: AdminProductListParams = {}): Promise<AdminProductList> {
  const db = await getDb();
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 12));

  const conditions: SQL[] = [];
  const status = params.status ?? 'all';
  if (status !== 'all') conditions.push(sql`${products.status} = ${status}`);

  const q = params.q?.trim();
  if (q) {
    const needle = `%${q.replace(/[%_\\]/g, (match) => `\\${match}`)}%`;
    conditions.push(
      or(
        sql`${products.name} ILIKE ${needle} ESCAPE '\\'`,
        sql`${products.slug} ILIKE ${needle} ESCAPE '\\'`,
        sql`${products.sku} ILIKE ${needle} ESCAPE '\\'`,
        sql`${products.summary} ILIKE ${needle} ESCAPE '\\'`,
      )!,
    );
  }

  const where = conditions.length ? sql.join(conditions, sql` AND `) : undefined;

  const [totalRow] = await db.select({ value: count() }).from(products).where(where);
  const total = totalRow?.value ?? 0;

  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      status: products.status,
      price: products.price,
      salePrice: products.salePrice,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .where(where)
    .orderBy(desc(products.updatedAt))
    .limit(perPage)
    .offset((page - 1) * perPage);

  const coverByProduct = new Map<string, string>();
  if (rows.length > 0) {
    const imageRows = await db
      .select({
        productId: productImages.productId,
        url: media.url,
        position: productImages.position,
      })
      .from(productImages)
      .innerJoin(media, () => sql`${media.id} = ${productImages.mediaId}`)
      .where(
        sql`${productImages.productId} IN (${sql.join(
          rows.map((row) => sql`${row.id}`),
          sql`, `,
        )})`,
      )
      .orderBy(asc(productImages.position));

    for (const image of imageRows) {
      if (!coverByProduct.has(image.productId)) coverByProduct.set(image.productId, image.url);
    }
  }

  return {
    items: rows.map((row) => ({ ...row, imageUrl: coverByProduct.get(row.id) ?? null })),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}
