import { asc, sql } from 'drizzle-orm';

import { AdminPageHeader } from '@/components/admin/page-header';
import { getDb } from '@/lib/db';
import { collectionProducts, collections, products } from '@/lib/db/schema';
import { listMedia } from '@/lib/queries/admin-media';

import { CollectionForm } from './collection-form';

export const metadata = { title: 'Collections' };

export default async function CollectionsPage() {
  const db = await getDb();

  const [rows, productRows, productLinks, mediaOptions] = await Promise.all([
    db
      .select()
      .from(collections)
      .orderBy(asc(collections.position), asc(collections.name)),
    db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(sql`${products.status} <> 'archived'`)
      .orderBy(asc(products.name))
      .limit(500),
    db
      .select({ collectionId: collectionProducts.collectionId, productId: collectionProducts.productId })
      .from(collectionProducts)
      .orderBy(asc(collectionProducts.position)),
    listMedia(),
  ]);

  const media = mediaOptions.map((row) => ({
    id: row.id,
    url: row.url,
    alt: row.alt,
    fileName: row.fileName,
  }));

  const productIdsByCollection = new Map<string, string[]>();
  for (const link of productLinks) {
    const list = productIdsByCollection.get(link.collectionId) ?? [];
    list.push(link.productId);
    productIdsByCollection.set(link.collectionId, list);
  }

  const sorted = new Map<string, string[]>();
  for (const [collectionId, ids] of productIdsByCollection) {
    const order = new Map(productRows.map((product, index) => [product.id, index]));
    sorted.set(
      collectionId,
      [...ids].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0)),
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Collections"
        description="Curated product groups. Featured collections appear on the homepage."
      />

      <details className="mb-6 border border-line bg-surface">
        <summary className="cursor-pointer px-5 py-3 text-sm font-medium hover:bg-bg">
          New collection
        </summary>
        <div className="border-t border-line p-5">
          <CollectionForm products={productRows} productIds={[]} mediaOptions={media} />
        </div>
      </details>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="border border-line bg-surface px-5 py-8 text-center text-sm text-muted">
            No collections yet. Create the first one above.
          </p>
        ) : null}

        {rows.map((row) => (
          <details key={row.id} className="border border-line bg-surface">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-bg">
              <span className="min-w-0">
                <span className="font-medium">{row.name}</span>
                <span className="ml-2 text-xs text-muted">/{row.slug}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                <span>
                  {(sorted.get(row.id) ?? []).length} product
                  {(sorted.get(row.id) ?? []).length === 1 ? '' : 's'}
                </span>
                {row.isFeatured ? <span className="tag tag-accent">featured</span> : null}
                <span className={row.status === 'published' ? 'tag tag-accent' : 'tag tag-outline'}>
                  {row.status}
                </span>
              </span>
            </summary>
            <div className="border-t border-line p-5">
              <CollectionForm
                collection={{
                  id: row.id,
                  name: row.name,
                  slug: row.slug,
                  description: row.description,
                  status: row.status as 'draft' | 'published',
                  selectionMode: row.selectionMode,
                  isFeatured: row.isFeatured,
                  position: row.position,
                  coverImageId: row.coverImageId,
                }}
                productIds={sorted.get(row.id) ?? []}
                products={productRows}
                mediaOptions={media}
              />
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
