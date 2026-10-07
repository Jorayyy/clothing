'use server';

import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { fieldError, guardPermission, toActionError, type ActionState } from '@/lib/auth/action-guard';
import { getSession } from '@/lib/auth/guard';
import { hashPassword } from '@/lib/auth/password';
import { getDb } from '@/lib/db';
import { adminUsers } from '@/lib/db/schema';

const emailField = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .max(200)
  .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'Enter a valid email.');

const createSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(80),
  email: emailField,
  role: z.enum(['owner', 'admin', 'editor', 'viewer']),
  status: z.enum(['active', 'suspended']),
  password: z.string().min(10, 'Use at least 10 characters.').max(200),
});

const updateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(80),
  email: emailField,
  role: z.enum(['owner', 'admin', 'editor', 'viewer']),
  status: z.enum(['active', 'suspended']),
  password: z.string().max(200),
});

async function countOwners(excludeId?: string): Promise<number> {
  const db = await getDb();
  const rows = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(adminUsers)
    .where(
      excludeId
        ? sql`${adminUsers.role} = 'owner' AND ${adminUsers.status} = 'active' AND ${adminUsers.id} <> ${excludeId}`
        : sql`${adminUsers.role} = 'owner' AND ${adminUsers.status} = 'active'`,
    );
  return Number(rows[0]?.value ?? 0);
}

export async function saveUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardPermission('manageUsers');
  } catch (error) {
    return toActionError(error);
  }

  const rawId = formData.get('userId');
  const id = typeof rawId === 'string' && rawId ? rawId : null;

  const common = {
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
    status: formData.get('status'),
    password: formData.get('password') ?? '',
  };

  const parsed = (id ? updateSchema : createSchema).safeParse(common);
  if (!parsed.success) return fieldError(parsed.error.issues[0]?.message ?? 'Check the form.');
  const data = parsed.data;

  const email = data.email.toLowerCase();
  const session = await getSession();
  if (id && session?.user.id === id && (data.status === 'suspended' || data.role !== 'owner')) {
    return fieldError('You cannot remove your own owner access.');
  }

  try {
    const db = await getDb();
    const clash = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(
        id
          ? sql`lower(${adminUsers.email}) = ${email} AND ${adminUsers.id} <> ${id}`
          : sql`lower(${adminUsers.email}) = ${email}`,
      )
      .limit(1);
    if (clash.length > 0) return fieldError('That email is already registered.');

    const current = id
      ? await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1)
      : [];
    const target = current[0];

    if (
      id &&
      target &&
      target.role === 'owner' &&
      (data.role !== 'owner' || data.status !== 'active') &&
      (await countOwners(id)) === 0
    ) {
      return fieldError('There must always be at least one active owner.');
    }

    const passwordHash = data.password ? await hashPassword(data.password) : undefined;

    if (id) {
      await db
        .update(adminUsers)
        .set({
          name: data.name,
          email,
          role: data.role,
          status: data.status,
          ...(passwordHash ? { passwordHash, tokenVersion: (target?.tokenVersion ?? 0) + 1 } : {}),
          updatedAt: new Date(),
        })
        .where(eq(adminUsers.id, id));
    } else {
      if (!passwordHash) return fieldError('Set a password for the new user.');
      await db.insert(adminUsers).values({
        name: data.name,
        email,
        role: data.role,
        status: data.status,
        passwordHash,
        tokenVersion: 0,
      });
    }

    await recordAudit({
      action: id ? 'user.update' : 'user.create',
      entityType: 'adminUser',
      entityId: id ?? '',
      summary: `${id ? 'Updated' : 'Created'} admin ${email}`,
      metadata: { role: data.role, status: data.status },
    });

    revalidatePath('/admin/users');
    return { ok: true, id: id ?? undefined, message: 'User saved.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteUserAction(userId: string): Promise<ActionState> {
  try {
    await guardPermission('manageUsers');
    const session = await getSession();
    if (session?.user.id === userId) return fieldError('You cannot delete your own account.');

    const db = await getDb();
    const rows = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, userId))
      .limit(1);
    const target = rows[0];
    if (!target) return fieldError('That user no longer exists.');
    if (target.role === 'owner' && (await countOwners(userId)) === 0) {
      return fieldError('There must always be at least one active owner.');
    }

    await db.delete(adminUsers).where(eq(adminUsers.id, userId));
    await recordAudit({
      action: 'user.delete',
      entityType: 'adminUser',
      entityId: userId,
      summary: `Deleted admin ${target.email}`,
    });
    revalidatePath('/admin/users');
    return { ok: true, message: 'User deleted.' };
  } catch (error) {
    return toActionError(error);
  }
}
