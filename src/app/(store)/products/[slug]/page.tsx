import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProductCard, ProductGrid } from '@/components/storefront/product-card';
import { ProductGallery } from '@/components/storefront/product-gallery';
import { RecentlyViewed } from '@/components/storefront/recently-viewed';
import { RichContent } from '@/components/storefront/rich-content';
import { VariantPicker } from '@/components/storefront/variant-picker';
import { SocialIcon } from '@/components/ui/icons';
import { SectionHeading } from '@/components/ui/misc';
import { formatPrice } from '@/lib/format';
import { buildShareLinks } from '@/lib/inquiry';
import { getRelatedProducts, getProductBySlug } from '@/lib/queries/products';
import { getSettings } from '@/lib/settings';
import { absoluteUrl, siteOrigin } from '@/lib/site';
import { cn } from '@/lib/utils';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product not found' };

  const title = product.seoTitle || product.name;
  const description = product.seoDescription || product.summary || product.description.slice(0, 160) || undefined;

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: 'website',
      title,
      description,
      images: product.image ? [{ url: product.image.url, alt: product.image.alt || product.name }] : undefined,
    },
  };
}

const DETAIL_ROWS: { key: 'sku' | 'material' | 'fit' | 'measurements' | 'care'; label: string }[] = [
  { key: 'sku', label: 'SKU' },
  { key: 'material', label: 'Material' },
  { key: 'fit', label: 'Fit' },
  { key: 'measurements', label: 'Measurements' },
  { key: 'care', label: 'Care' },
];

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const settings = await getSettings();
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const origin = siteOrigin(settings.seo.siteUrl);
  const productUrl = absoluteUrl(`/products/${product.slug}`, origin);
  const related = settings.theme.productPage.showRelated
    ? await getRelatedProducts(product, 4)
    : [];

  const shareLinks = buildShareLinks(productUrl, product.name);
  const onSale = product.compareAt !== null && product.compareAt > product.price;
  const infoOnRight = settings.theme.productPage.infoPosition === 'right';

  const detailValues = DETAIL_ROWS.filter((row) => product[row.key]).map((row) => ({
    label: row.label,
    value: product[row.key] as string,
  }));

  const richContent = product.richContent ?? [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: product.name,
        description: product.summary || product.description || undefined,
        sku: product.sku ?? undefined,
        url: productUrl,
        image: product.gallery.map((image) => image.url),
        brand: { '@type': 'Brand', name: settings.brand.name },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'PHP',
          price: (product.price / 100).toFixed(2),
          availability: 'https://schema.org/InStock',
          url: productUrl,
        },
      },
      {
        '@type': 'Organization',
        name: settings.brand.name,
        url: origin,
        sameSite: settings.social.links.filter((link) => link.enabled && link.href).map((link) => link.href),
      },
    ],
  };

  return (
    <div className="container-site py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs uppercase tracking-[0.16em] text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="transition-colors hover:text-accent">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/shop" className="transition-colors hover:text-accent">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink">{product.name}</li>
        </ol>
      </nav>

      <div
        className={cn(
          'grid gap-8 lg:grid-cols-2 lg:gap-14',
          !infoOnRight && 'lg:[&>*:first-child]:order-2',
        )}
      >
        <div>
          <ProductGallery
            images={product.gallery.map((image) => ({ url: image.url, alt: image.alt }))}
            layout={settings.theme.productPage.gallery}
            name={product.name}
          />
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            {product.categorySlugs.slice(0, 1).map((categorySlug) => (
              <Link
                key={categorySlug}
                href={`/shop?category=${categorySlug}`}
                className="tag tag-outline transition hover:border-accent hover:text-accent"
              >
                {categorySlug.replace(/-/g, ' ')}
              </Link>
            ))}
            {product.labels.slice(0, 2).map((label) => (
              <span
                key={label}
                className={cn(
                  'tag',
                  label.toLowerCase() === 'sale'
                    ? 'tag-sale'
                    : label.toLowerCase() === 'new'
                      ? 'tag-accent'
                      : '',
                )}
              >
                {label}
              </span>
            ))}
          </div>

          <h1 className="mt-4 font-display text-[clamp(1.8rem,3.4vw,2.8rem)] leading-[1.05]">
            {product.name}
          </h1>

          {product.summary ? (
            <p className="mt-3 text-[0.98rem] leading-relaxed text-muted">{product.summary}</p>
          ) : null}

          <p className="mt-4 flex flex-wrap items-baseline gap-3 lg:hidden">
            <span className={cn('text-2xl font-semibold tabular-nums', onSale && 'text-sale')}>
              {formatPrice(product.price)}
            </span>
            {onSale ? (
              <span className="text-sm text-muted line-through">{formatPrice(product.compareAt)}</span>
            ) : null}
          </p>

          <div className="mt-6">
            <VariantPicker
              attributes={product.attributes}
              variants={product.variants}
              basePrice={product.price}
              baseCompareAt={product.compareAt}
              productName={product.name}
              productSlug={product.slug}
              contact={settings.contact}
              siteUrl={origin}
            />
          </div>

          {detailValues.length > 0 ? (
            <dl className="mt-7 border-t border-line pt-5 text-sm">
              {detailValues.map((row) => (
                <div key={row.label} className="flex gap-4 border-b border-line/70 py-2.5">
                  <dt className="w-32 shrink-0 text-muted">{row.label}</dt>
                  <dd className="text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="uppercase tracking-[0.16em]">Share</span>
            {shareLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Share on ${link.label}`}
                className="flex h-9 w-9 items-center justify-center border border-line transition hover:border-accent hover:text-accent"
              >
                <SocialIcon platform={link.label.toLowerCase()} size={15} />
              </a>
            ))}
          </div>

          <div className="mt-6 border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
            <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ink">
              Ordering is arranged with our team
            </p>
            <p>{settings.store.paymentNote}</p>
            {settings.store.serviceNote ? <p className="mt-2">{settings.store.serviceNote}</p> : null}
            <Link href="/policies/shipping" className="mt-3 inline-block text-accent hover:underline">
              Shipping &amp; delivery details
            </Link>
          </div>
        </div>
      </div>

      {(product.description || richContent.length > 0) && (
        <section className="mt-14 border-t border-line pt-10">
          <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
            <h2 className="section-title text-[clamp(1.4rem,2.4vw,2rem)]">About this piece</h2>
            <div>
              {product.description ? (
                <p className="mb-6 max-w-2xl whitespace-pre-line text-[0.98rem] leading-relaxed text-muted">
                  {product.description}
                </p>
              ) : null}
              <RichContent blocks={richContent} />
            </div>
          </div>
        </section>
      )}

      {related.length > 0 ? (
        <section className="mt-16 border-t border-line pt-10">
          <SectionHeading eyebrow="Keep browsing" title="You may also like" />
          <ProductGrid density={settings.theme.gridDensity}>
            {related.map((item) => (
              <ProductCard key={item.id} product={item} settings={settings} />
            ))}
          </ProductGrid>
        </section>
      ) : null}

      {settings.theme.productPage.showRecentlyViewed ? (
        <RecentlyViewed
          current={{
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.image?.url ?? null,
          }}
        />
      ) : null}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
