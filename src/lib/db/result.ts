/** Normalises driver-specific `db.execute()` results into a plain row array. */
export function toRows<T = Record<string, unknown>>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  const rows = (result as { rows?: unknown })?.rows;
  if (Array.isArray(rows)) return rows as T[];
  return [];
}
