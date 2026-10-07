'use server';

import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { fieldError, guardPermission, toActionError, type ActionState } from '@/lib/auth/action-guard';
import { getDb } from '@/lib/db';
import { pages } from '@/lib/db/schema';
import { RESERVED_PAGE_SLUGS } from '@/lib/queries/content';
import { slugify } from '@/lib/utils';

const blockSchema = z.union([
  z.object({
    type: z.literal('heading'),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    text: z.string().max(300),
  }),
  z.object({ type: z.literal('paragraph'), text: z.string().max(6000) }),
  z.object({ type: z.literal('list'), items: z.array(z.string().max(300)).max(60) }),
  z.object({
    type: z.literal('image'),
    mediaId: z.string().max(60),
    alt: z.string().max(200).optional(),
    caption: z.string().max(300).optional(),
  }),
  z.object({ type: z.literal('divider') }),
  z.object({ type: z.literal('callout'), title: z.string().max(200), text: z.string().max(2000) }),
  z.object({
    type: z.literal('faq'),
    items: z
      .array(z.object({ question: z.string().max(300), answer: z.string().max(2000) }))
      .max(40),
  }),
  z.object({ type: z.literal('cta'), label: z.string().max(80), href: z.string().max(300) }),
]);

const contentSchema = z.array(blockSchema).max(80);

const formSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(160),
  slug: z.string().trim().max(120),
  status: z.enum(['draft', 'published']),
  showInFooter: z.enum(['1', '0']),
  seoTitle: z.string().trim().max(160),
  seoDescription: z.string().trim().max(300),
});

export async function savePageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardPermission('manageContent');
  } catch (error) {
    return toActionError(error);
  }

  const rawId = formData.get('pageId');
  const id = typeof rawId === 'string' && rawId ? rawId : null;

  const parsed = formSchema.safeParse({
    title: formData.get('title') ?? '',
    slug: formData.get('slug') ?? '',
    status: formData.get('status') ?? 'draft',
    showInFooter: formData.get('showInFooter') === '1' ? '1' : '0',
    seoTitle: formData.get('seoTitle') ?? '',
    seoDescription: formData.get('seoDescription') ?? '',
  });
  if (!parsed.success) {
    return fieldError(parsed.error.issues[0]?.message ?? 'Please check the form.');
  }

  const rawContent = formData.get('content');
  let content: z.infer<typeof contentSchema> = [];
  if (typeof rawContent === 'string' && rawContent.trim()) {
    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(rawContent);
    } catch {
      return fieldError('Page content could not be read.');
    }
    const contentResult = contentSchema.safeParse(parsedContent);
    if (!contentResult.success) return fieldError('Page content is not valid.');
    content = contentResult.data;
  }

  const data = parsed.data;
  const slug = (data.slug ? data.slug : slugify(data.title)).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return fieldError('URL handle must be lowercase letters, numbers and hyphens.');
  }
  if (RESERVED_PAGE_SLUGS.includes(slug as never)) {
    return fieldError(`"${slug}" is reserved by a built-in page. Pick another handle.`);
  }

  try {
    const db = await getDb();
    const clash = await db
      .select({ id: pages.id })
      .from(pages)
      .where(
        id ? sql`${pages.slug} = ${slug} AND ${pages.id} <> ${id}` : sql`${pages.slug} = ${slug}`,
      )
      .limit(1);
    if (clash.length > 0) return fieldError('That URL is already in use.');

    const values = {
      slug,
      title: data.title,
      content,
      status: data.status,
      showInFooter: data.showInFooter === '1',
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      publishedAt: data.status === 'published' ? new Date() : null,
      updatedAt: new Date(),
    };

    let savedId = id;
    if (savedId) {
      await db.update(pages).set(values).where(eq(pages.id, savedId));
    } else {
      const inserted = await db
        .insert(pages)
        .values({ ...values, createdAt: new Date() })
        .returning({ id: pages.id });
      savedId = inserted[0]!.id;
    }

    await recordAudit({
      action: id ? 'page.update' : 'page.create',
      entityType: 'page',
      entityId: savedId!,
      summary: `${id ? 'Updated' : 'Created'} page ${data.title}`,
      metadata: { blocks: content.length },
    });

    revalidatePath('/');
    revalidatePath('/admin/pages');
    return { ok: true, id: savedId!, message: 'Page saved.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deletePageAction(pageId: string): Promise<ActionState> {
  try {
    await guardPermission('manageContent');
    const db = await getDb();
    const rows = await db.select({ title: pages.title }).from(pages).where(eq(pages.id, pageId)).limit(1);
    if (rows.length === 0) return fieldError('That page no longer exists.');

    await db.delete(pages).where(eq(pages.id, pageId));
    await recordAudit({
      action: 'page.delete',
      entityType: 'page',
      entityId: pageId,
      summary: `Deleted page ${rows[0]!.title}`,
    });
    revalidatePath('/');
    revalidatePath('/admin/pages');
    return { ok: true, message: 'Page deleted.' };
  } catch (error) {
    return toActionError(error);
  }
}
