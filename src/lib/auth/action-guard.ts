import 'server-only';

import { AuthError, PERMISSIONS, requireRole, type Permission, type Session } from './guard';

export type { ActionState } from '@/lib/admin/action-state';
export { IDLE_STATE } from '@/lib/admin/action-state';

/** Resolves the caller, throwing `AuthError` when the permission is missing. */
export async function guardPermission(permission: Permission): Promise<Session> {
  return requireRole(PERMISSIONS[permission]);
}

/**
 * Converts an unexpected error into an action-safe state object.
 * Never call this around `redirect()` — Next uses an exception to navigate.
 */
export function toActionError(error: unknown): { error: string } {
  if (error instanceof AuthError) return { error: error.message };
  console.error('[admin action]', error);
  return { error: 'Something went wrong. Please try again.' };
}

export function fieldError(message: string): { error: string } {
  return { error: message };
}
