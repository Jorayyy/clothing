'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { recordAudit } from '@/lib/audit';
import { fieldError, guardPermission, toActionError, type ActionState } from '@/lib/auth/action-guard';
import { getDb } from '@/lib/db';
import { inquiries } from '@/lib/db/schema';

const STATUSES = ['new', 'open', 'resolved', 'spam'] as const;

export async function setInquiryStatusAction(
  inquiryId: string,
  status: string,
): Promise<ActionState> {
  try {
    await guardPermission('manageContent');
    if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
      return fieldError('Unknown status.');
    }
    const db = await getDb();
    await db
      .update(inquiries)
      .set({ status: status as (typeof STATUSES)[number] })
      .where(eq(inquiries.id, inquiryId));
    await recordAudit({
      action: 'inquiry.status',
      entityType: 'inquiry',
      entityId: inquiryId,
      summary: `Marked inquiry as ${status}`,
    });
    revalidatePath('/admin/inquiries');
    return { ok: true, message: 'Status updated.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteInquiryAction(inquiryId: string): Promise<ActionState> {
  try {
    await guardPermission('manageContent');
    const db = await getDb();
    await db.delete(inquiries).where(eq(inquiries.id, inquiryId));
    await recordAudit({
      action: 'inquiry.delete',
      entityType: 'inquiry',
      entityId: inquiryId,
      summary: 'Deleted an inquiry',
    });
    revalidatePath('/admin/inquiries');
    return { ok: true, message: 'Inquiry deleted.' };
  } catch (error) {
    return toActionError(error);
  }
}
