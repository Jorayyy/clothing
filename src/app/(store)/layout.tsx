import type { Metadata } from 'next';

import { AnnouncementBar } from '@/components/storefront/announcement-bar';
import { Footer } from '@/components/storefront/footer';
import { Header } from '@/components/storefront/header';
import { MessengerFab } from '@/components/storefront/messenger-fab';
import { buildGeneralInquiryLink } from '@/lib/inquiry';
import { getMediaById } from '@/lib/media';
import { getPublicCategories } from '@/lib/queries/catalog';
import { getNavigation, listFooterPages } from '@/lib/queries/content';
import { getSettings } from '@/lib/settings';
import { siteOrigin } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const origin = siteOrigin(settings.seo.siteUrl);
  const logo = settings.brand.logoMediaId ? await getMediaById(settings.brand.logoMediaId) : null;

  return {
    applicationName: settings.brand.name,
    openGraph: {
      siteName: settings.brand.name,
      url: origin,
      ...(logo ? { images: [{ url: logo.url, alt: settings.brand.name }] } : {}),
    },
  };
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, headerNav, footerNav, categories, infoPages] = await Promise.all([
    getSettings(),
    getNavigation('header'),
    getNavigation('footer'),
    getPublicCategories(),
    listFooterPages(),
  ]);

  const logo = settings.brand.logoMediaId ? await getMediaById(settings.brand.logoMediaId) : null;
  const origin = siteOrigin(settings.seo.siteUrl);
  const inquiry = buildGeneralInquiryLink({ contact: settings.contact, siteUrl: origin });

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        Skip to content
      </a>

      <AnnouncementBar announcement={settings.store.announcement} />

      <Header
        groups={headerNav}
        wordmark={settings.brand.wordmark}
        logoUrl={logo?.url ?? null}
        layout={settings.theme.headerLayout}
        messengerHref={inquiry.method === 'none' ? null : inquiry.href}
        messengerLabel="Inquire"
      />

      <main id="main" className="flex-1">
        {children}
      </main>

      <Footer settings={settings} groups={footerNav} categories={categories} infoPages={infoPages} />

      <MessengerFab href={inquiry.href} label={inquiry.label} secondaryLabel={settings.brand.wordmark} />

      {settings.store.serviceNote ? (
        <p className="sr-only">{settings.store.serviceNote}</p>
      ) : null}
    </div>
  );
}
