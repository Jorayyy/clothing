import type { Metadata, Viewport } from 'next';
import { Archivo, Instrument_Serif } from 'next/font/google';

import { ToastProvider } from '@/components/ui/toast';
import { getSettings, fontVars, themeCssVars } from '@/lib/settings';

import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo',
});

const instrument = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-instrument',
});

function absolute(url: string, fallback: string): string {
  const trimmed = url.trim();
  if (!trimmed) return fallback;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, '');
  return fallback;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const { seo, brand, contact } = settings;
  const siteUrl = absolute(
    seo.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || '',
    `https://${process.env.VERCEL_URL ?? 'localhost:3000'}`,
  );

  const ogImage = seo.ogImageMediaId ? null : null;
  void ogImage;

  const defaults: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
      default: seo.defaultTitle || brand.name,
      template: seo.titleTemplate || '%s | MicsApparel',
    },
    description: seo.defaultDescription || brand.description || brand.tagline || undefined,
    applicationName: brand.name,
    keywords: ['MicsApparel', 'Filipino fashion', 'online boutique', 'Philippines', 'streetwear'],
    openGraph: {
      type: 'website',
      locale: 'en_PH',
      siteName: brand.name,
      url: siteUrl,
      title: seo.defaultTitle || brand.name,
      description: seo.defaultDescription || brand.description || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      site: seo.twitterHandle || undefined,
      title: seo.defaultTitle || brand.name,
      description: seo.defaultDescription || brand.description || undefined,
    },
    robots: seo.robotsEnabled
      ? { index: true, follow: true }
      : { index: false, follow: false },
    alternates: { canonical: '/' },
    icons: {
      icon: contact.facebookPageUrl ? undefined : undefined,
    },
  };
  return defaults;
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await getSettings();
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: settings.theme.colors.background,
    colorScheme: 'light',
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const style = {
    ...fontVars(settings.theme.fontPreset),
    ...themeCssVars(settings.theme),
  } as React.CSSProperties;

  return (
    <html
      lang="en-PH"
      data-scroll-behavior="smooth"
      className={`${archivo.variable} ${instrument.variable}`}
      style={style}
    >
      <body className="min-h-dvh antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
