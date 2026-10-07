import 'server-only';

import { and, eq } from 'drizzle-orm';
import { cache } from 'react';

import { getDb } from '@/lib/db';
import { adminUsers, type AdminUser } from '@/lib/db/schema';

import { readSessionToken, verifySessionToken } from './session';

export type Role = 'owner' | 'admin' | 'editor' | 'viewer';

const ROLE_RANK: Record<Role, number> = { viewer: 1, editor: 2, admin: 3, owner: 4 };

export function roleAtLeast(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export class AuthError extends Error {
  readonly code: 'unauthenticated' | 'forbidden' | 'invalid-session';
  constructor(code: AuthError['code'], message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export interface Session {
  user: Pick<AdminUser, 'id' | 'email' | 'name' | 'role' | 'status' | 'tokenVersion'>;
  sid: string;
}

/**
 * Resolves the signed-in administrator for the current request.
 * Memoised per render pass; returns null when there is no valid session.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = await readSessionToken();
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const db = await getDb();
  const rows = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      status: adminUsers.status,
      tokenVersion: adminUsers.tokenVersion,
    })
    .from(adminUsers)
    .where(() =>
      and(
        eq(adminUsers.id, payload.uid),
        eq(adminUsers.tokenVersion, payload.tv),
        eq(adminUsers.status, 'active'),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return { user: row, sid: payload.sid };
});

/** Throws when there is no authenticated, active administrator. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new AuthError('unauthenticated', 'Sign in to continue.');
  return session;
}

/** Throws unless the signed-in user holds at least `minimum`. */
export async function requireRole(minimum: Role): Promise<Session> {
  const session = await requireSession();
  if (!roleAtLeast(session.user.role as Role, minimum)) {
    throw new AuthError('forbidden', 'You do not have permission to perform this action.');
  }
  return session;
}

export const PERMISSIONS = {
  manageProducts: 'editor',
  manageMedia: 'editor',
  manageContent: 'editor',
  manageCatalog: 'admin',
  manageTheme: 'admin',
  manageSettings: 'admin',
  manageUsers: 'owner',
  viewAuditLog: 'admin',
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return roleAtLeast(role, PERMISSIONS[permission] as Role);
}
