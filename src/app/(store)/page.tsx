import type { Metadata } from 'next';
import Link from 'next/link';

import { HomeSections } from '@/components/storefront/home-sections';
import { ProductCard, ProductGrid } from '@/components/storefront/product-card';
import { SectionHeading } from '@/components/ui/misc';
import { IconArrowRight } from '@/components/ui/icons';
import { buildInquiryLink } from '@/lib/inquiry';
import { getFeaturedCollections, getPublicCategories } from '@/lib/queries/catalog';
import { getHomeSections } from '@/lib/queries/content';
import { listProducts } from '@/lib/queries/products';
import { getSettings } from '@/lib/settings';
import { siteOrigin } from '@/lib/site';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.seo.defaultTitle || settings.brand.name,
    description: settings.seo.defaultDescription || settings.brand.tagline || settings.brand.description || undefined,
    alternates: { canonical: '/' },
  };
}

export default async function HomePage() {
  const settings = await getSettings();
  const sections = await getHomeSections();

  if (sections.some((section) => section.enabled)) {
    return <HomeSections sections={sections} settings={settings} />;
  }

  return <DefaultHome settings={settings} />;
}

/** Shown until the admin builds the homepage in the CMS. */
async function DefaultHome({ settings }: { settings: Awaited<ReturnType<typeof getSettings>> }) {
  const origin = siteOrigin(settings.seo.siteUrl);
  const [newArrivals, bestSellers, collections, categories] = await Promise.all([
    listProducts({ newArrivals: true, sort: 'newest', perPage: 8 }),
    listProducts({ bestSellers: true, sort: 'best-sellers', perPage: 4 }),
    getFeaturedCollections(3),
    getPublicCategories(),
  ]);

  const railSettings = settings;

  return (
    <>
      <section className="relative isolate flex min-h-[62vh] items-end overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/60" aria-hidden="true" />
        <span aria-hidden="true" className="absolute inset-0 bg-black/35" />
        <div className="container-site relative z-10 py-16 text-white sm:py-24">
          <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-white/75">
            Filipino fashion, made to move with you
          </p>
          <h1 className="max-w-4xl font-display text-[clamp(2.4rem,7vw,5rem)] leading-[0.95]">
            {settings.brand.name}
          </h1>
          {settings.brand.tagline ? (
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85">{settings.brand.tagline}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn btn-accent">
              Shop the collection
              <IconArrowRight size={16} />
            </Link>
            <Link href="/new-arrivals" className="btn btn-outline border-white/70 text-white hover:border-white hover:bg-white hover:text-ink">
              New arrivals
            </Link>
          </div>
        </div>
      </section>

      {newArrivals.items.length > 0 ? (
        <section className="container-site py-14 sm:py-20">
          <SectionHeading
            eyebrow="Just landed"
            title="New arrivals"
            action={
              <Link href="/new-arrivals" className="group inline-flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.18em] hover:text-accent">
                View all
                <IconArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            }
          />
          <ProductGrid density={railSettings.theme.gridDensity}>
            {newArrivals.items.slice(0, 8).map((product, index) => (
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
        </section>
      ) : null}

      {categories.length > 0 ? (
        <section className="container-site py-14 sm:py-20">
          <SectionHeading eyebrow="Browse" title="Shop by category" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="group flex items-center justify-between border border-line bg-surface px-6 py-7 transition hover:border-ink"
              >
                <span className="font-display text-xl">{category.name}</span>
                <IconArrowRight
                  size={18}
                  className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent"
                />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {collections.length > 0 ? (
        <section className="container-site py-14 sm:py-20">
          <SectionHeading
            eyebrow="Curated"
            title="Collections"
            action={
              <Link href="/collections" className="group inline-flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.18em] hover:text-accent">
                All collections
                <IconArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            }
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="flex flex-col justify-between border border-line bg-surface p-6 transition hover:border-ink"
              >
                <div>
                  <h3 className="font-display text-2xl">{collection.name}</h3>
                  {collection.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted">{collection.description}</p>
                  ) : null}
                </div>
                <p className="mt-6 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-accent">
                  {collection.productCount ?? 0} pieces
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {bestSellers.items.length > 0 ? (
        <section className="container-site py-14 sm:py-20">
          <SectionHeading
            eyebrow="Loved by many"
            title="Best sellers"
            action={
              <Link href="/best-sellers" className="group inline-flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.18em] hover:text-accent">
                View all
                <IconArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            }
          />
          <ProductGrid density="3">
            {bestSellers.items.map((product) => (
              <ProductCard key={product.id} product={product} settings={settings} />
            ))}
          </ProductGrid>
        </section>
      ) : null}
    </>
  );
}
