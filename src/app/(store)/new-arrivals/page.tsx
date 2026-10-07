import type { Metadata } from 'next';

import { ProductListing } from '@/components/storefront/product-listing';
import { getPublicCategories } from '@/lib/queries/catalog';
import { getSettings } from '@/lib/settings';
import { parseShopParams, type SearchParamsValue } from '@/lib/shop-params';

export const revalidate = 120;

interface PageProps {
  searchParams: Promise<Record<string, SearchParamsValue>>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = parseShopParams(await searchParams, { defaultSort: 'newest' });
  return {
    title: 'New arrivals',
    description: 'The newest pieces from MicsApparel.',
    alternates: { canonical: `/new-arrivals${params.q ? `?q=${encodeURIComponent(params.q)}` : ''}` },
  };
}

export default async function NewArrivalsPage({ searchParams }: PageProps) {
  const params = parseShopParams(await searchParams, { defaultSort: 'newest' });
  const [settings, categories] = await Promise.all([getSettings(), getPublicCategories()]);

  return (
    <ProductListing
      params={{ ...params, category: '' }}
      basePath="/new-arrivals"
      settings={settings}
      heading="New arrivals"
      intro="Fresh drops, added as they land."
      categories={categories}
      showFacets
      defaultSort="newest"
      fixedQuery={{ newArrivals: true }}
    />
  );
}
