import 'server-only';

import { desc, sql } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import {
  auditLogs,
  categories,
  collections,
  homeSections,
  inquiries,
  media,
  navigationItems,
  newsletterSubscribers,
  pages,
  products,
} from '@/lib/db/schema';

export interface RecentInquiry {
  id: string;
  name: string | null;
  message: string | null;
  productName: string | null;
  status: string;
  createdAt: Date;
}

export interface RecentAuditEntry {
  id: string;
  actorLabel: string;
  action: string;
  summary: string;
  createdAt: Date;
}

export interface DashboardStats {
  products: { total: number; published: number; drafts: number };
  catalog: { categories: number; collections: number; pages: number; media: number };
  engagement: { newInquiries: number; inquiries: number; subscribers: number };
  presentation: { sections: number; enabledSections: number; navigation: number };
  recentInquiries: RecentInquiry[];
  recentAudit: RecentAuditEntry[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await getDb();

  const [
    productTotal,
    productPublished,
    productDrafts,
    categoryCount,
    collectionCount,
    pageCount,
    mediaCount,
    inquiryNew,
    inquiryTotal,
    subscriberCount,
    sectionTotal,
    sectionEnabled,
    navigationCount,
    recentInquiries,
    recentAudit,
  ] = await Promise.all([
    db.select({ value: sql<number>`count(*)::int` }).from(products),
    db.select({ value: sql<number>`count(*)::int` }).from(products).where(sql`status = 'published'`),
    db.select({ value: sql<number>`count(*)::int` }).from(products).where(sql`status = 'draft'`),
    db.select({ value: sql<number>`count(*)::int` }).from(categories),
    db.select({ value: sql<number>`count(*)::int` }).from(collections),
    db.select({ value: sql<number>`count(*)::int` }).from(pages),
    db.select({ value: sql<number>`count(*)::int` }).from(media),
    db.select({ value: sql<number>`count(*)::int` }).from(inquiries).where(sql`status = 'new'`),
    db.select({ value: sql<number>`count(*)::int` }).from(inquiries),
    db.select({ value: sql<number>`count(*)::int` }).from(newsletterSubscribers),
    db.select({ value: sql<number>`count(*)::int` }).from(homeSections),
    db.select({ value: sql<number>`count(*)::int` }).from(homeSections).where(sql`enabled = true`),
    db.select({ value: sql<number>`count(*)::int` }).from(navigationItems),
    db
      .select({
        id: inquiries.id,
        name: inquiries.name,
        message: inquiries.message,
        productName: inquiries.productName,
        status: inquiries.status,
        createdAt: inquiries.createdAt,
      })
      .from(inquiries)
      .orderBy(desc(inquiries.createdAt))
      .limit(5),
    db
      .select({
        id: auditLogs.id,
        actorLabel: auditLogs.actorLabel,
        action: auditLogs.action,
        summary: auditLogs.summary,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(6),
  ]);

  const n = (row: { value: number } | undefined): number => Number(row?.value ?? 0);

  return {
    products: {
      total: n(productTotal[0]),
      published: n(productPublished[0]),
      drafts: n(productDrafts[0]),
    },
    catalog: {
      categories: n(categoryCount[0]),
      collections: n(collectionCount[0]),
      pages: n(pageCount[0]),
      media: n(mediaCount[0]),
    },
    engagement: {
      newInquiries: n(inquiryNew[0]),
      inquiries: n(inquiryTotal[0]),
      subscribers: n(subscriberCount[0]),
    },
    presentation: {
      sections: n(sectionTotal[0]),
      enabledSections: n(sectionEnabled[0]),
      navigation: n(navigationCount[0]),
    },
    recentInquiries,
    recentAudit,
  };
}
