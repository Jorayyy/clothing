'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { recordAudit } from '@/lib/audit';
import { fieldError, guardPermission, toActionError, type ActionState } from '@/lib/auth/action-guard';
import { getDb } from '@/lib/db';
import { media } from '@/lib/db/schema';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  readImageDimensions,
  sanitiseFileName,
  sniffImageType,
} from '@/lib/storage/image';
import { deleteBytes, putBytes } from '@/lib/storage';

function randomKey(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

export async function uploadMediaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await guardPermission('manageMedia');
  } catch (error) {
    return toActionError(error);
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return fieldError('Choose a file to upload.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return fieldError(`File is larger than ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB.`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffImageType(bytes);
  if (!sniffed || !ALLOWED_IMAGE_TYPES[sniffed]) {
    return fieldError('Only JPEG, PNG, WebP, GIF and AVIF images are accepted.');
  }

  const alt = String(formData.get('alt') ?? '').trim().slice(0, 200);
  const name = sanitiseFileName(file.name || `upload.${sniffed.split('/')[1]}`);

  try {
    const key = `uploads/${randomKey()}-${name}`;
    const url = await putBytes(key, bytes, sniffed);
    const dimensions = readImageDimensions(bytes, sniffed);

    const db = await getDb();
    const inserted = await db
      .insert(media)
      .values({
        url,
        storageKey: key,
        fileName: name,
        mimeType: sniffed,
        byteSize: file.size,
        width: dimensions.width,
        height: dimensions.height,
        alt,
        createdAt: new Date(),
      })
      .returning({ id: media.id });

    await recordAudit({
      action: 'media.upload',
      entityType: 'media',
      entityId: inserted[0]!.id,
      summary: `Uploaded ${name}`,
      metadata: { bytes: file.size, type: sniffed },
    });

    revalidatePath('/admin/media');
    return { ok: true, id: inserted[0]!.id, message: 'Uploaded.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateMediaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await guardPermission('manageMedia');
    const id = String(formData.get('mediaId') ?? '');
    const alt = String(formData.get('alt') ?? '').trim().slice(0, 200);
    if (!id) return fieldError('Missing image.');

    const db = await getDb();
    await db.update(media).set({ alt }).where(eq(media.id, id));
    await recordAudit({
      action: 'media.update',
      entityType: 'media',
      entityId: id,
      summary: 'Updated image alt text',
    });
    revalidatePath('/admin/media');
    return { ok: true, message: 'Saved.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteMediaAction(mediaId: string): Promise<ActionState> {
  try {
    await guardPermission('manageMedia');
    const db = await getDb();
    const rows = await db.select().from(media).where(eq(media.id, mediaId)).limit(1);
    const asset = rows[0];
    if (!asset) return fieldError('That image no longer exists.');

    try {
      await deleteBytes(asset.storageKey);
    } catch (error) {
      console.warn('[media] failed to delete object storage file:', error);
    }

    await db.delete(media).where(eq(media.id, mediaId));
    await recordAudit({
      action: 'media.delete',
      entityType: 'media',
      entityId: mediaId,
      summary: `Deleted ${asset.fileName}`,
    });
    revalidatePath('/admin/media');
    return { ok: true, message: 'Deleted.' };
  } catch (error) {
    return toActionError(error);
  }
}
