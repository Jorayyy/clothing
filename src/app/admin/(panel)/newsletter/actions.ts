'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { recordAudit } from '@/lib/audit';
import { fieldError, guardPermission, toActionError, type ActionState } from '@/lib/auth/action-guard';
import { getDb } from '@/lib/db';
import { newsletterSubscribers } from '@/lib/db/schema';

export async function deleteSubscriberAction(subscriberId: string): Promise<ActionState> {
  try {
    await guardPermission('manageSettings');
    const db = await getDb();
    const rows = await db
      .select({ email: newsletterSubscribers.email })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.id, subscriberId))
      .limit(1);
    if (rows.length === 0) return fieldError('That subscriber no longer exists.');

    await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, subscriberId));
    await recordAudit({
      action: 'newsletter.delete',
      entityType: 'newsletter',
      entityId: subscriberId,
      summary: `Removed subscriber ${rows[0]!.email}`,
    });
    revalidatePath('/admin/newsletter');
    return { ok: true, message: 'Subscriber removed.' };
  } catch (error) {
    return toActionError(error);
  }
}
