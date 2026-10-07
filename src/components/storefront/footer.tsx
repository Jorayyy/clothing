import Link from 'next/link';

import { SocialIcon } from '@/components/ui/icons';
import type { ResolvedNavGroup, ResolvedPage } from '@/lib/queries/content';
import type { CategoryCard } from '@/lib/queries/catalog';
import type { Settings } from '@/lib/settings';
import { cn } from '@/lib/utils';

interface FooterProps {
  settings: Settings;
  groups: ResolvedNavGroup[];
  categories: CategoryCard[];
  infoPages: ResolvedPage[];
}

export function Footer({ settings, groups, categories, infoPages }: FooterProps) {
  const { brand, store, contact, social } = settings;
  const layout = settings.theme.footerLayout;
  const enabledSocial = social.links.filter((link) => link.enabled && link.href);
  const payments = store.paymentMethods.filter((method) => method.enabled);

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div
        className={cn(
          'container-site grid gap-10 py-14',
          layout === 'columns' && 'md:grid-cols-2 lg:grid-cols-4',
          layout === 'stacked' && 'max-w-3xl text-center',
          layout === 'compact' && 'md:grid-cols-2 lg:grid-cols-3',
        )}
      >
        <div className={cn(layout === 'stacked' && 'mx-auto')}>
          <p className="font-display text-xl uppercase tracking-[0.26em]">{brand.wordmark}</p>
          {brand.tagline ? <p className="mt-3 text-sm leading-relaxed text-muted">{brand.tagline}</p> : null}
          {brand.description ? (
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{brand.description}</p>
          ) : null}

          {enabledSocial.length > 0 ? (
            <ul className={cn('mt-5 flex flex-wrap gap-3', layout === 'stacked' && 'justify-center')}>
              {enabledSocial.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={link.label}
                    className="flex h-10 w-10 items-center justify-center border border-line text-ink transition hover:border-accent hover:text-accent"
                  >
                    <SocialIcon platform={link.platform} size={17} />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav aria-label="Footer">
          <p className="eyebrow mb-4">Shop</p>
          <ul className={cn('space-y-2.5', layout === 'stacked' && 'flex flex-wrap justify-center gap-x-6')}>
            {groups.slice(0, 6).map((group) => (
              <li key={group.id}>
                <Link href={group.href} className="text-sm text-muted transition hover:text-accent">
                  {group.label}
                </Link>
              </li>
            ))}
          </ul>
          {categories.length > 0 ? (
            <>
              <p className="eyebrow mb-3 mt-7">Categories</p>
              <ul className={cn('space-y-2.5', layout === 'stacked' && 'flex flex-wrap justify-center gap-x-6')}>
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/shop?category=${category.slug}`}
                      className="text-sm text-muted transition hover:text-accent"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </nav>

        <div>
          <p className="eyebrow mb-4">Information</p>
          <ul className={cn('space-y-2.5', layout === 'stacked' && 'flex flex-wrap justify-center gap-x-6')}>
            <li>
              <Link href="/faq" className="text-sm text-muted transition hover:text-accent">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/policies/shipping" className="text-sm text-muted transition hover:text-accent">
                Shipping &amp; delivery
              </Link>
            </li>
            <li>
              <Link href="/policies/returns" className="text-sm text-muted transition hover:text-accent">
                Returns &amp; exchanges
              </Link>
            </li>
            <li>
              <Link href="/policies/privacy" className="text-sm text-muted transition hover:text-accent">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/policies/terms" className="text-sm text-muted transition hover:text-accent">
                Terms &amp; conditions
              </Link>
            </li>
            {infoPages
              .filter((page) => !['faq', 'shipping', 'returns', 'privacy', 'terms'].includes(page.slug))
              .map((page) => (
                <li key={page.id}>
                  <Link href={`/pages/${page.slug}`} className="text-sm text-muted transition hover:text-accent">
                    {page.title}
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-4">Get in touch</p>
          <ul className="space-y-2.5 text-sm text-muted">
            {contact.email ? (
              <li>
                <a href={`mailto:${contact.email}`} className="transition hover:text-accent">
                  {contact.email}
                </a>
              </li>
            ) : null}
            {contact.phone ? (
              <li>
                <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} className="transition hover:text-accent">
                  {contact.phone}
                </a>
              </li>
            ) : null}
            {contact.address ? <li className="leading-relaxed">{contact.address}</li> : null}
            {contact.facebookPageUrl ? (
              <li>
                <a
                  href={contact.facebookPageUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="transition hover:text-accent"
                >
                  Facebook page
                </a>
              </li>
            ) : null}
            {contact.responseTimeNote ? <li className="pt-1 text-xs">{contact.responseTimeNote}</li> : null}
          </ul>

          {payments.length > 0 ? (
            <div className="mt-6">
              <p className="eyebrow mb-2.5">Accepted arrangements</p>
              <ul className="flex flex-wrap gap-2">
                {payments.map((method) => (
                  <li key={method.id} className="tag tag-outline">
                    {method.label}
                  </li>
                ))}
              </ul>
              <p className="mt-2.5 text-xs leading-relaxed text-muted">{store.paymentNote}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-line">
        <div
          className={cn(
            'container-site flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted sm:flex-row',
          )}
        >
          <p>
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <p className="text-center sm:text-right">
            Inquiries and orders are arranged directly with our team via Facebook Messenger.
          </p>
        </div>
      </div>
    </footer>
  );
}
