'use server';

import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { buildVariantCombos, variantSignature, type AttributeInput } from '@/lib/admin/variants';
import { fieldError, guardPermission, toActionError, type ActionState } from '@/lib/auth/action-guard';
import { getDb } from '@/lib/db';
import {
  productAttributes,
  productCategories,
  productImages,
  products,
  productVariants,
} from '@/lib/db/schema';
import { parsePesoToCentavos } from '@/lib/format';
import { slugify } from '@/lib/utils';

const attributesSchema = z.array(
  z.object({
    key: z.string().min(1),
    name: z.string().min(1),
    values: z.array(z.string().min(1)).max(40),
  }),
);

const formSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(160),
  slug: z.string().trim().max(160),
  summary: z.string().trim().max(300),
  description: z.string().max(6000),
  status: z.enum(['draft', 'published', 'archived']),
  price: z.string().trim(),
  salePrice: z.string().trim(),
  compareAtPrice: z.string().trim(),
  label: z.string().trim().max(80),
  sku: z.string().trim().max(80),
  trackStock: z.enum(['1', '0']),
  stockQuantity: z.string().trim(),
  material: z.string().trim().max(200),
  fit: z.string().trim().max(200),
  measurements: z.string().trim().max(2000),
  care: z.string().trim().max(2000),
  videoUrl: z.string().trim().max(500),
  seoTitle: z.string().trim().max(160),
  seoDescription: z.string().trim().max(300),
  featured: z.enum(['1', '0']),
  isNewArrival: z.enum(['1', '0']),
  isBestSeller: z.enum(['1', '0']),
  attributes: attributesSchema,
  imageIds: z.array(z.string()),
  categoryIds: z.array(z.string()),
});

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only.');

function readCheckbox(formData: FormData, key: string): '1' | '0' {
  return formData.get(key) === '1' ? '1' : '0';
}

function readAttributes(formData: FormData): z.infer<typeof attributesSchema> {
  const raw = formData.get('attributes');
  if (typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return attributesSchema.parse(parsed);
  } catch {
    return [];
  }
}

function readStringArray(formData: FormData, key: string): string[] {
  const raw = formData.get(key);
  if (typeof raw !== 'string' || raw.trim() === '') return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

function optionalPrice(value: string): number | null {
  if (!value.trim()) return null;
  const centavos = parsePesoToCentavos(value);
  return centavos !== null && centavos >= 0 ? centavos : null;
}

async function assertSlugAvailable(slug: string, excludeId: string | null): Promise<string | null> {
  const db = await getDb();
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(
      excludeId
        ? sql`${products.slug} = ${slug} AND ${products.id} <> ${excludeId}`
        : sql`${products.slug} = ${slug}`,
    )
    .limit(1);
  return rows.length > 0 ? 'That URL is already used by another product.' : null;
}

async function replaceProductRelations(
  productId: string,
  input: {
    attributes: AttributeInput[];
    imageIds: string[];
    categoryIds: string[];
  },
): Promise<void> {
  const db = await getDb();

  await db.delete(productAttributes).where(eq(productAttributes.productId, productId));
  if (input.attributes.length > 0) {
    await db.insert(productAttributes).values(
      input.attributes.map((attribute, index) => ({
        productId,
        key: attribute.key.toLowerCase(),
        name: attribute.name,
        values: attribute.values,
        position: index,
      })),
    );
  }

  const existingVariants = await db
    .select({ id: productVariants.id, options: productVariants.options })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));
  const existingBySignature = new Map(
    existingVariants.map((variant) => [variantSignature(variant.options ?? {}), variant.id]),
  );

  const combos = buildVariantCombos(input.attributes);
  const signatures = new Set(combos.map((combo) => variantSignature(combo.options)));

  for (const variant of existingVariants) {
    if (!signatures.has(variantSignature(variant.options ?? {}))) {
      await db.delete(productVariants).where(eq(productVariants.id, variant.id));
    }
  }

  if (combos.length > 0) {
    for (const [position, combo] of combos.entries()) {
      const signature = variantSignature(combo.options);
      const existingId = existingBySignature.get(signature);
      if (existingId) {
        await db
          .update(productVariants)
          .set({ name: combo.name, position, updatedAt: new Date() })
          .where(eq(productVariants.id, existingId));
      } else {
        await db.insert(productVariants).values({
          productId,
          name: combo.name,
          sku: null,
          price: null,
          options: combo.options,
          trackStock: false,
          stockQuantity: 0,
          position,
        });
      }
    }
  } else {
    await db.delete(productVariants).where(eq(productVariants.productId, productId));
  }

  await db.delete(productCategories).where(eq(productCategories.productId, productId));
  if (input.categoryIds.length > 0) {
    await db.insert(productCategories).values(
      input.categoryIds.map((categoryId) => ({ productId, categoryId })),
    );
  }

  await db.delete(productImages).where(eq(productImages.productId, productId));
  if (input.imageIds.length > 0) {
    await db.insert(productImages).values(
      input.imageIds.map((mediaId, position) => ({
        productId,
        mediaId,
        alt: '',
        position,
      })),
    );
  }
}

