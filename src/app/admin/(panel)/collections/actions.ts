'use server';

import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { fieldError, guardPermission, toActionError, type ActionState } from '@/lib/auth/action-guard';
import { getDb } from '@/lib/db';
import { collectionProducts, collections } from '@/lib/db/schema';
import { slugify } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(80),
  slug: z.string().trim().max(80),
  description: z.string().trim().max(500),
  status: z.enum(['draft', 'published']),
  selectionMode: z.enum(['manual', 'rules']),
  isFeatured: z.enum(['1', '0']),
  position: z.string().trim(),
  coverImageId: z.string().trim(),
  productIds: z.array(z.string()),
});

function readIds(formData: FormData, key: string): string[] {
  const raw = formData.get(key);
  if (typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export async function saveCollectionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await guardPermission('manageCatalog');
  } catch (error) {
    return toActionError(error);
  }

  const rawId = formData.get('collectionId');
  const id = typeof rawId === 'string' && rawId ? rawId : null;

  const parsed = formSchema.safeParse({
    name: formData.get('name') ?? '',
    slug: formData.get('slug') ?? '',
    description: formData.get('description') ?? '',
    status: formData.get('status') ?? 'draft',
    selectionMode: formData.get('selectionMode') ?? 'manual',
    isFeatured: formData.get('isFeatured') === '1' ? '1' : '0',
    position: formData.get('position') ?? '0',
    coverImageId: formData.get('coverImageId') ?? '',
    productIds: readIds(formData, 'productIds'),
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
      .select({ id: collections.id })
      .from(collections)
      .where(
        id
          ? sql`${collections.slug} = ${slug} AND ${collections.id} <> ${id}`
          : sql`${collections.slug} = ${slug}`,
      )
      .limit(1);
    if (clash.length > 0) return fieldError('That URL is already in use.');

    const values = {
      slug,
      name: data.name,
      description: data.description,
      status: data.status,
      selectionMode: data.selectionMode,
      isFeatured: data.isFeatured === '1',
      position: Math.max(0, Math.trunc(Number(data.position) || 0)),
      coverImageId: data.coverImageId || null,
      updatedAt: new Date(),
    };

    let savedId = id;
    if (savedId) {
      await db.update(collections).set(values).where(eq(collections.id, savedId));
    } else {
      const inserted = await db
        .insert(collections)
        .values({ ...values, createdAt: new Date() })
        .returning({ id: collections.id });
      savedId = inserted[0]!.id;
    }

    if (data.selectionMode === 'manual') {
      await db.delete(collectionProducts).where(eq(collectionProducts.collectionId, savedId!));
      if (data.productIds.length > 0) {
        await db.insert(collectionProducts).values(
          data.productIds.map((productId, position) => ({
            collectionId: savedId!,
            productId,
            position,
          })),
        );
      }
    }

    await recordAudit({
      action: id ? 'collection.update' : 'collection.create',
      entityType: 'collection',
      entityId: savedId!,
      summary: `${id ? 'Updated' : 'Created'} collection ${data.name}`,
      metadata: { products: data.productIds.length },
    });

    revalidatePath('/');
    revalidatePath('/collections');
    revalidatePath('/admin/collections');
    return { ok: true, id: savedId!, message: 'Collection saved.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteCollectionAction(collectionId: string): Promise<ActionState> {
  try {
    await guardPermission('manageCatalog');
    const db = await getDb();
    const rows = await db
      .select({ name: collections.name })
      .from(collections)
      .where(eq(collections.id, collectionId))
      .limit(1);
    if (rows.length === 0) return fieldError('That collection no longer exists.');

    await db.delete(collections).where(eq(collections.id, collectionId));
    await recordAudit({
      action: 'collection.delete',
      entityType: 'collection',
      entityId: collectionId,
      summary: `Deleted collection ${rows[0]!.name}`,
    });
    revalidatePath('/');
    revalidatePath('/collections');
    revalidatePath('/admin/collections');
    return { ok: true, message: 'Collection deleted.' };
  } catch (error) {
    return toActionError(error);
  }
}
