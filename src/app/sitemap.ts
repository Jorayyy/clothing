import type { MetadataRoute } from 'next';

import { getPublicCategories, getPublicCollections } from '@/lib/queries/catalog';
import { RESERVED_PAGE_SLUGS, listPages } from '@/lib/queries/content';
import { listPublicProductsForSitemap } from '@/lib/queries/products';
import { getSettings } from '@/lib/settings';
import { siteOrigin } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin((await getSettings()).seo.siteUrl);
  const [products, collections, categories, pages] = await Promise.all([
    listPublicProductsForSitemap(),
    getPublicCollections(),
    getPublicCategories(),
    listPages(),
  ]);

  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: origin, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${origin}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${origin}/collections`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${origin}/new-arrivals`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${origin}/best-sellers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${origin}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${origin}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${origin}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${origin}/policies/shipping`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${origin}/policies/returns`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${origin}/policies/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${origin}/policies/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  return [
    ...staticRoutes,
    ...collections.map((collection) => ({
      url: `${origin}/collections/${collection.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...categories.map((category) => ({
      url: `${origin}/shop?category=${category.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...pages
      .filter((page) => !(RESERVED_PAGE_SLUGS as readonly string[]).includes(page.slug))
      .map((page) => ({
        url: `${origin}/pages/${page.slug}`,
        lastModified: new Date(page.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.4,
      })),
    ...products.map((product) => ({
      url: `${origin}/products/${product.slug}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
