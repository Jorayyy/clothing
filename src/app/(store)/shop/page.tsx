import type { Metadata } from 'next';

import { ProductListing } from '@/components/storefront/product-listing';
import { getPublicCategories } from '@/lib/queries/catalog';
import { getSettings } from '@/lib/settings';
import {
  parseShopParams,
  shopQueryString,
  type SearchParamsValue,
} from '@/lib/shop-params';

interface ShopPageProps {
  searchParams: Promise<Record<string, SearchParamsValue>>;
}

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const params = parseShopParams(await searchParams);
  const settings = await getSettings();
  const categories = await getPublicCategories();
  const category = categories.find((item) => item.slug === params.category);

  const title = params.q
    ? `Search: ${params.q}`
    : category
      ? category.name
      : params.collection
        ? 'Collection'
        : 'Shop all';

  return {
    title,
    description: category?.description || settings.brand.tagline || undefined,
    alternates: { canonical: `/shop${shopQueryString(params)}` },
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = parseShopParams(await searchParams);
  const [settings, categories] = await Promise.all([getSettings(), getPublicCategories()]);
  const category = categories.find((item) => item.slug === params.category);

  const heading = params.q
    ? `Results for “${params.q}”`
    : category
      ? category.name
      : params.collection
        ? 'Collection'
        : 'Shop all';

  return (
    <ProductListing
      params={params}
      basePath="/shop"
      settings={settings}
      heading={heading}
      intro={category?.description || settings.brand.tagline}
      categories={categories}
      showFacets
      defaultSort="newest"
    />
  );
}
