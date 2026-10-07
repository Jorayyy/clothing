import { z } from 'zod';

/**
 * Catalogue of homepage sections the admin can add, reorder and configure.
 * Each section owns its own config schema so the builder stays type-safe and
 * the storefront renderers only ever see validated data.
 */

const mediaId = z.string().nullable().default(null);
const shortText = z.string().max(140).default('');
const longText = z.string().max(600).default('');
const href = z
  .string()
  .max(300)
  .default('')
  .refine((value) => value === '' || value.startsWith('/') || /^https?:\/\//i.test(value), {
    message: 'Use a path starting with / or a full https:// URL',
  });
const positive = z.number().int().min(1).max(24);

export const heroSectionSchema = z.object({
  imageMediaId: mediaId,
  imageMobileMediaId: mediaId,
  eyebrow: shortText,
  heading: z.string().max(140).default(''),
  subheading: longText,
  ctaLabel: z.string().max(60).default(''),
  ctaHref: href,
  secondaryLabel: z.string().max(60).default(''),
  secondaryHref: href,
  alignment: z.enum(['left', 'center']).default('left'),
  height: z.enum(['short', 'medium', 'tall']).default('medium'),
  overlayStrength: z.enum(['none', 'soft', 'strong']).default('soft'),
  imagePosition: z.enum(['center', 'top', 'bottom']).default('center'),
});

export const productRailSectionSchema = z.object({
  title: z.string().max(120).default(''),
  subtitle: z.string().max(200).default(''),
  source: z.enum(['new', 'best', 'featured', 'category', 'collection']).default('new'),
  categorySlug: z.string().max(120).default(''),
  collectionSlug: z.string().max(120).default(''),
  limit: positive.default(8),
  ctaLabel: z.string().max(60).default('Shop all'),
  ctaHref: href.default('/shop'),
});

export const featuredCollectionsSectionSchema = z.object({
  title: z.string().max(120).default(''),
  subtitle: z.string().max(200).default(''),
  limit: positive.default(3),
  columns: z.enum(['2', '3', '4']).default('3'),
  showProductCount: z.boolean().default(true),
});

export const categoryGridSectionSchema = z.object({
  title: z.string().max(120).default(''),
  subtitle: z.string().max(200).default(''),
  limit: positive.default(6),
  columns: z.enum(['2', '3', '4']).default('3'),
  layout: z.enum(['image', 'text']).default('image'),
});

export const editorialSectionSchema = z.object({
  imageMediaId: mediaId,
  eyebrow: shortText,
  heading: z.string().max(140).default(''),
  body: z.string().max(1200).default(''),
  ctaLabel: z.string().max(60).default(''),
  ctaHref: href,
  imagePosition: z.enum(['left', 'right']).default('right'),
  tone: z.enum(['light', 'dark', 'accent']).default('light'),
  mediaAspect: z.enum(['portrait', 'landscape', 'square']).default('portrait'),
});

export const promoBannerSectionSchema = z.object({
  imageMediaId: mediaId,
  heading: z.string().max(140).default(''),
  body: z.string().max(400).default(''),
  ctaLabel: z.string().max(60).default(''),
  ctaHref: href,
  tone: z.enum(['image', 'accent', 'ink', 'surface']).default('image'),
  layout: z.enum(['full', 'contained']).default('contained'),
});

export const brandStorySectionSchema = z.object({
  eyebrow: shortText,
  heading: z.string().max(140).default(''),
  paragraphs: z.array(z.string().max(700)).max(6).default([]),
  ctaLabel: z.string().max(60).default(''),
  ctaHref: href,
  showOrderingSteps: z.boolean().default(false),
});

export const socialShowcaseSectionSchema = z.object({
  title: z.string().max(120).default(''),
  caption: z.string().max(240).default(''),
  mediaIds: z.array(z.string()).max(8).default([]),
  columns: z.enum(['2', '3', '4']).default('4'),
  useSiteSocialLinks: z.boolean().default(true),
});

export const contactSectionSchema = z.object({
  heading: z.string().max(140).default(''),
  body: z.string().max(500).default(''),
  showMessenger: z.boolean().default(true),
  showFacebook: z.boolean().default(true),
  showContactPage: z.boolean().default(true),
  buttonLabel: z.string().max(60).default('Inquire via Messenger'),
  note: z.string().max(300).default(''),
});

export const newsletterSectionSchema = z.object({
  heading: z.string().max(140).default(''),
  body: z.string().max(400).default(''),
  consentNote: z.string().max(300).default(''),
  buttonLabel: z.string().max(60).default('Subscribe'),
  successMessage: z.string().max(240).default('You are on the list — thank you!'),
});

export const serviceInfoSectionSchema = z.object({
  heading: z.string().max(140).default(''),
  showPayments: z.boolean().default(true),
  showHours: z.boolean().default(true),
  showOrderingSteps: z.boolean().default(true),
  showDelivery: z.boolean().default(false),
  deliveryNote: z.string().max(400).default(''),
});

export const imageTextSectionSchema = z.object({
  imageMediaId: mediaId,
  eyebrow: shortText,
  heading: z.string().max(140).default(''),
  body: z.string().max(1000).default(''),
  ctaLabel: z.string().max(60).default(''),
  ctaHref: href,
  imagePosition: z.enum(['left', 'right']).default('left'),
  mediaAspect: z.enum(['portrait', 'landscape', 'square']).default('landscape'),
});

