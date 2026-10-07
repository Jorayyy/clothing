import 'server-only';

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'mics_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  /** admin user id */
  uid: string;
  /** token version, lets us revoke every outstanding session */
  tv: number;
  /** expiry, unix seconds */
  exp: number;
  /** session id, used to target revocation */
  sid: string;
}

function secretKey(): Buffer {
  const raw = process.env.SESSION_SECRET;
  if (raw && raw.length >= 32) return Buffer.from(raw, 'utf8');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set to at least 32 characters in production.');
  }
  return Buffer.from('dev-only-insecure-session-secret-change-me');
}

function sign(data: string): string {
  return createHmac('sha256', secretKey()).update(data).digest('base64url');
}

export function createSessionToken(userId: string, tokenVersion: number): string {
  const payload: SessionPayload = {
    uid: userId,
    tv: tokenVersion,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    sid: randomBytes(9).toString('base64url'),
  };
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${body}.${sign(body)}`;
}

/** Verifies the signature + expiry of a session token. Returns null when invalid. */
export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;
  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (
      typeof payload.uid !== 'string' ||
      typeof payload.tv !== 'number' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string, tokenVersion: number): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(userId, tokenVersion), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function readSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}
