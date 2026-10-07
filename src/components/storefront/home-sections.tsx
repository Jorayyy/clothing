import Image from 'next/image';
import Link from 'next/link';

import { InquiryButton } from '@/components/storefront/inquiry-button';
import { NewsletterForm } from '@/components/storefront/newsletter-form';
import { ProductCard, ProductGrid } from '@/components/storefront/product-card';
import { IconArrowRight, SocialIcon } from '@/components/ui/icons';
import { buildGeneralInquiryLink, buildInquiryLink } from '@/lib/inquiry';
import {
  brandStorySectionSchema,
  categoryGridSectionSchema,
  contactSectionSchema,
  editorialSectionSchema,
  featuredCollectionsSectionSchema,
  heroSectionSchema,
  imageTextSectionSchema,
  newsletterSectionSchema,
  productRailSectionSchema,
  promoBannerSectionSchema,
  serviceInfoSectionSchema,
  socialShowcaseSectionSchema,
} from '@/lib/home-sections';
import { getMediaByIds } from '@/lib/media';
import { getFeaturedCollections, getPublicCategories } from '@/lib/queries/catalog';
import type { ResolvedSection } from '@/lib/queries/content';
import { listProducts } from '@/lib/queries/products';
import type { Settings } from '@/lib/settings';
import { siteOrigin } from '@/lib/site';
import { cn } from '@/lib/utils';

interface SectionsProps {
  sections: ResolvedSection[];
  settings: Settings;
}


export async function HomeSections({ sections, settings }: SectionsProps) {
  const origin = siteOrigin(settings.seo.siteUrl);

  const rendered = await Promise.all(
    sections.filter((section) => section.enabled).map((section) => renderSection(section, settings, origin)),
  );

  return <>{rendered.filter(Boolean)}</>;
}

async function renderSection(
  section: ResolvedSection,
  settings: Settings,
  origin: string,
): Promise<React.ReactNode> {
  switch (section.type) {
    case 'hero':
      return <HeroSection section={section} />;
    case 'productRail':
      return <ProductRailSection section={section} settings={settings} origin={origin} />;
    case 'featuredCollections':
      return <FeaturedCollectionsSection section={section} />;
    case 'categoryGrid':
      return <CategoryGridSection section={section} />;
    case 'editorial':
      return <EditorialSection section={section} />;
    case 'imageText':
      return <ImageTextSection section={section} />;
    case 'promoBanner':
      return <PromoBannerSection section={section} />;
    case 'brandStory':
      return <BrandStorySection section={section} settings={settings} />;
    case 'socialShowcase':
      return <SocialShowcaseSection section={section} settings={settings} />;
    case 'contact':
      return <ContactSection section={section} settings={settings} origin={origin} />;
    case 'newsletter':
      return <NewsletterSection section={section} />;
    case 'serviceInfo':
      return <ServiceInfoSection section={section} settings={settings} />;
    default:
      return null;
  }
}

/* ---------------------------------------------------------------- hero */

const HERO_HEIGHT = {
  short: 'min-h-[360px] h-[52vh]',
  medium: 'min-h-[440px] h-[64vh]',
  tall: 'min-h-[540px] h-[80vh]',
} as const;

