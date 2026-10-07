import { asc, sql } from 'drizzle-orm';

import { AdminPageHeader } from '@/components/admin/page-header';
import { getDb } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { listMedia } from '@/lib/queries/admin-media';

import { CategoryForm } from './category-form';

export const metadata = { title: 'Categories' };

export default async function CategoriesPage() {
  const db = await getDb();

  const [rows, mediaOptions] = await Promise.all([
    db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        status: categories.status,
        position: categories.position,
        imageId: categories.imageId,
        seoTitle: categories.seoTitle,
        seoDescription: categories.seoDescription,
        count: sql<number>`(
          SELECT count(*)::int FROM product_categories pc
          WHERE pc.category_id = ${categories.id}
        )`,
      })
      .from(categories)
      .orderBy(asc(categories.position), asc(categories.name)),
    listMedia(),
  ]);

  const media = mediaOptions.map((row) => ({
    id: row.id,
    url: row.url,
    alt: row.alt,
    fileName: row.fileName,
  }));

  return (
    <>
      <AdminPageHeader
        title="Categories"
        description="Categories drive the shop filters and the header dropdown."
      />

      <details className="mb-6 border border-line bg-surface">
        <summary className="cursor-pointer px-5 py-3 text-sm font-medium hover:bg-bg">
          New category
        </summary>
        <div className="border-t border-line p-5">
          <CategoryForm mediaOptions={media} />
        </div>
      </details>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="border border-line bg-surface px-5 py-8 text-center text-sm text-muted">
            No categories yet. Create the first one above.
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
                <span>{row.count} product{row.count === 1 ? '' : 's'}</span>
                <span className={row.status === 'published' ? 'tag tag-accent' : 'tag tag-outline'}>
                  {row.status}
                </span>
              </span>
            </summary>
            <div className="border-t border-line p-5">
              <CategoryForm
                category={{
                  id: row.id,
                  name: row.name,
                  slug: row.slug,
                  description: row.description,
                  status: row.status as 'draft' | 'published',
                  position: row.position,
                  imageId: row.imageId,
                  seoTitle: row.seoTitle,
                  seoDescription: row.seoDescription,
                }}
                mediaOptions={media}
              />
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
