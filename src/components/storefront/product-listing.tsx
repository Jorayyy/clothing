import Link from 'next/link';

import { ProductCard, ProductGrid } from '@/components/storefront/product-card';
import { ActiveFilters, ShopFilters } from '@/components/storefront/shop-filters';
import { SortSelect } from '@/components/storefront/sort-select';
import { IconGrid } from '@/components/ui/icons';
import { EmptyState, Pagination } from '@/components/ui/misc';
import { buildInquiryLink } from '@/lib/inquiry';
import type { CategoryCard, CollectionCard } from '@/lib/queries/catalog';
import type { ProductQuery } from '@/lib/queries/products';
import { getAttributeFacets, listProducts } from '@/lib/queries/products';
import type { Settings } from '@/lib/settings';
import { siteOrigin } from '@/lib/site';
import {
  toFacetBase,
  toProductQuery,
  type ShopParams,
} from '@/lib/shop-params';

export interface ProductListingProps {
  params: ShopParams;
  basePath: string;
  settings: Settings;
  heading: string;
  intro?: string | null;
  /** Extra fixed filters (e.g. newArrivals / bestSellers / collection slug). */
  fixedQuery?: Omit<ProductQuery, 'page' | 'perPage' | 'sort'>;
  defaultSort?: ProductQuery['sort'];
  categories: CategoryCard[];
  /** When omitted, attribute facets are not shown. */
  showFacets?: boolean;
  collection?: CollectionCard | null;
}

export async function ProductListing({
  params,
  basePath,
  settings,
  heading,
  intro,
  fixedQuery = {},
  defaultSort = 'newest',
  categories,
  showFacets = true,
  collection,
}: ProductListingProps) {
  const origin = siteOrigin(settings.seo.siteUrl);

  const query: ProductQuery = {
    ...toProductQuery(params, 24),
    ...fixedQuery,
    sort: params.sort ?? defaultSort,
  };

  const facets = showFacets
    ? await getAttributeFacets({ ...toFacetBase(params), ...fixedQuery })
    : [];

  const products = await listProducts(query);

  const paginationSearch = Object.fromEntries(
    Object.entries({
      q: params.q,
      price: params.price,
      sort: params.sort === defaultSort ? '' : params.sort,
      size: params.attributes.size?.join(','),
      color: params.attributes.color?.join(','),
      style: params.attributes.style?.join(','),
      category: params.category,
    }).filter(([, value]) => Boolean(value)),
  );

  return (
    <div className="container-site py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="mb-5 text-xs uppercase tracking-[0.16em] text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="transition-colors hover:text-accent">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink">{heading}</li>
        </ol>
      </nav>

      <header className="mb-8 border-b border-line pb-6">
        <h1 className="section-title text-[clamp(1.9rem,4vw,3rem)]">{heading}</h1>
        {intro ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{intro}</p> : null}
        {collection ? (
          <div className="mt-4">
            <Link href="/collections" className="text-xs uppercase tracking-[0.16em] text-muted hover:text-accent">
              ← All collections
            </Link>
          </div>
        ) : null}
      </header>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
            <ShopFilters
              params={params}
              basePath={basePath}
              categories={categories}
              facets={facets}
              idPrefix="desk"
            />
          </div>
        </aside>

        <div>
          <details className="mb-6 border border-line lg:hidden">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3.5 text-[0.7rem] font-bold uppercase tracking-[0.16em]">
              <span className="flex items-center gap-2">
                <IconGrid size={16} />
                Filters &amp; sort
              </span>
              <span className="text-muted">Open</span>
            </summary>
            <div className="border-t border-line px-4 py-5">
              <ShopFilters
                params={params}
                basePath={basePath}
                categories={categories}
                facets={facets}
                idPrefix="mob"
              />
            </div>
          </details>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted" aria-live="polite">
              {products.total} {products.total === 1 ? 'product' : 'products'}
              {products.totalPages > 1 ? ` · page ${products.page} of ${products.totalPages}` : ''}
            </p>
            <SortSelect id="sort" />
          </div>

          <ActiveFilters params={params} basePath={basePath} />

          {products.items.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title="Nothing here yet"
                description="We have not listed anything in this section — try browsing the full shop instead."
                action={
                  <Link href="/shop" className="btn btn-primary">
                    View all products
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="mt-8">
              <ProductGrid density={settings.theme.gridDensity}>
                {products.items.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    settings={settings}
                    priority={index < 4}
                    inquireHref={
                      settings.theme.productCard.showInquireButton
                        ? buildInquiryLink({
                            contact: settings.contact,
                            siteUrl: origin,
                            product: { name: product.name, url: `${origin}/products/${product.slug}` },
                          }).href
                        : null
                    }
                  />
                ))}
              </ProductGrid>

              <Pagination
                page={products.page}
                totalPages={products.totalPages}
                basePath={basePath}
                searchParams={paginationSearch}
                className="mt-14"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
