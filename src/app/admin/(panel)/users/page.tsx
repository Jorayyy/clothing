import { asc } from 'drizzle-orm';

import { AdminPageHeader } from '@/components/admin/page-header';
import { requireSession } from '@/lib/auth/guard';
import { getDb } from '@/lib/db';
import { adminUsers } from '@/lib/db/schema';
import { formatDateTime } from '@/lib/format';

import { UserForm } from './user-form';

export const metadata = { title: 'Users' };

const ROLE_TONE: Record<string, string> = {
  owner: 'tag tag-accent',
  admin: 'tag',
  editor: 'tag tag-outline',
  viewer: 'tag tag-outline',
};

export default async function UsersPage() {
  const session = await requireSession();
  const db = await getDb();
  const rows = await db
    .select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
      status: adminUsers.status,
      lastLoginAt: adminUsers.lastLoginAt,
      createdAt: adminUsers.createdAt,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.name));

  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Roles decide what each person can touch. Owner is the only role that can manage users."
      />

      <details className="mb-6 border border-line bg-surface">
        <summary className="cursor-pointer px-5 py-3 text-sm font-medium hover:bg-bg">
          Invite a teammate
        </summary>
        <div className="border-t border-line p-5">
          <UserForm isSelf={false} />
        </div>
      </details>

      <div className="space-y-3">
        {rows.map((row) => (
          <details key={row.id} className="border border-line bg-surface">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-bg">
              <span className="min-w-0">
                <span className="font-medium">{row.name}</span>
                <span className="ml-2 text-xs text-muted">{row.email}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                <span>last sign-in {row.lastLoginAt ? formatDateTime(row.lastLoginAt) : 'never'}</span>
                <span className={ROLE_TONE[row.role] ?? 'tag tag-outline'}>{row.role}</span>
                <span className={row.status === 'active' ? 'tag tag-accent' : 'tag tag-sale'}>
                  {row.status}
                </span>
              </span>
            </summary>
            <div className="border-t border-line p-5">
              <UserForm
                user={{
                  id: row.id,
                  name: row.name,
                  email: row.email,
                  role: row.role,
                  status: row.status,
                }}
                isSelf={row.id === session.user.id}
              />
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
