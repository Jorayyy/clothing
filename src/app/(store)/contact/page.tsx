import type { Metadata } from 'next';

import { ContactForm } from '@/components/storefront/contact-form';
import { InquiryButton } from '@/components/storefront/inquiry-button';
import { Breadcrumb, PageHeader } from '@/components/storefront/page-header';
import { SocialIcon } from '@/components/ui/icons';
import { buildGeneralInquiryLink } from '@/lib/inquiry';
import { getPageBySlug } from '@/lib/queries/content';
import { getSettings } from '@/lib/settings';
import { siteOrigin } from '@/lib/site';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('contact');
  return {
    title: page?.seoTitle || page?.title || 'Contact',
    description:
      page?.seoDescription ||
      'Reach the MicsApparel team on Facebook Messenger, email or phone.',
    alternates: { canonical: '/contact' },
  };
}

function destinationHref(channel: string, value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (channel === 'email') return `mailto:${trimmed}`;
  if (channel === 'phone') return `tel:${trimmed.replace(/[^\d+]/g, '')}`;
  if (channel === 'whatsapp') return `https://wa.me/${trimmed.replace(/[^\d]/g, '')}`;
  return trimmed;
}

export default async function ContactPage() {
  const [page, settings] = await Promise.all([getPageBySlug('contact'), getSettings()]);
  const origin = siteOrigin(settings.seo.siteUrl);
  const inquiry = buildGeneralInquiryLink({ contact: settings.contact, siteUrl: origin });
  const destinations = settings.contact.destinations.filter((item) => item.enabled && item.value);
  const hours = settings.store.businessHours;

  return (
    <div className="container-site py-10 sm:py-14">
      <Breadcrumb trail={[{ label: 'Contact' }]} />
      <PageHeader
        eyebrow="We reply fastest on Messenger"
        title={page?.title || 'Contact us'}
        intro={page ? null : 'Send us a message about sizing, stock, delivery or anything else.'}
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
        <div className="space-y-8">
          <div className="border border-line bg-surface p-6">
            <p className="eyebrow mb-4">Chat with us</p>
            <InquiryButton
              href={inquiry.href}
              label={inquiry.label}
              message={inquiry.message}
              note={inquiry.note}
              variant="accent"
              recordPath="/contact"
            />
          </div>

          <div>
            <p className="eyebrow mb-4">Other ways to reach us</p>
            <ul className="space-y-2.5 text-sm">
              {settings.contact.email ? (
                <li className="flex flex-wrap items-baseline gap-2">
                  <span className="w-16 text-muted">Email</span>
                  <a href={`mailto:${settings.contact.email}`} className="text-ink transition hover:text-accent">
                    {settings.contact.email}
                  </a>
                </li>
              ) : null}
              {settings.contact.phone ? (
                <li className="flex flex-wrap items-baseline gap-2">
                  <span className="w-16 text-muted">Phone</span>
                  <a
                    href={`tel:${settings.contact.phone.replace(/[^\d+]/g, '')}`}
                    className="text-ink transition hover:text-accent"
                  >
                    {settings.contact.phone}
                  </a>
                </li>
              ) : null}
              {settings.contact.address ? (
                <li className="flex flex-wrap items-baseline gap-2">
                  <span className="w-16 text-muted">Address</span>
                  <span className="text-ink">{settings.contact.address}</span>
                </li>
              ) : null}
              {settings.contact.responseTimeNote ? (
                <li className="flex flex-wrap items-baseline gap-2">
                  <span className="w-16 text-muted">Hours</span>
                  <span className="text-ink">{settings.contact.responseTimeNote}</span>
                </li>
              ) : null}
            </ul>

            {destinations.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-2.5">
                {destinations.map((destination) => (
                  <li key={destination.id}>
                    <a
                      href={destinationHref(destination.channel, destination.value)}
                      target={destination.channel === 'email' || destination.channel === 'phone' ? undefined : '_blank'}
                      rel="noreferrer noopener"
                      className="btn btn-outline btn-sm"
                    >
                      <SocialIcon platform={destination.channel} size={15} />
                      {destination.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="border border-line bg-surface p-6">
            <p className="eyebrow mb-4">Business hours</p>
            <dl className="space-y-2 text-sm">
              {hours.map((row) => (
                <div key={row.day} className="flex items-baseline justify-between gap-4 border-b border-line/70 pb-2">
                  <dt className="text-muted">{row.day}</dt>
                  <dd className={row.closed ? 'text-right text-muted' : 'text-right text-ink'}>
                    {row.closed ? 'Closed' : row.hours}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-muted">{settings.store.paymentNote}</p>
          </div>
        </div>

        <div>
          <p className="eyebrow mb-4">Send a message</p>
          <ContactForm contact={{ email: settings.contact.email, phone: settings.contact.phone }} />

          <p className="mt-6 text-xs leading-relaxed text-muted">
            Messages sent here are added to our inquiry list so nothing gets missed. If your question is urgent,
            Messenger is the quickest way to reach a real person.
          </p>
        </div>
      </div>
    </div>
  );
}
