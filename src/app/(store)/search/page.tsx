import type { Metadata } from 'next';

import { ProductListing } from '@/components/storefront/product-listing';
import { getPublicCategories } from '@/lib/queries/catalog';
import { getSettings } from '@/lib/settings';
import { parseShopParams, type SearchParamsValue } from '@/lib/shop-params';

interface SearchPageProps {
  searchParams: Promise<Record<string, SearchParamsValue>>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = parseShopParams(await searchParams);
  return {
    title: params.q ? `Search: ${params.q}` : 'Search',
    robots: { index: false, follow: true },
    alternates: { canonical: '/search' },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = parseShopParams(await searchParams);
  const [settings, categories] = await Promise.all([getSettings(), getPublicCategories()]);

  return (
    <ProductListing
      params={{ ...params, category: '' }}
      basePath="/search"
      settings={settings}
      heading={params.q ? `Results for “${params.q}”` : 'Search'}
      intro={
        params.q
          ? null
          : 'Find a piece by name, style, colour or size. Use the filters to narrow it down.'
      }
      categories={categories}
      showFacets
      defaultSort="newest"
    />
  );
}
