import { asc, sql } from 'drizzle-orm';

import { AdminPageHeader } from '@/components/admin/page-header';
import { getDb } from '@/lib/db';
import { pages } from '@/lib/db/schema';
import { listMedia } from '@/lib/queries/admin-media';
import { RESERVED_PAGE_SLUGS } from '@/lib/queries/content';

import { PageForm } from './page-form';

export const metadata = { title: 'Pages' };

export default async function PagesAdminPage() {
  const db = await getDb();

  const [rows, mediaOptions] = await Promise.all([
    db
      .select({
        id: pages.id,
        title: pages.title,
        slug: pages.slug,
        status: pages.status,
        showInFooter: pages.showInFooter,
        seoTitle: pages.seoTitle,
        seoDescription: pages.seoDescription,
        content: pages.content,
        blockCount: sql<number>`coalesce(jsonb_array_length(${pages.content}), 0)::int`,
      })
      .from(pages)
      .orderBy(asc(pages.title)),
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
        title="Pages"
        description="Custom pages live at /pages/[handle]. The policy pages below are reserved and edited here too."
        actions={<span className="text-xs text-muted">Reserved: {RESERVED_PAGE_SLUGS.join(', ')}</span>}
      />

      <details className="mb-6 border border-line bg-surface">
        <summary className="cursor-pointer px-5 py-3 text-sm font-medium hover:bg-bg">
          New page
        </summary>
        <div className="border-t border-line p-5">
          <PageForm mediaOptions={media} />
        </div>
      </details>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="border border-line bg-surface px-5 py-8 text-center text-sm text-muted">
            No pages yet.
          </p>
        ) : null}

        {rows.map((row) => (
          <details key={row.id} className="border border-line bg-surface">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-bg">
              <span className="min-w-0">
                <span className="font-medium">{row.title}</span>
                <span className="ml-2 text-xs text-muted">/pages/{row.slug}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                <span>
                  {row.blockCount} block{row.blockCount === 1 ? '' : 's'}
                </span>
                <span className={row.status === 'published' ? 'tag tag-accent' : 'tag tag-outline'}>
                  {row.status}
                </span>
              </span>
            </summary>
            <div className="border-t border-line p-5">
              <PageForm
                page={{
                  id: row.id,
                  title: row.title,
                  slug: row.slug,
                  content: (row.content ?? []) as never,
                  status: row.status as 'draft' | 'published',
                  showInFooter: row.showInFooter,
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
