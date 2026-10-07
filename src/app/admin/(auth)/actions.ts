'use server';

import { eq, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { verifyPassword } from '@/lib/auth/password';
import { clearSessionCookie, setSessionCookie } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { adminUsers } from '@/lib/db/schema';
import { consumeRateLimit, getClientIp } from '@/lib/security/rate-limit';

export interface LoginState {
  error?: string;
}

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email.').max(200),
  password: z.string().min(1, 'Enter your password.').max(200),
});

export async function signInAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const ip = await getClientIp();
  const limit = await consumeRateLimit(`login:${ip}`, 8, 900);
  if (!limit.ok) {
    return { error: 'Too many attempts. Please wait a few minutes and try again.' };
  }

  const email = parsed.data.email.toLowerCase();
  const db = await getDb();
  const rows = await db
    .select()
    .from(adminUsers)
    .where(sql`lower(${adminUsers.email}) = ${email}`)
    .limit(1);
  const user = rows[0];

  const valid =
    Boolean(user) &&
    user!.status === 'active' &&
    (await verifyPassword(parsed.data.password, user!.passwordHash));

  if (!valid || !user) {
    await recordAudit({
      action: 'auth.login_failed',
      summary: `Failed sign-in attempt for ${email}`,
      ip,
    });
    return { error: 'Email or password is incorrect.' };
  }

  await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(adminUsers.id, user.id));

  await recordAudit({
    actorId: user.id,
    actorLabel: user.email,
    action: 'auth.login',
    summary: 'Signed in',
    ip,
  });

  await setSessionCookie(user.id, user.tokenVersion);
  redirect('/admin');
}

export async function signOutAction(): Promise<void> {
  await clearSessionCookie();
  redirect('/admin/login');
}
