import 'server-only';

import { eq, inArray, sql } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import { toRows } from '@/lib/db/result';
import { media as mediaTable, type MediaAsset } from '@/lib/db/schema';

import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  readImageDimensions,
  sanitiseFileName,
  sniffImageType,
} from './storage/image';
import { deleteBytes, putBytes, StorageError } from './storage';

export class MediaError extends Error {
  readonly code: 'too-large' | 'unsupported' | 'read-failed' | 'storage' | 'in-use' | 'not-found';
  constructor(code: MediaError['code'], message: string) {
    super(message);
    this.name = 'MediaError';
    this.code = code;
  }
}

export interface UploadMediaInput {
  bytes: Uint8Array;
  fileName: string;
  alt?: string;
  /** Client-declared type. Recorded only as a hint — bytes win. */
  declaredType?: string;
}

function storageKeyFor(fileName: string, extension: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const unique = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `${year}/${month}/${sanitiseFileName(fileName)}-${unique}.${extension}`;
}

export async function uploadMedia(input: UploadMediaInput): Promise<MediaAsset> {
  const { bytes } = input;
  if (bytes.byteLength === 0) throw new MediaError('read-failed', 'The uploaded file was empty.');
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new MediaError(
      'too-large',
      `Images must be ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB or smaller.`,
    );
  }

  const detected = sniffImageType(bytes);
  if (!detected) {
    throw new MediaError('unsupported', 'Unsupported image format. Use JPEG, PNG, WebP, AVIF or GIF.');
  }
  const extension = ALLOWED_IMAGE_TYPES[detected];
  if (!extension) throw new MediaError('unsupported', 'Unsupported image format.');

  const key = storageKeyFor(input.fileName, extension);
  let url: string;
  try {
    url = await putBytes(key, bytes, detected);
  } catch (error) {
    if (error instanceof StorageError) throw new MediaError('storage', error.message);
    throw new MediaError('storage', 'The image could not be stored. Try again.');
  }

  const { width, height } = readImageDimensions(bytes, detected);
  const db = await getDb();
  const rows = await db
    .insert(mediaTable)
    .values({
      url,
      storageKey: key,
      fileName: input.fileName || `image.${extension}`,
      mimeType: detected,
      byteSize: bytes.byteLength,
      width,
      height,
      alt: (input.alt ?? '').slice(0, 300),
    })
    .returning();
  const record = rows[0];
  if (!record) throw new MediaError('storage', 'The image record could not be saved.');
  return record;
}

export async function getMediaById(id: string): Promise<MediaAsset | null> {
  const db = await getDb();
  const rows = await db.select().from(mediaTable).where(eq(mediaTable.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Batch lookup preserving the requested order; unknown ids resolve to null. */
export async function getMediaByIds(ids: string[]): Promise<(MediaAsset | null)[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return ids.map(() => null);
  const db = await getDb();
  const rows = await db.select().from(mediaTable).where(inArray(mediaTable.id, unique));
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => byId.get(id) ?? null);
}

export async function updateMediaAlt(id: string, alt: string): Promise<void> {
  const db = await getDb();
  await db
    .update(mediaTable)
    .set({ alt: alt.slice(0, 300) })
    .where(eq(mediaTable.id, id));
}

export interface MediaReference {
  table: string;
  id: string;
}

/** Finds every place a media asset is used so deletion cannot break the site. */
export async function findMediaReferences(id: string): Promise<MediaReference[]> {
  const db = await getDb();
  const result = await db.execute(sql`
    SELECT 'product_images' AS table, id FROM product_images WHERE media_id = ${id}
    UNION ALL
    SELECT 'product_social', id FROM products WHERE social_image_id = ${id}
    UNION ALL
    SELECT 'category_image', id FROM categories WHERE image_id = ${id}
    UNION ALL
    SELECT 'collection_cover', id FROM collections WHERE cover_image_id = ${id}
    UNION ALL
    SELECT 'home_section', id FROM home_sections WHERE config::text LIKE ${`%${id}%`}
    UNION ALL
    SELECT 'page_content', id FROM pages WHERE content::text LIKE ${`%${id}%`}
    UNION ALL
    SELECT 'setting', key FROM settings WHERE value::text LIKE ${`%${id}%`}
  `);
  return toRows(result).map((row) => ({ table: String(row.table), id: String(row.id) }));
}

export interface DeleteMediaResult {
  ok: boolean;
  message?: string;
}

export async function deleteMedia(id: string): Promise<DeleteMediaResult> {
  const record = await getMediaById(id);
  if (!record) return { ok: false, message: 'That image no longer exists.' };

  const references = await findMediaReferences(id);
  if (references.length > 0) {
    const where = [...new Set(references.map((r) => r.table))].join(', ');
    return { ok: false, message: `This image is still used by ${where} and cannot be deleted.` };
  }

  const db = await getDb();
  await db.delete(mediaTable).where(eq(mediaTable.id, id));
  try {
    await deleteBytes(record.storageKey);
  } catch (error) {
    console.error('[media] storage delete failed for', record.storageKey, error);
  }
  return { ok: true };
}

/** Validates an upload payload without persisting it (used by the quota/preview flow). */
export function validateImageBytes(bytes: Uint8Array): { ok: true; type: string } | { ok: false; message: string } {
  if (bytes.byteLength === 0) return { ok: false, message: 'The file is empty.' };
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return { ok: false, message: `Maximum size is ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB.` };
  }
  const detected = sniffImageType(bytes);
  if (!detected) return { ok: false, message: 'Unsupported image format.' };
  if (!ALLOWED_IMAGE_TYPES[detected]) return { ok: false, message: 'Unsupported image format.' };
  return { ok: true, type: detected };
}
