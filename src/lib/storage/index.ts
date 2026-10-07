import 'server-only';

import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Persistent object storage for media.
 *
 * Production deployments use Vercel Blob (set `BLOB_READ_WRITE_TOKEN`).
 * Local development and self-hosted installs fall back to `public/uploads`,
 * which `next serve` reads from disk at request time. The fallback is never
 * used silently on Vercel — an explicit error is raised instead of writing
 * files that would disappear on the next deploy.
 */

export type StorageKind = 'blob' | 'local';

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

export function storageKind(): StorageKind {
  return blobToken() ? 'blob' : 'local';
}

function isVercel(): boolean {
  return process.env.VERCEL === '1' || Boolean(process.env.VERCEL_REGION);
}

export function publicUploadDir(): string {
  return path.join(process.cwd(), 'public', 'uploads');
}

export async function putBytes(key: string, bytes: Uint8Array, contentType: string): Promise<string> {
  const token = blobToken();
  if (token) {
    const { put } = await import('@vercel/blob');
    const result = await put(key, Buffer.from(bytes), {
      access: 'public',
      token,
      contentType,
      allowOverwrite: true,
    });
    return result.url;
  }

  if (isVercel() || process.env.NODE_ENV === 'production') {
    throw new StorageError(
      'BLOB_READ_WRITE_TOKEN is not configured. Media uploads require Vercel Blob in production.',
    );
  }

  const target = path.join(publicUploadDir(), ...key.split('/'));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, bytes);
  return `/uploads/${key}`;
}

export async function deleteBytes(key: string): Promise<void> {
  const token = blobToken();
  if (token) {
    const { del } = await import('@vercel/blob');
    // `del` accepts pathnames as well as full URLs.
    await del(key, { token });
    return;
  }
  const target = path.join(publicUploadDir(), ...key.split('/'));
  const resolved = path.resolve(target);
  if (!resolved.startsWith(path.resolve(publicUploadDir()))) return;
  await fs.rm(resolved, { force: true });
}

/** Turns a stored URL back into the storage key used to write it. */
export function keyFromUrl(url: string): string | null {
  if (url.startsWith('/uploads/')) return url.slice('/uploads/'.length);
  try {
    const parsed = new URL(url);
    return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
  } catch {
    return null;
  }
}
