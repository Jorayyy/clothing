import { desc, sql } from 'drizzle-orm';

import { AdminPageHeader } from '@/components/admin/page-header';
import { EmptyState, Pagination } from '@/components/ui/misc';
import { getDb } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { formatDateTime } from '@/lib/format';
import { strParam } from '@/lib/utils';

export const metadata = { title: 'Audit log' };

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(strParam(params.page) ?? 1) || 1);
  const perPage = 30;

  const db = await getDb();
  const [countRow, rows] = await Promise.all([
    db.select({ value: sql<number>`count(*)::int` }).from(auditLogs),
    db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
  ]);

  const total = Number(countRow[0]?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <>
      <AdminPageHeader
        title="Audit log"
        description={`${total} recorded change${total === 1 ? '' : 's'}. Sign-ins, content edits and destructive actions.`}
      />

      {rows.length === 0 ? (
        <div className="border border-line bg-surface p-6">
          <EmptyState title="Nothing logged yet" description="Administrative changes appear here." />
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-muted">
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Who</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {formatDateTime(row.createdAt)}
                  </td>
                  <td className="px-4 py-3">{row.actorLabel || 'system'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.action}</td>
                  <td className="px-4 py-3">
                    {row.summary}
                    {row.ip ? <span className="ml-2 text-xs text-muted">({row.ip})</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5">
        <Pagination page={page} totalPages={totalPages} basePath="/admin/audit" />
      </div>
    </>
  );
}
