import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumb, PageHeader } from '@/components/storefront/page-header';
import { RichContent } from '@/components/storefront/rich-content';
import { RESERVED_PAGE_SLUGS, getPageBySlug } from '@/lib/queries/content';
import { getSettings } from '@/lib/settings';

export const revalidate = 120;

interface StaticPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StaticPageProps): Promise<Metadata> {
  const { slug } = await params;
  if ((RESERVED_PAGE_SLUGS as readonly string[]).includes(slug)) return { title: 'Page not found' };
  const page = await getPageBySlug(slug);
  if (!page) return { title: 'Page not found' };

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
    alternates: { canonical: `/pages/${page.slug}` },
  };
}

export default async function StaticPage({ params }: StaticPageProps) {
  const { slug } = await params;
  if ((RESERVED_PAGE_SLUGS as readonly string[]).includes(slug)) notFound();

  const [page, settings] = await Promise.all([getPageBySlug(slug), getSettings()]);
  if (!page) notFound();

  const content = page.content ?? [];

  return (
    <div className="container-site py-10 sm:py-14">
      <Breadcrumb trail={[{ label: page.title }]} />
      <PageHeader title={page.title} intro={null} />

      {content.length > 0 ? (
        <RichContent blocks={content} className="max-w-3xl" />
      ) : (
        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          This page is published but has no content yet. Need an answer now?{' '}
          <Link href="/contact" className="text-accent hover:underline">
            Contact us
          </Link>{' '}
          or chat with us on Messenger — {settings.brand.name} replies there first.
        </p>
      )}

      <p className="mt-8 text-xs text-muted">
        Last updated: {new Date(page.updatedAt).toLocaleDateString('en-PH')}
      </p>
    </div>
  );
}
