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
  const params = parseShopParams(await searchParams, { defaultSort: 'best-sellers' });
  return {
    title: 'Best sellers',
    description: 'The pieces our customers come back for.',
    alternates: { canonical: `/best-sellers${params.q ? `?q=${encodeURIComponent(params.q)}` : ''}` },
  };
}

export default async function BestSellersPage({ searchParams }: PageProps) {
  const params = parseShopParams(await searchParams, { defaultSort: 'best-sellers' });
  const [settings, categories] = await Promise.all([getSettings(), getPublicCategories()]);

  return (
    <ProductListing
      params={{ ...params, category: '' }}
      basePath="/best-sellers"
      settings={settings}
      heading="Best sellers"
      intro="Our most requested styles."
      categories={categories}
      showFacets
      defaultSort="best-sellers"
      fixedQuery={{ bestSellers: true }}
    />
  );
}
