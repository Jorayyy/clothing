import { desc, sql } from 'drizzle-orm';

import { AdminPageHeader } from '@/components/admin/page-header';
import { EmptyState } from '@/components/ui/misc';
import { getDb } from '@/lib/db';
import { newsletterSubscribers } from '@/lib/db/schema';
import { formatDate } from '@/lib/format';

import { SubscriberActions } from './subscriber-actions';

export const metadata = { title: 'Newsletter' };

export default async function NewsletterPage() {
  const db = await getDb();
  const [countRow, rows] = await Promise.all([
    db.select({ value: sql<number>`count(*)::int` }).from(newsletterSubscribers),
    db
      .select()
      .from(newsletterSubscribers)
      .orderBy(desc(newsletterSubscribers.createdAt))
      .limit(500),
  ]);

  const total = Number(countRow[0]?.value ?? 0);

  return (
    <>
      <AdminPageHeader
        title="Newsletter"
        description={`${total} subscriber${total === 1 ? '' : 's'}. Addresses are stored only when someone opts in.`}
      />

      {rows.length === 0 ? (
        <div className="border border-line bg-surface p-6">
          <EmptyState
            title="No subscribers yet"
            description="Sign-ups from the footer and homepage newsletter section will appear here."
          />
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[28rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-muted">
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Added</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3 text-muted">{row.source}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <SubscriberActions id={row.id} email={row.email} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
