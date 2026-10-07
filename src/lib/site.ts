const FALLBACK_ORIGIN = 'https://micsapparel.ph';

function clean(value: string | undefined | null): string {
  return (value ?? '').trim().replace(/\/+$/, '');
}

/** Absolute site origin. Never throws; always returns a valid URL. */
export function siteOrigin(seoSiteUrl?: string): string {
  const candidates = [
    clean(seoSiteUrl),
    clean(process.env.NEXT_PUBLIC_SITE_URL),
    process.env.VERCEL_URL ? `https://${clean(process.env.VERCEL_URL)}` : '',
  ];
  for (const candidate of candidates) {
    if (/^https?:\/\/[^\s/]+/i.test(candidate)) return candidate;
  }
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000';
  return FALLBACK_ORIGIN;
}

/** Joins the site origin with an app-relative path. Absolute inputs pass through. */
export function absoluteUrl(path: string, seoSiteUrl?: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteOrigin(seoSiteUrl)}${path.startsWith('/') ? '' : '/'}${path}`;
}