async function HeroSection({ section }: { section: ResolvedSection }) {
  const config = heroSectionSchema.parse(section.config);
  const [desktop, mobile] = await getMediaByIds([config.imageMediaId, config.imageMobileMediaId].filter(Boolean) as string[]);
  const desktopMedia = config.imageMediaId ? desktop : null;
  const mobileMedia = config.imageMobileMediaId ? mobile : null;

  const hasImage = Boolean(desktopMedia?.url);
  const overlay =
    config.overlayStrength === 'strong'
      ? 'bg-black/55'
      : config.overlayStrength === 'soft'
        ? 'bg-black/30'
        : 'bg-transparent';

  const alignText = config.alignment === 'center' ? 'items-center text-center' : 'items-start text-left';

  return (
    <section
      className={cn('relative isolate flex w-full items-center overflow-hidden bg-primary', HERO_HEIGHT[config.height])}
    >
      {hasImage ? (
        <>
          {desktopMedia?.url ? (
            <Image
              src={desktopMedia.url}
              alt={desktopMedia.alt || section.title}
              fill
              priority
              sizes="100vw"
              className={cn('hidden object-cover sm:block', {
                'object-center': config.imagePosition === 'center',
                'object-top': config.imagePosition === 'top',
                'object-bottom': config.imagePosition === 'bottom',
              })}
            />
          ) : null}
          {mobileMedia?.url ? (
            <Image
              src={mobileMedia.url}
              alt={mobileMedia.alt || section.title}
              fill
              priority
              sizes="100vw"
              className="object-cover sm:hidden"
            />
          ) : null}
          <span aria-hidden="true" className={cn('absolute inset-0', overlay)} />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/70" />
      )}

      <div className={cn('container-site relative z-10 flex flex-col py-16', alignText)}>
        {config.eyebrow ? (
          <p
            className={cn(
              'mb-4 text-[0.7rem] font-bold uppercase tracking-[0.28em]',
              config.overlayStrength === 'none' && !hasImage ? 'text-on-primary/70' : 'text-white/80',
            )}
          >
            {config.eyebrow}
          </p>
        ) : null}
        {config.heading ? (
          <h1
            className={cn(
              'max-w-4xl font-display leading-[0.95]',
              config.alignment === 'center' ? 'mx-auto text-[clamp(2.4rem,7vw,5rem)]' : 'text-[clamp(2.2rem,6vw,4.5rem)]',
              config.overlayStrength === 'none' && !hasImage ? 'text-on-primary' : 'text-white',
            )}
          >
            {config.heading}
          </h1>
        ) : null}
        {config.subheading ? (
          <p
            className={cn(
              'mt-5 max-w-xl text-base leading-relaxed',
              config.alignment === 'center' && 'mx-auto',
              config.overlayStrength === 'none' && !hasImage ? 'text-on-primary/80' : 'text-white/85',
            )}
          >
            {config.subheading}
          </p>
        ) : null}

        {config.ctaLabel || config.secondaryLabel ? (
          <div
            className={cn(
              'mt-8 flex flex-wrap gap-3',
              config.alignment === 'center' && 'justify-center',
            )}
          >
            {config.ctaLabel && config.ctaHref ? (
              <Link href={config.ctaHref} className="btn btn-accent">
                {config.ctaLabel}
                <IconArrowRight size={16} />
              </Link>
            ) : null}
            {config.secondaryLabel && config.secondaryHref ? (
              <Link
                href={config.secondaryHref}
                className="btn btn-outline border-white/70 text-white hover:border-white hover:bg-white hover:text-ink"
              >
                {config.secondaryLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* -------------------------------------------------------- product rail */

async function ProductRailSection({
  section,
  settings,
  origin,
}: {
  section: ResolvedSection;
  settings: Settings;
  origin: string;
}) {
  const config = productRailSectionSchema.parse(section.config);

  let query: Parameters<typeof listProducts>[0] = { sort: 'newest', perPage: config.limit };
  let ctaHref = config.ctaHref || '/shop';

  if (config.source === 'best') {
    query = { sort: 'best-sellers', perPage: config.limit };
    ctaHref = '/best-sellers';
  } else if (config.source === 'featured') {
    query = { featured: true, sort: 'featured', perPage: config.limit };
  } else if (config.source === 'category' && config.categorySlug) {
    query = { categorySlug: config.categorySlug, sort: 'newest', perPage: config.limit };
    ctaHref = `/shop?category=${config.categorySlug}`;
  } else if (config.source === 'collection' && config.collectionSlug) {
    query = { collectionSlug: config.collectionSlug, sort: 'newest', perPage: config.limit };
    ctaHref = `/collections/${config.collectionSlug}`;
  } else {
    query = { newArrivals: true, sort: 'newest', perPage: config.limit };
    ctaHref = '/new-arrivals';
  }

  const products = await listProducts(query);
  if (products.items.length === 0) return null;

  const density = config.limit <= 4 ? '3' : settings.theme.gridDensity;

  return (
    <section className="container-site py-14 sm:py-20">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <h2 className="section-title text-[clamp(1.6rem,3vw,2.4rem)]">{config.title || section.title}</h2>
          {config.subtitle ? <p className="mt-2.5 max-w-xl text-sm text-muted">{config.subtitle}</p> : null}
        </div>
        {config.ctaLabel ? (
          <Link href={ctaHref} className="group inline-flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.18em] transition-colors hover:text-accent">
            {config.ctaLabel}
            <IconArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        ) : null}
      </div>

      <ProductGrid density={density as '2' | '3' | '4'}>
        {products.items.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            settings={settings}
            priority={index < 4}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
  );
}

/* --------------------------------------------------- featured collections */

async function FeaturedCollectionsSection({ section }: { section: ResolvedSection }) {
  const config = featuredCollectionsSectionSchema.parse(section.config);
  const collections = await getFeaturedCollections(config.limit);
  if (collections.length === 0) return null;

  const columns = config.columns === '2' ? 'sm:grid-cols-2' : config.columns === '4' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="container-site py-14 sm:py-20">
      <div className="mb-7">
        <h2 className="section-title text-[clamp(1.6rem,3vw,2.4rem)]">{config.title || section.title}</h2>
        {config.subtitle ? <p className="mt-2.5 max-w-xl text-sm text-muted">{config.subtitle}</p> : null}
      </div>

      <div className={cn('grid gap-5', columns)}>
        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={`/collections/${collection.slug}`}
            className="group relative isolate flex aspect-[4/5] items-end overflow-hidden bg-surface"
          >
            {collection.coverImage ? (
              <Image
                src={collection.coverImage.url}
                alt={collection.coverImage.alt || collection.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent/60" />
            )}
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="relative z-10 w-full p-5 text-white">
              <h3 className="font-display text-2xl leading-tight">{collection.name}</h3>
              {collection.description ? (
                <p className="mt-1.5 line-clamp-2 text-sm text-white/80">{collection.description}</p>
              ) : null}
              {config.showProductCount ? (
                <p className="mt-2.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/75">
                  {collection.productCount ?? 0} pieces
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ categories */

async function CategoryGridSection({ section }: { section: ResolvedSection }) {
  const config = categoryGridSectionSchema.parse(section.config);
  const categories = await getPublicCategories();
  const visible = categories.slice(0, config.limit);
  if (visible.length === 0) return null;

  const columns =
    config.columns === '2' ? 'sm:grid-cols-2' : config.columns === '4' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="container-site py-14 sm:py-20">
      <div className="mb-7">
        <h2 className="section-title text-[clamp(1.6rem,3vw,2.4rem)]">{config.title || section.title}</h2>
        {config.subtitle ? <p className="mt-2.5 max-w-xl text-sm text-muted">{config.subtitle}</p> : null}
      </div>

      <div className={cn('grid gap-5', columns)}>
        {visible.map((category) => (
          <Link
            key={category.id}
            href={`/shop?category=${category.slug}`}
            className={cn(
              'group flex items-center justify-between gap-4 border border-line bg-surface p-5 transition hover:border-ink',
              config.layout === 'image' && 'relative isolate aspect-[4/3] items-end overflow-hidden border-0 p-5',
            )}
          >
            {config.layout === 'image' && category.image ? (
              <>
                <Image
                  src={category.image.url}
                  alt={category.image.alt || category.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
              </>
            ) : null}

            <div className={cn('relative z-10', config.layout === 'image' && 'text-white')}>
              <h3 className={cn('font-display text-xl', config.layout === 'image' && 'text-white')}>
                {category.name}
              </h3>
              {category.productCount !== undefined && category.productCount > 0 ? (
                <p className={cn('mt-1 text-xs uppercase tracking-[0.16em]', config.layout === 'image' ? 'text-white/75' : 'text-muted')}>
                  {category.productCount} products
                </p>
              ) : null}
            </div>

            <IconArrowRight
              size={18}
              className={cn(
                'relative z-10 shrink-0 transition-transform group-hover:translate-x-1',
                config.layout === 'image' ? 'text-white' : 'text-muted group-hover:text-accent',
              )}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- editorial */

const EDITORIAL_TONE = {
  light: 'bg-surface text-ink',
  dark: 'bg-primary text-on-primary',
  accent: 'bg-accent text-on-accent',
} as const;

const ASPECT_CLASS = {
  portrait: 'aspect-[4/5]',
  landscape: 'aspect-[4/3]',
  square: 'aspect-square',
} as const;

async function EditorialSection({ section }: { section: ResolvedSection }) {
  const config = editorialSectionSchema.parse(section.config);
  const [media] = await getMediaByIds(config.imageMediaId ? [config.imageMediaId] : []);
  const isDark = config.tone !== 'light';

  return (
    <section className={cn('px-0 py-0', EDITORIAL_TONE[config.tone])}>
      <div
        className={cn(
          'mx-auto grid max-w-[1440px] items-stretch',
          config.imagePosition === 'right' ? 'lg:grid-cols-[1.05fr_1fr]' : 'lg:grid-cols-[1fr_1.05fr]',
        )}
      >
        <div className={cn('order-1', config.imagePosition === 'right' && 'lg:order-2')}>
          {media?.url ? (
            <div className={cn('relative w-full', ASPECT_CLASS[config.mediaAspect])}>
              <Image
                src={media.url}
                alt={media.alt || section.title}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className={cn('h-full min-h-64 w-full bg-ink/10', ASPECT_CLASS[config.mediaAspect])} />
          )}
        </div>

        <div className="order-2 flex items-center px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
          <div className="max-w-xl">
            {config.eyebrow ? (
              <p className={cn('mb-4 text-[0.7rem] font-bold uppercase tracking-[0.26em]', isDark ? 'opacity-70' : 'text-accent')}>
                {config.eyebrow}
              </p>
            ) : null}
            {config.heading ? (
              <h2 className="font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-[1.05]">{config.heading}</h2>
            ) : null}
            {config.body ? (
              <p className={cn('mt-5 whitespace-pre-line text-[0.98rem] leading-relaxed', isDark ? 'opacity-85' : 'text-muted')}>
                {config.body}
              </p>
            ) : null}
            {config.ctaLabel && config.ctaHref ? (
              <Link
                href={config.ctaHref}
                className={cn(
                  'btn mt-7',
                  isDark ? 'border-current bg-transparent text-current hover:bg-current/10' : 'btn-outline',
                )}
              >
                {config.ctaLabel}
                <IconArrowRight size={16} />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ image+text */

async function ImageTextSection({ section }: { section: ResolvedSection }) {
  const config = imageTextSectionSchema.parse(section.config);
  const [media] = await getMediaByIds(config.imageMediaId ? [config.imageMediaId] : []);

  return (
    <section className="container-site py-14 sm:py-20">
      <div
        className={cn(
          'grid items-center gap-8 lg:grid-cols-2 lg:gap-14',
          config.imagePosition === 'right' && 'lg:[&>*:first-child]:order-2',
        )}
      >
        <div className={cn('relative w-full', ASPECT_CLASS[config.mediaAspect])}>
          {media?.url ? (
            <Image
              src={media.url}
              alt={media.alt || section.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-surface" />
          )}
        </div>

        <div>
          {config.eyebrow ? <p className="eyebrow mb-4">{config.eyebrow}</p> : null}
          {config.heading ? <h2 className="section-title text-[clamp(1.7rem,3vw,2.6rem)]">{config.heading}</h2> : null}
          {config.body ? (
            <p className="mt-5 whitespace-pre-line text-[0.98rem] leading-relaxed text-muted">{config.body}</p>
          ) : null}
          {config.ctaLabel && config.ctaHref ? (
            <Link href={config.ctaHref} className="btn btn-outline mt-7">
              {config.ctaLabel}
              <IconArrowRight size={16} />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- promo banner */

const PROMO_TONE = {
  image: 'bg-primary text-on-primary',
  accent: 'bg-accent text-on-accent',
  ink: 'bg-primary text-on-primary',
  surface: 'bg-surface text-ink border border-line',
} as const;

async function PromoBannerSection({ section }: { section: ResolvedSection }) {
  const config = promoBannerSectionSchema.parse(section.config);
  const [media] = await getMediaByIds(config.imageMediaId ? [config.imageMediaId] : []);

  return (
    <section className={cn('py-12 sm:py-16', config.layout === 'full' ? '' : 'container-site')}>
      <div className={cn('relative isolate overflow-hidden', PROMO_TONE[config.tone])}>
        {config.tone === 'image' && media?.url ? (
          <>
            <Image
              src={media.url}
              alt={media.alt || section.title}
              fill
              sizes="100vw"
              className="object-cover"
            />
            <span aria-hidden="true" className="absolute inset-0 bg-black/55" />
          </>
        ) : null}

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center sm:py-20">
          {config.heading ? (
            <h2 className="font-display text-[clamp(1.9rem,4vw,3.2rem)] leading-tight">{config.heading}</h2>
          ) : null}
          {config.body ? <p className="mt-4 max-w-xl text-[0.98rem] leading-relaxed opacity-85">{config.body}</p> : null}
          {config.ctaLabel && config.ctaHref ? (
            <Link
              href={config.ctaHref}
              className={cn(
                'btn mt-7',
                config.tone === 'surface' ? 'btn-primary' : 'border border-current bg-transparent text-current hover:bg-current/10',
              )}
            >
              {config.ctaLabel}
              <IconArrowRight size={16} />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- brand story */

function BrandStorySection({ section, settings }: { section: ResolvedSection; settings: Settings }) {
  const config = brandStorySectionSchema.parse(section.config);
  const steps = settings.store.orderingSteps;

  return (
    <section className="container-site py-14 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        {config.eyebrow ? <p className="eyebrow mb-4">{config.eyebrow}</p> : null}
        <h2 className="section-title text-[clamp(1.8rem,3.4vw,2.8rem)]">{config.heading || section.title}</h2>
        {config.paragraphs.length > 0 ? (
          <div className="mt-6 space-y-4">
            {config.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-[0.98rem] leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}
        {config.ctaLabel && config.ctaHref ? (
          <Link href={config.ctaHref} className="btn btn-outline mt-7">
            {config.ctaLabel}
            <IconArrowRight size={16} />
          </Link>
        ) : null}
      </div>

      {config.showOrderingSteps && steps.length > 0 ? (
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="border-t border-line pt-5">
              <span className="font-display text-3xl text-accent">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-[0.95rem] font-semibold">{step.title}</h3>
              {step.detail ? <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.detail}</p> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------ social showcase */

async function SocialShowcaseSection({ section, settings }: { section: ResolvedSection; settings: Settings }) {
  const config = socialShowcaseSectionSchema.parse(section.config);
  const media = await getMediaByIds(config.mediaIds);
  const images = media.filter((item): item is NonNullable<typeof item> => Boolean(item?.url));
  const links = config.useSiteSocialLinks ? settings.social.links.filter((link) => link.enabled && link.href) : [];

  if (images.length === 0 && links.length === 0) return null;

  const columns =
    config.columns === '2' ? 'grid-cols-2' : config.columns === '4' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3';

  return (
    <section className="container-site py-14 sm:py-20">
      <div className="mb-7 text-center">
        <h2 className="section-title text-[clamp(1.6rem,3vw,2.4rem)]">{config.title || section.title}</h2>
        {config.caption ? <p className="mx-auto mt-2.5 max-w-xl text-sm text-muted">{config.caption}</p> : null}
      </div>

      {images.length > 0 ? (
        <div className={cn('grid gap-3', columns)}>
          {images.map((item) => (
            <div key={item.id} className="relative aspect-square overflow-hidden bg-surface">
              <Image
                src={item.url}
                alt={item.alt || 'Social post'}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          ))}
        </div>
      ) : null}

      {links.length > 0 ? (
        <ul className="mt-7 flex flex-wrap justify-center gap-3">
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-outline"
              >
                <SocialIcon platform={link.platform} size={16} />
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/* -------------------------------------------------------------- contact */

function ContactSection({
  section,
  settings,
  origin,
}: {
  section: ResolvedSection;
  settings: Settings;
  origin: string;
}) {
  const config = contactSectionSchema.parse(section.config);
  const inquiry = buildGeneralInquiryLink({ contact: settings.contact, siteUrl: origin });

  return (
    <section className="bg-primary py-16 text-on-primary sm:py-20">
      <div className="container-site flex flex-col items-center text-center">
        <h2 className="max-w-2xl font-display text-[clamp(1.9rem,4vw,3rem)] leading-tight">
          {config.heading || section.title}
        </h2>
        {config.body ? <p className="mt-4 max-w-xl text-[0.98rem] leading-relaxed opacity-80">{config.body}</p> : null}

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {config.showMessenger ? (
            <InquiryButton
              href={inquiry.href}
              label={config.buttonLabel}
              message={inquiry.message}
              note={config.note || inquiry.note}
              variant="accent"
              showNote={false}
            />
          ) : null}
          {config.showFacebook && settings.contact.facebookPageUrl ? (
            <a
              href={settings.contact.facebookPageUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-outline border-white/60 text-white hover:border-white hover:bg-white hover:text-ink"
            >
              <SocialIcon platform="facebook" size={16} />
              Facebook page
            </a>
          ) : null}
          {config.showContactPage ? (
            <Link
              href="/contact"
              className="btn btn-outline border-white/60 text-white hover:border-white hover:bg-white hover:text-ink"
            >
              Contact details
            </Link>
          ) : null}
        </div>

        {config.note ? <p className="mt-4 max-w-md text-xs leading-relaxed text-white/60">{config.note}</p> : null}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- newsletter */

function NewsletterSection({ section }: { section: ResolvedSection }) {
  const config = newsletterSectionSchema.parse(section.config);

  return (
    <section className="container-site py-14 sm:py-20">
      <div className="mx-auto flex max-w-2xl flex-col items-center border border-line bg-surface px-6 py-12 text-center">
        <h2 className="section-title text-[clamp(1.6rem,3vw,2.4rem)]">{config.heading || section.title}</h2>
        {config.body ? <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">{config.body}</p> : null}
        <div className="mt-7 w-full">
          <NewsletterForm
            buttonLabel={config.buttonLabel}
            successMessage={config.successMessage}
            consentNote={config.consentNote}
          />
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- service info */

function ServiceInfoSection({ section, settings }: { section: ResolvedSection; settings: Settings }) {
  const config = serviceInfoSectionSchema.parse(section.config);
  const { store } = settings;
  const payments = store.paymentMethods.filter((method) => method.enabled);
  const hours = store.businessHours;

  return (
    <section className="container-site py-14 sm:py-20">
      <div className="mb-8 text-center">
        <h2 className="section-title text-[clamp(1.6rem,3vw,2.4rem)]">{config.heading || section.title}</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {config.showOrderingSteps ? (
          <div className="border border-line bg-surface p-6">
            <h3 className="eyebrow mb-4">How to order</h3>
            <ol className="space-y-4">
              {store.orderingSteps.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="font-display text-xl text-accent">{index + 1}</span>
                  <div>
                    <p className="text-sm font-semibold">{step.title}</p>
                    {step.detail ? <p className="mt-1 text-sm leading-relaxed text-muted">{step.detail}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {config.showPayments && payments.length > 0 ? (
          <div className="border border-line bg-surface p-6">
            <h3 className="eyebrow mb-4">Payment</h3>
            <ul className="flex flex-wrap gap-2">
              {payments.map((method) => (
                <li key={method.id} className="tag tag-outline">
                  {method.label}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-muted">{store.paymentNote}</p>
          </div>
        ) : null}

        {config.showHours ? (
          <div className="border border-line bg-surface p-6">
            <h3 className="eyebrow mb-4">Business hours</h3>
            <dl className="space-y-2 text-sm">
              {hours.map((row) => (
                <div key={row.day} className="flex items-baseline justify-between gap-4 border-b border-line/70 pb-2">
                  <dt className="text-muted">{row.day}</dt>
                  <dd className={cn('text-right', row.closed && 'text-muted')}>{row.closed ? 'Closed' : row.hours}</dd>
                </div>
              ))}
            </dl>
            {store.serviceNote ? <p className="mt-4 text-sm leading-relaxed text-muted">{store.serviceNote}</p> : null}
          </div>
        ) : null}
      </div>

      {config.showDelivery && config.deliveryNote ? (
        <p className="mx-auto mt-8 max-w-2xl border-l-2 border-accent pl-5 text-sm leading-relaxed text-muted">
          {config.deliveryNote}
        </p>
      ) : null}
    </section>
  );
}
