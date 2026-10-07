import type { Metadata } from 'next';
import Link from 'next/link';

import { IconArrowRight } from '@/components/ui/icons';
import { Breadcrumb, PageHeader } from '@/components/storefront/page-header';
import { RichContent } from '@/components/storefront/rich-content';
import { buildGeneralInquiryLink } from '@/lib/inquiry';
import { getPageBySlug } from '@/lib/queries/content';
import { getSettings } from '@/lib/settings';
import { siteOrigin } from '@/lib/site';

export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('faq');
  return {
    title: page?.seoTitle || page?.title || 'FAQ',
    description:
      page?.seoDescription ||
      'Answers to the questions we get most often about ordering, payment and delivery.',
    alternates: { canonical: '/faq' },
  };
}

export default async function FaqPage() {
  const [page, settings] = await Promise.all([getPageBySlug('faq'), getSettings()]);
  const origin = siteOrigin(settings.seo.siteUrl);
  const inquiry = buildGeneralInquiryLink({ contact: settings.contact, siteUrl: origin });
  const steps = settings.store.orderingSteps;
  const payments = settings.store.paymentMethods.filter((method) => method.enabled);

  return (
    <div className="container-site py-10 sm:py-14">
      <Breadcrumb trail={[{ label: 'FAQ' }]} />
      <PageHeader
        eyebrow="Good to know"
        title={page?.title || 'Frequently asked questions'}
        intro={page ? null : 'The things customers ask us most before they order.'}
      />

      {page ? (
        <RichContent blocks={page.content} className="max-w-3xl" />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="max-w-3xl space-y-3">
            <details className="border border-line bg-surface px-5 py-4" open>
              <summary className="cursor-pointer text-sm font-semibold">How do I place an order?</summary>
              <ol className="mt-3 space-y-3">
                {steps.map((step, index) => (
                  <li key={step.title} className="flex gap-3 text-sm leading-relaxed text-muted">
                    <span className="font-semibold text-accent">{index + 1}.</span>
                    <span>
                      <span className="font-medium text-ink">{step.title}</span>
                      {step.detail ? ` — ${step.detail}` : ''}
                    </span>
                  </li>
                ))}
              </ol>
            </details>

            <details className="border border-line bg-surface px-5 py-4">
              <summary className="cursor-pointer text-sm font-semibold">What payment methods do you accept?</summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {payments.length > 0
                  ? `We currently arrange ${payments.map((method) => method.label).join(', ')}.`
                  : 'Payment options are confirmed with you during the conversation.'}{' '}
                {settings.store.paymentNote}
              </p>
            </details>

            <details className="border border-line bg-surface px-5 py-4">
              <summary className="cursor-pointer text-sm font-semibold">Do you ship nationwide?</summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                We ship across the Philippines. Exact delivery timelines and fees are confirmed with you before you
                pay.{' '}
                <Link href="/policies/shipping" className="text-accent hover:underline">
                  Read the shipping policy
                </Link>
                .
              </p>
            </details>

            <details className="border border-line bg-surface px-5 py-4">
              <summary className="cursor-pointer text-sm font-semibold">Can I exchange or return an item?</summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Exchange and return eligibility depends on the item and its condition.{' '}
                <Link href="/policies/returns" className="text-accent hover:underline">
                  Read the returns policy
                </Link>{' '}
                or ask us directly and we will confirm what applies to your order.
              </p>
            </details>

            <details className="border border-line bg-surface px-5 py-4">
              <summary className="cursor-pointer text-sm font-semibold">How do I know my size?</summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Each product page lists the measurements and fit notes for that piece. If you are between sizes,
                message us with your usual size and we will recommend one.
              </p>
            </details>

            <details className="border border-line bg-surface px-5 py-4">
              <summary className="cursor-pointer text-sm font-semibold">Where can I reach you?</summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Facebook Messenger is our fastest channel
                {settings.contact.responseTimeNote ? ` — ${settings.contact.responseTimeNote}` : ''}.{' '}
                <Link href="/contact" className="text-accent hover:underline">
                  See all contact details
                </Link>
                .
              </p>
            </details>
          </div>

          <aside className="h-fit border border-line bg-surface p-6">
            <p className="eyebrow mb-3">Still unsure?</p>
            <p className="text-sm leading-relaxed text-muted">
              Ask us anything before you order — we would rather answer twice than have you guess.
            </p>
            <a href={inquiry.href} target="_blank" rel="noreferrer noopener" className="btn btn-accent mt-5">
              Chat with us
              <IconArrowRight size={16} />
            </a>
            <p className="mt-3 text-xs leading-relaxed text-muted">{inquiry.note}</p>
          </aside>
        </div>
      )}
    </div>
  );
}
