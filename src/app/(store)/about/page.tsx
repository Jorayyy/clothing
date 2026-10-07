import type { Metadata } from 'next';
import Link from 'next/link';

import { IconArrowRight } from '@/components/ui/icons';
import { Breadcrumb, ContentPending, PageHeader } from '@/components/storefront/page-header';
import { RichContent } from '@/components/storefront/rich-content';
import { getPageBySlug } from '@/lib/queries/content';
import { getSettings } from '@/lib/settings';

export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getPageBySlug('about'), getSettings()]);
  return {
    title: page?.seoTitle || page?.title || `About ${settings.brand.name}`,
    description: page?.seoDescription || settings.brand.description || settings.brand.tagline || undefined,
    alternates: { canonical: '/about' },
  };
}

export default async function AboutPage() {
  const [page, settings] = await Promise.all([getPageBySlug('about'), getSettings()]);
  const steps = settings.store.orderingSteps;

  return (
    <div className="container-site py-10 sm:py-14">
      <Breadcrumb trail={[{ label: 'About' }]} />
      <PageHeader
        eyebrow="Our story"
        title={page?.title || settings.brand.name}
        intro={page ? null : settings.brand.description || settings.brand.tagline}
      />

      {page ? (
        <RichContent blocks={page.content} className="max-w-3xl" />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="max-w-2xl">
            <p className="text-[1.05rem] leading-relaxed text-ink">
              {settings.brand.tagline ||
                `${settings.brand.name} is a Filipino fashion label built for everyday wear.`}
            </p>
            {settings.brand.description ? (
              <p className="mt-5 whitespace-pre-line text-[0.98rem] leading-relaxed text-muted">
                {settings.brand.description}
              </p>
            ) : null}
            {settings.store.serviceNote ? (
              <p className="mt-5 text-[0.98rem] leading-relaxed text-muted">{settings.store.serviceNote}</p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-primary">
                Shop the collection
                <IconArrowRight size={16} />
              </Link>
              <Link href="/contact" className="btn btn-outline">
                Talk to us
              </Link>
            </div>
          </div>

          <aside className="border border-line bg-surface p-6">
            <p className="eyebrow mb-4">How ordering works</p>
            <ol className="space-y-4">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="font-display text-xl text-accent">{index + 1}</span>
                  <div>
                    <p className="text-sm font-semibold">{step.title}</p>
                    {step.detail ? <p className="mt-1 text-sm leading-relaxed text-muted">{step.detail}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
            <ContentPending title="Our full story" channel="Messenger" />
          </aside>
        </div>
      )}
    </div>
  );
}
