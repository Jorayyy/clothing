import { z } from 'zod';

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex color, e.g. #14120F');

const slug = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only');

const url = z
  .string()
  .max(500)
  .refine((value) => value === '' || /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(value), {
    message: 'Must be a full URL or a path starting with /',
  });

export const brandSettingsSchema = z.object({
  name: z.string().min(1).max(80).default('MicsApparel'),
  wordmark: z.string().min(1).max(60).default('MICSAPPAREL'),
  tagline: z.string().max(160).default(''),
  description: z.string().max(400).default(''),
  logoMediaId: z.string().nullable().default(null),
  faviconMediaId: z.string().nullable().default(null),
});

export const themeSettingsSchema = z.object({
  colors: z
    .object({
      background: hexColor.default('#F4F0E9'),
      surface: hexColor.default('#FFFFFF'),
      text: hexColor.default('#15130F'),
      muted: hexColor.default('#6C645A'),
      primary: hexColor.default('#15130F'),
      onPrimary: hexColor.default('#F7F5F1'),
      accent: hexColor.default('#DD4B22'),
      onAccent: hexColor.default('#FFFFFF'),
      border: hexColor.default('#DDD6CB'),
      sale: hexColor.default('#B0341A'),
    })
    .prefault({}),
  fontPreset: z.enum(['editorial', 'grotesque', 'contrast']).default('editorial'),
  layoutWidth: z.enum(['narrow', 'regular', 'wide']).default('regular'),
  gridDensity: z.enum(['2', '3', '4']).default('3'),
  radius: z.enum(['none', 'sm', 'md', 'lg', 'full']).default('none'),
  buttonShape: z.enum(['square', 'rounded', 'pill']).default('square'),
  buttonStyle: z.enum(['solid', 'outline', 'underline']).default('solid'),
  headerLayout: z.enum(['centered', 'split', 'minimal']).default('split'),
  footerLayout: z.enum(['columns', 'stacked', 'compact']).default('columns'),
  productCard: z
    .object({
      imageRatio: z.enum(['portrait', 'square', 'tall']).default('portrait'),
      hoverEffect: z.enum(['zoom', 'swap', 'none']).default('zoom'),
      showLabel: z.boolean().default(true),
      showCategory: z.boolean().default(false),
      showInquireButton: z.boolean().default(false),
    })
    .prefault({}),
  productPage: z
    .object({
      gallery: z.enum(['stacked', 'thumbnails']).default('thumbnails'),
      infoPosition: z.enum(['left', 'right']).default('right'),
      showRelated: z.boolean().default(true),
      showRecentlyViewed: z.boolean().default(true),
    })
    .prefault({}),
});

export const announcementSchema = z.object({
  enabled: z.boolean().default(false),
  text: z.string().max(200).default(''),
  linkLabel: z.string().max(60).default(''),
  linkHref: url.default(''),
});

export const paymentMethodSchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().min(1).max(60),
  enabled: z.boolean().default(true),
});

export const storeSettingsSchema = z.object({
  currency: z.enum(['PHP']).default('PHP'),
  announcement: announcementSchema.prefault({}),
  paymentMethods: z
    .array(paymentMethodSchema)
    .default([
      { id: 'gcash', label: 'GCash', enabled: true },
      { id: 'maya', label: 'Maya', enabled: true },
      { id: 'bank', label: 'Bank transfer', enabled: true },
      { id: 'cod', label: 'Cash on delivery', enabled: false },
      { id: 'cod-ph', label: 'COD (selected areas)', enabled: false },
    ]),
  paymentNote: z
    .string()
    .max(400)
    .default(
      'Payments and order confirmation are handled directly with our team — never through this website.',
    ),
  businessHours: z
    .array(
      z.object({
        day: z.string().min(1).max(20),
        hours: z.string().max(60).default(''),
        closed: z.boolean().default(false),
      }),
    )
    .default([
      { day: 'Monday – Friday', hours: '10:00 AM – 7:00 PM', closed: false },
      { day: 'Saturday', hours: '10:00 AM – 6:00 PM', closed: false },
      { day: 'Sunday', hours: '', closed: true },
    ]),
  orderingSteps: z
    .array(z.object({ title: z.string().min(1).max(80), detail: z.string().max(300).default('') }))
    .default([
      { title: 'Browse the collection', detail: 'Pick a style, size and colour you love.' },
      { title: 'Tap Inquire', detail: 'We open Messenger with your item details ready.' },
      { title: 'Confirm with our team', detail: 'We confirm stock, payment and delivery with you.' },
      { title: 'Receive your order', detail: 'We ship nationwide across the Philippines.' },
    ]),
  serviceNote: z.string().max(400).default(''),
});

export const socialLinkSchema = z.object({
  id: z.string().min(1).max(40),
  platform: z.enum(['facebook', 'instagram', 'tiktok', 'x', 'youtube', 'shopee', 'lazada', 'custom']),
  label: z.string().min(1).max(60),
  href: url,
  enabled: z.boolean().default(true),
});

export const contactDestinationSchema = z.object({
  id: z.string().min(1).max(40),
  channel: z.enum(['messenger', 'facebook', 'instagram', 'tiktok', 'email', 'phone', 'viber', 'whatsapp']),
  label: z.string().min(1).max(60),
  value: z.string().max(300).default(''),
  enabled: z.boolean().default(true),
  primary: z.boolean().default(false),
});

export const contactSettingsSchema = z.object({
  email: z.string().max(200).default(''),
  phone: z.string().max(60).default(''),
  address: z.string().max(300).default(''),
  messengerPageUsername: z
    .string()
    .max(100)
    .default('')
    .describe('Facebook page username used to build m.me links'),
  facebookPageUrl: url.default(''),
  responseTimeNote: z.string().max(200).default(''),
  destinations: z.array(contactDestinationSchema).default([]),
});

export const socialSettingsSchema = z.object({
  links: z.array(socialLinkSchema).default([]),
  showcaseMediaIds: z.array(z.string()).default([]),
  showcaseCaption: z.string().max(240).default(''),
});

export const seoSettingsSchema = z.object({
  siteUrl: z.string().max(300).default(''),
  titleTemplate: z.string().max(120).default('%s | MicsApparel'),
  defaultTitle: z.string().max(120).default('MicsApparel'),
  defaultDescription: z.string().max(300).default(''),
  ogImageMediaId: z.string().nullable().default(null),
  twitterHandle: z.string().max(40).default(''),
  robotsEnabled: z.boolean().default(true),
});

export const settingsSchema = z.object({
  brand: brandSettingsSchema.prefault({}),
  theme: themeSettingsSchema.prefault({}),
  store: storeSettingsSchema.prefault({}),
  contact: contactSettingsSchema.prefault({}),
  social: socialSettingsSchema.prefault({}),
  seo: seoSettingsSchema.prefault({}),
});

export type Settings = z.infer<typeof settingsSchema>;
export type BrandSettings = z.infer<typeof brandSettingsSchema>;
export type ThemeSettings = z.infer<typeof themeSettingsSchema>;
export type StoreSettings = z.infer<typeof storeSettingsSchema>;
export type ContactSettings = z.infer<typeof contactSettingsSchema>;
export type SocialSettings = z.infer<typeof socialSettingsSchema>;
export type SeoSettings = z.infer<typeof seoSettingsSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema>;
export type ContactDestination = z.infer<typeof contactDestinationSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const SETTINGS_KEYS = ['brand', 'theme', 'store', 'contact', 'social', 'seo'] as const;
export type SettingsKey = (typeof SETTINGS_KEYS)[number];

export { slug as slugSchema, url as urlSchema, hexColor };
