import 'server-only';

import { getDb } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';

export interface AuditEntry {
  actorId?: string | null;
  actorLabel?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}

/**
 * Best-effort audit trail for sensitive administrative changes. Never throws —
 * an audit failure must not roll back the user's actual change.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(auditLogs).values({
      actorId: entry.actorId ?? null,
      actorLabel: entry.actorLabel ?? '',
      action: entry.action,
      entityType: entry.entityType ?? '',
      entityId: entry.entityId ?? '',
      summary: entry.summary ?? '',
      metadata: entry.metadata ?? {},
      ip: entry.ip ?? null,
    });
  } catch (error) {
    console.error('[audit] failed to record entry:', error);
  }
}
