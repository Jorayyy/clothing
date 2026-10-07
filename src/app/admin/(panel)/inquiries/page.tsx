import { desc, sql } from 'drizzle-orm';
import Link from 'next/link';

import { AdminPageHeader } from '@/components/admin/page-header';
import { EmptyState, Pagination } from '@/components/ui/misc';
import { getDb } from '@/lib/db';
import { inquiries } from '@/lib/db/schema';
import { formatDateTime } from '@/lib/format';
import { strParam } from '@/lib/utils';

import { InquiryActions } from './inquiry-actions';

export const metadata = { title: 'Inquiries' };

const TONE: Record<string, string> = {
  new: 'tag tag-accent',
  open: 'tag tag-outline',
  resolved: 'tag',
  spam: 'tag tag-sale',
};

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = strParam(params.status) ?? '';
  const page = Math.max(1, Number(strParam(params.page) ?? 1) || 1);
  const perPage = 20;

  const db = await getDb();
  const where = status ? sql`${inquiries.status} = ${status}` : undefined;

  const [totalRow, rows] = await Promise.all([
    db.select({ value: sql<number>`count(*)::int` }).from(inquiries).where(where),
    db
      .select()
      .from(inquiries)
      .where(where)
      .orderBy(desc(inquiries.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
  ]);

  const total = Number(totalRow[0]?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const filters: Record<string, string> = {};
  if (status) filters.status = status;

  const tabs = [
    { value: '', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'open', label: 'Open' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'spam', label: 'Spam' },
  ];

  return (
    <>
      <AdminPageHeader
        title="Inquiries"
        description="Messages captured by the contact form and product inquiry buttons."
      />

      <nav className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const href = tab.value ? `/admin/inquiries?status=${tab.value}` : '/admin/inquiries';
          const active = status === tab.value;
          return (
            <Link
              key={tab.value}
              href={href}
              className={active ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <div className="border border-line bg-surface p-6">
          <EmptyState
            title="No inquiries"
            description="Messages sent from the storefront will show up here."
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {row.name ?? 'Anonymous'}
                    {row.email ? <span className="ml-2 text-xs font-normal text-muted">{row.email}</span> : null}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {row.productName ? `${row.productName} · ` : ''}
                    {row.variantSummary ? `${row.variantSummary} · ` : ''}
                    {row.channel}/{row.source} · {formatDateTime(row.createdAt)}
                  </p>
                </div>
                <span className={TONE[row.status] ?? 'tag tag-outline'}>{row.status}</span>
              </div>

              {row.message ? (
                <p className="mt-3 whitespace-pre-wrap border-l-2 border-line pl-3 text-sm leading-relaxed">
                  {row.message}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <span className="text-xs text-muted">{row.referrerPath ?? '—'}</span>
                <InquiryActions id={row.id} status={row.status} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5">
        <Pagination
          page={page}
          totalPages={totalPages}
          basePath="/admin/inquiries"
          searchParams={filters}
        />
      </div>
    </>
  );
}
