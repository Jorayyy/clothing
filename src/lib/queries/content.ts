import 'server-only';

import { asc, sql } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import {
  homeSections,
  navigationItems,
  pages,
  type HomeSection,
  type NavigationItem,
  type PageRecord,
} from '@/lib/db/schema';
import { parseSectionConfig } from '@/lib/home-sections';

import { getPublicCategories, getPublicCollections } from './catalog';

export interface ResolvedSection {
  id: string;
  type: string;
  title: string;
  enabled: boolean;
  position: number;
  config: Record<string, unknown>;
}

export interface ResolvedNavGroup {
  id: string;
  label: string;
  href: string;
  openInNewTab: boolean;
  children?: { label: string; href: string }[];
}

export async function getHomeSections(options: { includeDisabled?: boolean } = {}): Promise<ResolvedSection[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(homeSections)
    .where(options.includeDisabled ? undefined : sql`${homeSections.enabled} = true`)
    .orderBy(asc(homeSections.position), asc(homeSections.createdAt));

  return rows.map((row: HomeSection) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    enabled: row.enabled,
    position: row.position,
    config: parseSectionConfig(row.type, row.config),
  }));
}

const DEFAULT_NAV: { label: string; href: string; kind?: string }[] = [
  { label: 'Shop All', href: '/shop' },
  { label: 'Clothing', href: '/shop', kind: 'categories' },
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Best Sellers', href: '/best-sellers' },
  { label: 'Collections', href: '/collections', kind: 'collections' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export async function getNavigation(menu: 'header' | 'footer' | 'mobile'): Promise<ResolvedNavGroup[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(navigationItems)
    .where(sql`${navigationItems.menu} = ${menu} AND ${navigationItems.enabled} = true`)
    .orderBy(asc(navigationItems.position), asc(navigationItems.createdAt));

  const source: NavigationItem[] = rows.length
    ? rows
    : DEFAULT_NAV.map((item, index) => ({
        id: `default-${index}`,
        menu,
        label: item.label,
        href: item.href,
        kind: item.kind ?? 'link',
        position: index,
        enabled: true,
        openInNewTab: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

  const groups: ResolvedNavGroup[] = [];
  for (const item of source) {
    if (item.kind === 'categories') {
      const categories = await getPublicCategories();
      if (categories.length === 0) continue;
      groups.push({
        id: item.id,
        label: item.label,
        href: item.href || '/shop',
        openInNewTab: false,
        children: categories.map((category) => ({
          label: category.name,
          href: `/shop?category=${category.slug}`,
        })),
      });
      continue;
    }
    if (item.kind === 'collections') {
      const collections = await getPublicCollections();
      if (collections.length === 0) continue;
      groups.push({
        id: item.id,
        label: item.label,
        href: item.href || '/collections',
        openInNewTab: false,
        children: collections.map((collection) => ({
          label: collection.name,
          href: `/collections/${collection.slug}`,
        })),
      });
      continue;
    }
    groups.push({
      id: item.id,
      label: item.label,
      href: item.href,
      openInNewTab: item.openInNewTab,
    });
  }
  return groups;
}

export async function getAllNavigationItems(): Promise<NavigationItem[]> {
  const db = await getDb();
  return db
    .select()
    .from(navigationItems)
    .orderBy(asc(navigationItems.menu), asc(navigationItems.position));
}

export const RESERVED_PAGE_SLUGS = [
  'about',
  'contact',
  'faq',
  'shipping',
  'returns',
  'privacy',
  'terms',
  'ordering',
] as const;

export type ReservedPageSlug = (typeof RESERVED_PAGE_SLUGS)[number];

export interface ResolvedPage {
  id: string;
  slug: string;
  title: string;
  content: PageRecord['content'];
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  showInFooter: boolean;
  updatedAt: string;
}

function toResolved(row: PageRecord): ResolvedPage {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content ?? [],
    status: row.status,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    showInFooter: row.showInFooter,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getPageBySlug(
  slug: string,
  options: { includeDraft?: boolean } = {},
): Promise<ResolvedPage | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(pages)
    .where(
      options.includeDraft
        ? sql`${pages.slug} = ${slug}`
        : sql`${pages.slug} = ${slug} AND ${pages.status} = 'published'`,
    )
    .limit(1);
  return rows[0] ? toResolved(rows[0]) : null;
}

export async function listPages(options: { includeDrafts?: boolean } = {}): Promise<ResolvedPage[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(pages)
    .where(
      options.includeDrafts
        ? undefined
        : sql`${pages.status} = 'published'`,
    )
    .orderBy(asc(pages.title));
  return rows.map(toResolved);
}

export async function listFooterPages(): Promise<ResolvedPage[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(pages)
    .where(sql`${pages.status} = 'published' AND ${pages.showInFooter} = true`)
    .orderBy(asc(pages.title));
  return rows.map(toResolved);
}

/* ------------------------------------------------------------------ */
/* Newsletter + inquiries                                              */
/* ------------------------------------------------------------------ */

export async function subscribeNewsletter(email: string, source = 'site'): Promise<{ ok: boolean; message: string }> {
  const normalised = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(normalised)) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }
  try {
    const db = await getDb();
    const { newsletterSubscribers } = await import('@/lib/db/schema');
    await db
      .insert(newsletterSubscribers)
      .values({ email: normalised, source })
      .onConflictDoNothing();
    return { ok: true, message: 'You are on the list — thank you!' };
  } catch (error) {
    console.error('[newsletter] subscribe failed:', error);
    return { ok: false, message: 'Something went wrong. Please try again.' };
  }
}

export async function recordInquiry(input: {
  productId?: string | null;
  productName?: string | null;
  variantSummary?: string | null;
  name?: string | null;
  email?: string | null;
  message?: string | null;
  channel: string;
  source?: string;
  referrerPath?: string | null;
}): Promise<void> {
  try {
    const db = await getDb();
    const { inquiries } = await import('@/lib/db/schema');
    await db.insert(inquiries).values({
      productId: input.productId ?? null,
      productName: input.productName ?? null,
      variantSummary: input.variantSummary ?? null,
      name: input.name ?? null,
      email: input.email ?? null,
      message: input.message ?? null,
      channel: input.channel,
      source: input.source ?? 'product',
      referrerPath: input.referrerPath ?? null,
    });
  } catch (error) {
    console.error('[inquiry] failed to record:', error);
  }
}
