'use server';

import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { fieldError, guardPermission, toActionError, type ActionState } from '@/lib/auth/action-guard';
import { getDb } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { slugify } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(80),
  slug: z.string().trim().max(80),
  description: z.string().trim().max(400),
  status: z.enum(['draft', 'published']),
  position: z.string().trim(),
  imageId: z.string().trim(),
  seoTitle: z.string().trim().max(160),
  seoDescription: z.string().trim().max(300),
});

export async function saveCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await guardPermission('manageCatalog');
  } catch (error) {
    return toActionError(error);
  }

  const rawId = formData.get('categoryId');
  const id = typeof rawId === 'string' && rawId ? rawId : null;

  const parsed = formSchema.safeParse({
    name: formData.get('name') ?? '',
    slug: formData.get('slug') ?? '',
    description: formData.get('description') ?? '',
    status: formData.get('status') ?? 'draft',
    position: formData.get('position') ?? '0',
    imageId: formData.get('imageId') ?? '',
    seoTitle: formData.get('seoTitle') ?? '',
    seoDescription: formData.get('seoDescription') ?? '',
  });
  if (!parsed.success) {
    return fieldError(parsed.error.issues[0]?.message ?? 'Please check the form.');
  }

  const data = parsed.data;
  const slug = (data.slug ? data.slug : slugify(data.name)).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return fieldError('URL handle must be lowercase letters, numbers and hyphens.');
  }

  try {
    const db = await getDb();
    const clash = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        id
          ? sql`${categories.slug} = ${slug} AND ${categories.id} <> ${id}`
          : sql`${categories.slug} = ${slug}`,
      )
      .limit(1);
    if (clash.length > 0) return fieldError('That URL is already in use.');

    const values = {
      slug,
      name: data.name,
      description: data.description,
      status: data.status,
      position: Math.max(0, Math.trunc(Number(data.position) || 0)),
      imageId: data.imageId || null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      updatedAt: new Date(),
    };

    let savedId = id;
    if (savedId) {
      await db.update(categories).set(values).where(eq(categories.id, savedId));
    } else {
      const inserted = await db
        .insert(categories)
        .values({ ...values, createdAt: new Date() })
        .returning({ id: categories.id });
      savedId = inserted[0]!.id;
    }

    await recordAudit({
      action: id ? 'category.update' : 'category.create',
      entityType: 'category',
      entityId: savedId!,
      summary: `${id ? 'Updated' : 'Created'} category ${data.name}`,
    });

    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/admin/categories');
    return { ok: true, id: savedId!, message: 'Category saved.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionState> {
  try {
    await guardPermission('manageCatalog');
    const db = await getDb();
    const rows = await db
      .select({ name: categories.name })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);
    if (rows.length === 0) return fieldError('That category no longer exists.');

    await db.delete(categories).where(eq(categories.id, categoryId));
    await recordAudit({
      action: 'category.delete',
      entityType: 'category',
      entityId: categoryId,
      summary: `Deleted category ${rows[0]!.name}`,
    });
    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/admin/categories');
    return { ok: true, message: 'Category deleted.' };
  } catch (error) {
    return toActionError(error);
  }
}
