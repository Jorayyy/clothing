import 'server-only';

import { headers } from 'next/headers';
import { sql } from 'drizzle-orm';

import { getDb } from '@/lib/db';

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Fixed-window counter stored in Postgres so limits hold across serverless
 * instances instead of depending on per-process memory.
 */
export async function consumeRateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000);
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((windowStart.getTime() + windowSeconds * 1000 - now.getTime()) / 1000),
  );

  try {
    const db = await getDb();
    const result = await db.execute(sql`
      INSERT INTO rate_limits (bucket, window_start, hits)
      VALUES (${bucket}, ${windowStart}, 1)
      ON CONFLICT (bucket) DO UPDATE
        SET hits = CASE
              WHEN rate_limits.window_start < ${windowStart} THEN 1
              ELSE rate_limits.hits + 1
            END,
            window_start = CASE
              WHEN rate_limits.window_start < ${windowStart} THEN ${windowStart}
              ELSE rate_limits.window_start
            END
      RETURNING hits
    `);
    const rows = normaliseRows(result);
    const hits = Number(rows[0]?.hits ?? limit + 1);
    return {
      ok: hits <= limit,
      limit,
      remaining: Math.max(0, limit - hits),
      retryAfterSeconds,
    };
  } catch (error) {
    // Failing open would let an outage block sign-ins; log loudly instead and
    // fall back to a permissive decision for this request only.
    console.error('[rate-limit] unavailable, allowing request:', error);
    return { ok: true, limit, remaining: limit, retryAfterSeconds };
  }
}

function normaliseRows(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[];
  const rows = (result as { rows?: unknown })?.rows;
  return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
}

/** Drops expired windows so the table never grows unbounded. */
export async function pruneRateLimits(): Promise<void> {
  try {
    const db = await getDb();
    await db.execute(sql`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`);
  } catch (error) {
    console.error('[rate-limit] prune failed:', error);
  }
}

export async function getClientIp(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return headerStore.get('x-real-ip') ?? 'unknown';
}