export type SectionType =
  | 'hero'
  | 'productRail'
  | 'featuredCollections'
  | 'categoryGrid'
  | 'editorial'
  | 'imageText'
  | 'promoBanner'
  | 'brandStory'
  | 'socialShowcase'
  | 'contact'
  | 'newsletter'
  | 'serviceInfo';

interface SectionDefinition<TType extends SectionType = SectionType> {
  type: TType;
  label: string;
  description: string;
  title?: string;
  defaultEnabled: boolean;
  schema: z.ZodTypeAny;
  parse(raw: unknown): unknown;
}

function define<TType extends SectionType>(
  definition: Omit<SectionDefinition<TType>, 'parse'>,
): SectionDefinition<TType> {
  return {
    ...definition,
    parse: (raw: unknown) => definition.schema.parse(raw ?? {}),
  };
}

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  define({
    type: 'hero',
    label: 'Hero / campaign',
    description: 'Large campaign image with headline and call to action.',
    title: 'MicsApparel',
    defaultEnabled: true,
    schema: heroSectionSchema,
  }),
  define({
    type: 'productRail',
    label: 'Product rail',
    description: 'A row of products: new arrivals, best sellers, a category or collection.',
    title: 'New arrivals',
    defaultEnabled: true,
    schema: productRailSectionSchema,
  }),
  define({
    type: 'featuredCollections',
    label: 'Featured collections',
    description: 'Showcases collections marked as featured.',
    title: 'Collections',
    defaultEnabled: true,
    schema: featuredCollectionsSectionSchema,
  }),
  define({
    type: 'categoryGrid',
    label: 'Category navigation',
    description: 'Grid of published categories for quick browsing.',
    title: 'Shop by category',
    defaultEnabled: true,
    schema: categoryGridSectionSchema,
  }),
  define({
    type: 'editorial',
    label: 'Editorial block',
    description: 'Split image-and-text block for storytelling.',
    title: 'The edit',
    defaultEnabled: false,
    schema: editorialSectionSchema,
  }),
  define({
    type: 'imageText',
    label: 'Image + text',
    description: 'Wide image paired with a short passage.',
    title: '',
    defaultEnabled: false,
    schema: imageTextSectionSchema,
  }),
  define({
    type: 'promoBanner',
    label: 'Promotional banner',
    description: 'Full-width or contained banner for drops and promos.',
    title: '',
    defaultEnabled: false,
    schema: promoBannerSectionSchema,
  }),
  define({
    type: 'brandStory',
    label: 'Brand story',
    description: 'Editable story block with optional ordering steps.',
    title: 'About the label',
    defaultEnabled: true,
    schema: brandStorySectionSchema,
  }),
  define({
    type: 'socialShowcase',
    label: 'Social showcase',
    description: 'Grid of chosen media with links to your social profiles.',
    title: 'On the feed',
    defaultEnabled: false,
    schema: socialShowcaseSectionSchema,
  }),
  define({
    type: 'contact',
    label: 'Facebook / Messenger',
    description: 'Primary conversion block that sends visitors to chat.',
    title: 'Talk to us',
    defaultEnabled: true,
    schema: contactSectionSchema,
  }),
  define({
    type: 'newsletter',
    label: 'Newsletter signup',
    description: 'Optional email capture (disabled unless you turn it on).',
    title: 'Stay in the loop',
    defaultEnabled: false,
    schema: newsletterSectionSchema,
  }),
  define({
    type: 'serviceInfo',
    label: 'Payment & delivery info',
    description: 'Payment methods, business hours and ordering steps.',
    title: 'Good to know',
    defaultEnabled: false,
    schema: serviceInfoSectionSchema,
  }),
];

export const SECTION_TYPE_VALUES = SECTION_DEFINITIONS.map((definition) => definition.type);

export function getSectionDefinition(type: string): SectionDefinition | undefined {
  return SECTION_DEFINITIONS.find((definition) => definition.type === type);
}

export function defaultConfigFor(type: string): Record<string, unknown> {
  const definition = getSectionDefinition(type);
  if (!definition) return {};
  return definition.parse({}) as Record<string, unknown>;
}

export function defaultTitleFor(type: string): string {
  return getSectionDefinition(type)?.title ?? '';
}

/** Validates a section config, falling back to defaults on bad input. */
export function parseSectionConfig(type: string, raw: unknown): Record<string, unknown> {
  const definition = getSectionDefinition(type);
  if (!definition) return {};
  const result = definition.schema.safeParse(raw ?? {});
  if (result.success) return result.data as Record<string, unknown>;
  console.error(`[sections] invalid config for "${type}":`, result.error.issues);
  return defaultConfigFor(type);
}

/** Throws a readable error when the admin submits an invalid config. */
export function assertValidSectionConfig(type: string, raw: unknown): void {
  const definition = getSectionDefinition(type);
  if (!definition) throw new Error(`Unknown section type: ${type}`);
  const result = definition.schema.safeParse(raw ?? {});
  if (!result.success) {
    throw new Error(result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '));
  }
}
