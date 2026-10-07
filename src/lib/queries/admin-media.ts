import 'server-only';

import { desc } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import { media } from '@/lib/db/schema';

export interface MediaRow {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  alt: string;
  createdAt: Date;
}

export async function listMedia(limit = 300): Promise<MediaRow[]> {
  const db = await getDb();
  return db
    .select({
      id: media.id,
      url: media.url,
      fileName: media.fileName,
      mimeType: media.mimeType,
      byteSize: media.byteSize,
      width: media.width,
      height: media.height,
      alt: media.alt,
      createdAt: media.createdAt,
    })
    .from(media)
    .orderBy(desc(media.createdAt))
    .limit(limit);
}

export async function listMediaByIds(ids: string[]): Promise<MediaRow[]> {
  if (ids.length === 0) return [];
  const rows = await listMedia(1000);
  const wanted = new Set(ids);
  return rows.filter((row) => wanted.has(row.id));
}
