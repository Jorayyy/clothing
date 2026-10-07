import type { MetadataRoute } from 'next';

import { getSettings } from '@/lib/settings';
import { siteOrigin } from '@/lib/site';

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings();
  const origin = siteOrigin(settings.seo.siteUrl);

  if (!settings.seo.robotsEnabled) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/search'],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
