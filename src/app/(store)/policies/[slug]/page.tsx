import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumb, ContentPending, PageHeader } from '@/components/storefront/page-header';
import { RichContent } from '@/components/storefront/rich-content';
import { getPageBySlug } from '@/lib/queries/content';
import { getSettings } from '@/lib/settings';

export const revalidate = 120;

const POLICY_SLUGS = ['shipping', 'returns', 'privacy', 'terms', 'ordering'] as const;
type PolicySlug = (typeof POLICY_SLUGS)[number];

const POLICY_INTROS: Record<PolicySlug, string> = {
  shipping: 'How we pack, ship and deliver orders across the Philippines.',
  returns: 'When an item can be exchanged or returned, and what we need from you.',
  privacy: 'What we collect on this site and how it is used.',
  terms: 'The terms that apply when you browse and order from us.',
  ordering: 'How to place an order from first message to delivery.',
};

interface PolicyPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return POLICY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!POLICY_SLUGS.includes(slug as PolicySlug)) return { title: 'Page not found' };
  const page = await getPageBySlug(slug);
  const settings = await getSettings();

  return {
    title: page?.seoTitle || page?.title || `${slug.charAt(0).toUpperCase()}${slug.slice(1)} policy`,
    description: page?.seoDescription || POLICY_INTROS[slug as PolicySlug] || settings.brand.tagline || undefined,
    alternates: { canonical: `/policies/${slug}` },
  };
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = await params;
  if (!POLICY_SLUGS.includes(slug as PolicySlug)) notFound();

  const key = slug as PolicySlug;
  const page = await getPageBySlug(key);
  const title = page?.title || `${key.charAt(0).toUpperCase()}${key.slice(1)}`;

  return (
    <div className="container-site py-10 sm:py-14">
      <Breadcrumb trail={[{ label: 'Policies' }, { label: title }]} />
      <PageHeader
        eyebrow="Policy"
        title={title}
        intro={page ? null : POLICY_INTROS[key]}
      />

      {page ? (
        <>
          <RichContent blocks={page.content} className="max-w-3xl" />
          <p className="mt-6 text-xs text-muted">Last updated: {new Date(page.updatedAt).toLocaleDateString('en-PH')}</p>
        </>
      ) : (
        <div className="max-w-3xl space-y-6">
          <ContentPending title={title} channel="Messenger" />
          <p className="text-sm leading-relaxed text-muted">
            Nothing on this page is published yet, so we will not guess at the details. Message us and we will
            confirm the current policy for your order in writing before you commit to anything.
          </p>
          <Link href="/contact" className="btn btn-outline">
            Contact us
          </Link>
        </div>
      )}
    </div>
  );
}
