import Link from 'next/link';

import { AdminPageHeader } from '@/components/admin/page-header';
import { Badge, EmptyState } from '@/components/ui/misc';
import { getDashboardStats } from '@/lib/queries/admin';

function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: number;
  hint?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 font-display text-[2.2rem] leading-none">{value}</p>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block border border-line bg-surface p-4 transition-colors hover:border-ink"
      >
        {body}
      </Link>
    );
  }
  return <div className="border border-line bg-surface p-4">{body}</div>;
}

const STATUS_TONE: Record<string, 'solid' | 'accent' | 'sale' | 'outline'> = {
  new: 'accent',
  open: 'outline',
  resolved: 'solid',
  spam: 'sale',
};

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="A quick read on the catalogue, content and conversations waiting on you."
        actions={
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            Add product
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Products"
          value={stats.products.total}
          hint={`${stats.products.published} published · ${stats.products.drafts} draft`}
          href="/admin/products"
        />
        <StatCard
          label="New inquiries"
          value={stats.engagement.newInquiries}
          hint={`${stats.engagement.inquiries} total`}
          href="/admin/inquiries"
        />
        <StatCard
          label="Subscribers"
          value={stats.engagement.subscribers}
          hint="Newsletter list"
          href="/admin/newsletter"
        />
        <StatCard
          label="Media files"
          value={stats.catalog.media}
          hint={`${stats.catalog.pages} pages · ${stats.catalog.collections} collections`}
          href="/admin/media"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold">Latest inquiries</h2>
            <Link href="/admin/inquiries" className="text-xs text-muted hover:text-ink">
              View all
            </Link>
          </div>
          {stats.recentInquiries.length === 0 ? (
            <div className="p-4">
              <EmptyState title="No inquiries yet" description="Messages sent from the site will appear here." />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {stats.recentInquiries.map((inquiry) => (
                <li key={inquiry.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {inquiry.name ?? 'Anonymous'}
                      {inquiry.productName ? (
                        <span className="font-normal text-muted"> · {inquiry.productName}</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">{inquiry.message ?? '—'}</p>
                  </div>
                  <Badge tone={STATUS_TONE[inquiry.status] ?? 'outline'}>{inquiry.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold">Recent admin activity</h2>
            <Link href="/admin/audit" className="text-xs text-muted hover:text-ink">
              Audit log
            </Link>
          </div>
          {stats.recentAudit.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Nothing logged yet" description="Administrative changes are recorded here." />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {stats.recentAudit.map((entry) => (
                <li key={entry.id} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm">{entry.summary || entry.action}</p>
                    <time
                      dateTime={entry.createdAt.toISOString()}
                      className="shrink-0 text-xs text-muted"
                    >
                      {entry.createdAt.toLocaleString('en-PH', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </time>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {entry.actorLabel || 'system'} · {entry.action}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Categories"
          value={stats.catalog.categories}
          hint="Taxonomy"
          href="/admin/categories"
        />
        <StatCard
          label="Homepage sections"
          value={stats.presentation.sections}
          hint={`${stats.presentation.enabledSections} enabled`}
          href="/admin/homepage"
        />
        <StatCard
          label="Navigation items"
          value={stats.presentation.navigation}
          hint="Header & footer menus"
          href="/admin/navigation"
        />
      </div>
    </>
  );
}
