import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProductListing } from '@/components/storefront/product-listing';
import { getCollectionBySlug, getPublicCategories } from '@/lib/queries/catalog';
import { getSettings } from '@/lib/settings';
import { parseShopParams, type SearchParamsValue } from '@/lib/shop-params';

export const revalidate = 120;

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, SearchParamsValue>>;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: 'Collection' };

  return {
    title: collection.name,
    description: collection.description || undefined,
    alternates: { canonical: `/collections/${collection.slug}` },
  };
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const { slug } = await params;
  const [collection, rawSearchParams, settings, categories] = await Promise.all([
    getCollectionBySlug(slug),
    searchParams,
    getSettings(),
    getPublicCategories(),
  ]);

  if (!collection) notFound();

  const parsed = parseShopParams(rawSearchParams);

  return (
    <ProductListing
      params={{ ...parsed, collection: '', category: '' }}
      basePath={`/collections/${collection.slug}`}
      settings={settings}
      heading={collection.name}
      intro={collection.description || 'A curated edit from MicsApparel.'}
      categories={categories}
      showFacets
      defaultSort="newest"
      fixedQuery={{ collectionSlug: collection.slug }}
      collection={collection}
    />
  );
}
