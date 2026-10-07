import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

/**
 * bcrypt silently ignores bytes beyond 72. Pre-hash with SHA-256 so long
 * passphrases keep their full entropy and stay within the algorithm's limit.
 */
export function normalizePassword(password: string): string {
  return createHash('sha256').update(password, 'utf8').digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(normalizePassword(password), BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !storedHash.startsWith('$2')) return false;
  try {
    return await bcrypt.compare(normalizePassword(password), storedHash);
  } catch {
    return false;
  }
}

/** Generates a URL-safe random token (used for one-off setup links / ids). */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