export async function saveProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await guardPermission('manageProducts');
  } catch (error) {
    return toActionError(error);
  }

  const productId = formData.get('productId');
  const id = typeof productId === 'string' && productId ? productId : null;

  const parsed = formSchema.safeParse({
    name: formData.get('name') ?? '',
    slug: formData.get('slug') ?? '',
    summary: formData.get('summary') ?? '',
    description: formData.get('description') ?? '',
    status: formData.get('status') ?? 'draft',
    price: formData.get('price') ?? '',
    salePrice: formData.get('salePrice') ?? '',
    compareAtPrice: formData.get('compareAtPrice') ?? '',
    label: formData.get('label') ?? '',
    sku: formData.get('sku') ?? '',
    trackStock: readCheckbox(formData, 'trackStock'),
    stockQuantity: formData.get('stockQuantity') ?? '',
    material: formData.get('material') ?? '',
    fit: formData.get('fit') ?? '',
    measurements: formData.get('measurements') ?? '',
    care: formData.get('care') ?? '',
    videoUrl: formData.get('videoUrl') ?? '',
    seoTitle: formData.get('seoTitle') ?? '',
    seoDescription: formData.get('seoDescription') ?? '',
    featured: readCheckbox(formData, 'featured'),
    isNewArrival: readCheckbox(formData, 'isNewArrival'),
    isBestSeller: readCheckbox(formData, 'isBestSeller'),
    attributes: readAttributes(formData),
    imageIds: readStringArray(formData, 'imageIds'),
    categoryIds: readStringArray(formData, 'categoryIds'),
  });

  if (!parsed.success) {
    return fieldError(parsed.error.issues[0]?.message ?? 'Please check the form and try again.');
  }

  const data = parsed.data;

  const price = optionalPrice(data.price);
  if (price === null || price <= 0) return fieldError('Enter a valid price.');
  const salePrice = optionalPrice(data.salePrice);
  if (data.salePrice.trim() && salePrice === null) return fieldError('Sale price is not a valid amount.');
  if (salePrice !== null && salePrice >= price) {
    return fieldError('Sale price must be lower than the regular price.');
  }
  const compareAtPrice = optionalPrice(data.compareAtPrice);
  if (data.compareAtPrice.trim() && compareAtPrice === null) {
    return fieldError('Compare-at price is not a valid amount.');
  }

  let slug = data.slug ? data.slug.trim().toLowerCase() : slugify(data.name);
  if (data.slug.trim()) {
    const slugCheck = slugSchema.safeParse(slug);
    if (!slugCheck.success) return fieldError('URL handle must be lowercase letters, numbers and hyphens.');
  }
  if (!slug) slug = slugify(data.name);

  try {
    const conflict = await assertSlugAvailable(slug, id);
    if (conflict) return fieldError(conflict);
  } catch (error) {
    return toActionError(error);
  }

  const stockQuantity = Math.max(0, Math.trunc(Number(data.stockQuantity) || 0));
  const on = (value: '1' | '0') => value === '1';

  try {
    const db = await getDb();
    let savedId = id;

    const values = {
      slug,
      name: data.name,
      summary: data.summary,
      description: data.description,
      price,
      salePrice,
      compareAtPrice,
      label: data.label,
      sku: data.sku || null,
      status: data.status,
      featured: on(data.featured),
      isNewArrival: on(data.isNewArrival),
      isBestSeller: on(data.isBestSeller),
      trackStock: on(data.trackStock),
      stockQuantity,
      material: data.material || null,
      fit: data.fit || null,
      measurements: data.measurements || null,
      care: data.care || null,
      videoUrl: data.videoUrl || null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      publishedAt: data.status === 'published' ? new Date() : null,
      updatedAt: new Date(),
    };

    if (savedId) {
      const existing = await db.select({ id: products.id }).from(products).where(eq(products.id, savedId)).limit(1);
      if (existing.length === 0) return fieldError('That product no longer exists.');
      await db.update(products).set(values).where(eq(products.id, savedId));
    } else {
      const inserted = await db.insert(products).values({ ...values, createdAt: new Date() }).returning({ id: products.id });
      savedId = inserted[0]!.id;
    }

    await replaceProductRelations(savedId!, {
      attributes: data.attributes,
      imageIds: data.imageIds,
      categoryIds: data.categoryIds,
    });

    await recordAudit({
      action: id ? 'product.update' : 'product.create',
      entityType: 'product',
      entityId: savedId!,
      summary: `${id ? 'Updated' : 'Created'} product ${data.name}`,
      metadata: { slug, status: data.status },
    });

    revalidatePath('/');
    revalidatePath('/shop');
    return { ok: true, id: savedId!, message: 'Product saved.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteProductAction(productId: string): Promise<ActionState> {
  try {
    await guardPermission('manageProducts');
    const db = await getDb();
    const rows = await db.select({ name: products.name }).from(products).where(eq(products.id, productId)).limit(1);
    if (rows.length === 0) return fieldError('That product no longer exists.');

    await db.delete(products).where(eq(products.id, productId));
    await recordAudit({
      action: 'product.delete',
      entityType: 'product',
      entityId: productId,
      summary: `Deleted product ${rows[0]!.name}`,
    });
    revalidatePath('/');
    revalidatePath('/shop');
    return { ok: true, message: 'Product deleted.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setProductStatusAction(productId: string, status: string): Promise<ActionState> {
  try {
    await guardPermission('manageProducts');
    if (status !== 'draft' && status !== 'published' && status !== 'archived') {
      return fieldError('Unknown status.');
    }
    const db = await getDb();
    await db
      .update(products)
      .set({
        status,
        publishedAt: status === 'published' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));
    await recordAudit({
      action: 'product.status',
      entityType: 'product',
      entityId: productId,
      summary: `Set product status to ${status}`,
    });
    revalidatePath('/');
    return { ok: true, message: 'Status updated.' };
  } catch (error) {
    return toActionError(error);
  }
}
