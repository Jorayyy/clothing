'use server';

import { revalidatePath } from 'next/cache';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { fieldError, guardPermission, toActionError, type ActionState } from '@/lib/auth/action-guard';
import { getDb } from '@/lib/db';
import { navigationItems } from '@/lib/db/schema';

const formSchema = z.object({
  itemId: z.string().trim(),
  menu: z.enum(['header', 'footer', 'mobile']),
  label: z.string().trim().min(1, 'Label is required.').max(60),
  href: z.string().trim().max(300),
  kind: z.enum(['link', 'categories', 'collections']),
  position: z.string().trim(),
  enabled: z.enum(['1', '0']),
  openInNewTab: z.enum(['1', '0']),
});

export async function saveNavigationItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await guardPermission('manageContent');
  } catch (error) {
    return toActionError(error);
  }

  const rawId = formData.get('itemId');
  const id = typeof rawId === 'string' && rawId ? rawId : null;

  const parsed = formSchema.safeParse({
    itemId: rawId ?? '',
    menu: formData.get('menu') ?? 'header',
    label: formData.get('label') ?? '',
    href: formData.get('href') ?? '',
    kind: formData.get('kind') ?? 'link',
    position: formData.get('position') ?? '0',
    enabled: formData.get('enabled') === '0' ? '0' : '1',
    openInNewTab: formData.get('openInNewTab') === '1' ? '1' : '0',
  });
  if (!parsed.success) {
    return fieldError(parsed.error.issues[0]?.message ?? 'Please check the form.');
  }

  const data = parsed.data;
  if (data.kind === 'link' && !data.href) return fieldError('A link needs a destination.');

  const values = {
    menu: data.menu,
    label: data.label,
    href: data.href,
    kind: data.kind,
    position: Math.max(0, Math.trunc(Number(data.position) || 0)),
    enabled: data.enabled === '1',
    openInNewTab: data.openInNewTab === '1',
    updatedAt: new Date(),
  };

  try {
    const db = await getDb();
    let savedId = id;
    if (savedId) {
      await db.update(navigationItems).set(values).where(eq(navigationItems.id, savedId));
    } else {
      const inserted = await db
        .insert(navigationItems)
        .values({ ...values, createdAt: new Date() })
        .returning({ id: navigationItems.id });
      savedId = inserted[0]!.id;
    }

    await recordAudit({
      action: id ? 'navigation.update' : 'navigation.create',
      entityType: 'navigation',
      entityId: savedId!,
      summary: `${id ? 'Updated' : 'Created'} ${data.menu} item ${data.label}`,
    });

    revalidatePath('/');
    revalidatePath('/admin/navigation');
    return { ok: true, id: savedId!, message: 'Menu item saved.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteNavigationItemAction(itemId: string): Promise<ActionState> {
  try {
    await guardPermission('manageContent');
    const db = await getDb();
    await db.delete(navigationItems).where(eq(navigationItems.id, itemId));
    await recordAudit({
      action: 'navigation.delete',
      entityType: 'navigation',
      entityId: itemId,
      summary: 'Deleted menu item',
    });
    revalidatePath('/');
    revalidatePath('/admin/navigation');
    return { ok: true, message: 'Menu item deleted.' };
  } catch (error) {
    return toActionError(error);
  }
}

/** Swap an item with its neighbour so ordering can be nudged from the list. */
export async function moveNavigationItemAction(
  itemId: string,
  direction: 'up' | 'down',
): Promise<ActionState> {
  try {
    await guardPermission('manageContent');
    const db = await getDb();
    const rows = await db
      .select()
      .from(navigationItems)
      .orderBy(asc(navigationItems.menu), asc(navigationItems.position));

    const index = rows.findIndex((row) => row.id === itemId);
    if (index < 0) return fieldError('That menu item no longer exists.');
    const current = rows[index]!;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const target = rows[targetIndex];
    if (!target || target.menu !== current.menu) return { ok: true, message: 'Nothing to move.' };

    await db
      .update(navigationItems)
      .set({ position: target.position, updatedAt: new Date() })
      .where(eq(navigationItems.id, current.id));
    await db
      .update(navigationItems)
      .set({ position: current.position, updatedAt: new Date() })
      .where(eq(navigationItems.id, target.id));

    revalidatePath('/');
    revalidatePath('/admin/navigation');
    return { ok: true, message: 'Order updated.' };
  } catch (error) {
    return toActionError(error);
  }
}
