'use server';

import { revalidatePath } from 'next/cache';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { fieldError, guardPermission, toActionError, type ActionState } from '@/lib/auth/action-guard';
import { getDb } from '@/lib/db';
import { homeSections } from '@/lib/db/schema';
import { assertValidSectionConfig, SECTION_TYPE_VALUES } from '@/lib/home-sections';

import { SECTION_FIELDS, readConfigValue } from './section-fields';

const metaSchema = z.object({
  type: z.string().min(1),
  title: z.string().max(120),
  enabled: z.enum(['1', '0']),
  position: z.string(),
});

export async function saveSectionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await guardPermission('manageTheme');
  } catch (error) {
    return toActionError(error);
  }

  const rawId = formData.get('sectionId');
  const id = typeof rawId === 'string' && rawId ? rawId : null;

  const parsed = metaSchema.safeParse({
    type: formData.get('type') ?? '',
    title: formData.get('title') ?? '',
    enabled: formData.get('enabled') === '0' ? '0' : '1',
    position: formData.get('position') ?? '0',
  });
  if (!parsed.success) return fieldError('Please check the section settings.');

  const data = parsed.data;
  if (!SECTION_TYPE_VALUES.includes(data.type as never)) {
    return fieldError('Unknown section type.');
  }

  const fields = SECTION_FIELDS[data.type] ?? [];
  const config: Record<string, unknown> = {};
  for (const spec of fields) {
    config[spec.key] = readConfigValue(spec, formData.get(spec.key));
  }

  try {
    assertValidSectionConfig(data.type, config);
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues[0]?.message ?? 'Some values are not valid.'
      : 'Some values are not valid.';
    return fieldError(message);
  }

  try {
    const db = await getDb();
    const values = {
      type: data.type,
      title: data.title,
      enabled: data.enabled === '1',
      position: Math.max(0, Math.trunc(Number(data.position) || 0)),
      config,
      updatedAt: new Date(),
    };

    let savedId = id;
    if (savedId) {
      await db.update(homeSections).set(values).where(eq(homeSections.id, savedId));
    } else {
      const inserted = await db
        .insert(homeSections)
        .values({ ...values, createdAt: new Date() })
        .returning({ id: homeSections.id });
      savedId = inserted[0]!.id;
    }

    await recordAudit({
      action: id ? 'section.update' : 'section.create',
      entityType: 'homeSection',
      entityId: savedId!,
      summary: `${id ? 'Updated' : 'Added'} homepage section ${data.title || data.type}`,
    });

    revalidatePath('/');
    revalidatePath('/admin/homepage');
    return { ok: true, id: savedId!, message: 'Section saved.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteSectionAction(sectionId: string): Promise<ActionState> {
  try {
    await guardPermission('manageTheme');
    const db = await getDb();
    await db.delete(homeSections).where(eq(homeSections.id, sectionId));
    await recordAudit({
      action: 'section.delete',
      entityType: 'homeSection',
      entityId: sectionId,
      summary: 'Removed a homepage section',
    });
    revalidatePath('/');
    revalidatePath('/admin/homepage');
    return { ok: true, message: 'Section removed.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function moveSectionAction(
  sectionId: string,
  direction: 'up' | 'down',
): Promise<ActionState> {
  try {
    await guardPermission('manageTheme');
    const db = await getDb();
    const rows = await db.select().from(homeSections).orderBy(asc(homeSections.position), asc(homeSections.createdAt));
    const index = rows.findIndex((row) => row.id === sectionId);
    if (index < 0) return fieldError('That section no longer exists.');

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const current = rows[index]!;
    const target = rows[targetIndex];
    if (!target) return { ok: true, message: 'Nothing to move.' };

    await db
      .update(homeSections)
      .set({ position: target.position, updatedAt: new Date() })
      .where(eq(homeSections.id, current.id));
    await db
      .update(homeSections)
      .set({ position: current.position, updatedAt: new Date() })
      .where(eq(homeSections.id, target.id));

    revalidatePath('/');
    revalidatePath('/admin/homepage');
    return { ok: true, message: 'Order updated.' };
  } catch (error) {
    return toActionError(error);
  }
}
