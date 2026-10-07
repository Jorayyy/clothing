export type FieldKind = 'text' | 'textarea' | 'select' | 'number' | 'boolean' | 'media' | 'mediaList' | 'lines';

export interface FieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  options?: { value: string; label: string }[];
  hint?: string;
}

const columns = {
  key: 'columns',
  label: 'Columns',
  kind: 'select' as const,
  options: [
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
  ],
};

const limit = { key: 'limit', label: 'Items', kind: 'number' as const, hint: '1–24' };

const cta = [
  { key: 'ctaLabel', label: 'Button label', kind: 'text' as const },
  { key: 'ctaHref', label: 'Button link', kind: 'text' as const, hint: '/shop or https://…' },
];

const imageField = { key: 'imageMediaId', label: 'Image', kind: 'media' as const };

export const SECTION_FIELDS: Record<string, FieldSpec[]> = {
  hero: [
    imageField,
    { key: 'imageMobileMediaId', label: 'Mobile image', kind: 'media' },
    { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
    { key: 'heading', label: 'Heading', kind: 'text' },
    { key: 'subheading', label: 'Subheading', kind: 'textarea' },
    ...cta,
    { key: 'secondaryLabel', label: 'Secondary label', kind: 'text' },
    { key: 'secondaryHref', label: 'Secondary link', kind: 'text' },
    {
      key: 'alignment',
      label: 'Alignment',
      kind: 'select',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Centre' },
      ],
    },
    {
      key: 'height',
      label: 'Height',
      kind: 'select',
      options: [
        { value: 'short', label: 'Short' },
        { value: 'medium', label: 'Medium' },
        { value: 'tall', label: 'Tall' },
      ],
    },
    {
      key: 'overlayStrength',
      label: 'Overlay',
      kind: 'select',
      options: [
        { value: 'none', label: 'None' },
        { value: 'soft', label: 'Soft' },
        { value: 'strong', label: 'Strong' },
      ],
    },
    {
      key: 'imagePosition',
      label: 'Image position',
      kind: 'select',
      options: [
        { value: 'center', label: 'Centre' },
        { value: 'top', label: 'Top' },
        { value: 'bottom', label: 'Bottom' },
      ],
    },
  ],
  productRail: [
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'subtitle', label: 'Subtitle', kind: 'text' },
    {
      key: 'source',
      label: 'Source',
      kind: 'select',
      options: [
        { value: 'new', label: 'New arrivals' },
        { value: 'best', label: 'Best sellers' },
        { value: 'featured', label: 'Featured' },
        { value: 'category', label: 'One category' },
        { value: 'collection', label: 'One collection' },
      ],
    },
    { key: 'categorySlug', label: 'Category handle', kind: 'text', hint: 'Used when source is category' },
    { key: 'collectionSlug', label: 'Collection handle', kind: 'text', hint: 'Used when source is collection' },
    limit,
    ...cta,
  ],
  featuredCollections: [
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'subtitle', label: 'Subtitle', kind: 'text' },
    limit,
    columns,
    { key: 'showProductCount', label: 'Show product count', kind: 'boolean' },
  ],
  categoryGrid: [
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'subtitle', label: 'Subtitle', kind: 'text' },
    limit,
    columns,
    {
      key: 'layout',
      label: 'Layout',
      kind: 'select',
      options: [
        { value: 'image', label: 'Image tiles' },
        { value: 'text', label: 'Text only' },
      ],
    },
  ],
  editorial: [
    imageField,
    { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
    { key: 'heading', label: 'Heading', kind: 'text' },
    { key: 'body', label: 'Body', kind: 'textarea' },
    ...cta,
    {
      key: 'imagePosition',
      label: 'Image side',
      kind: 'select',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ],
    },
    {
      key: 'tone',
      label: 'Tone',
      kind: 'select',
      options: [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'accent', label: 'Accent' },
      ],
    },
    {
      key: 'mediaAspect',
      label: 'Aspect',
      kind: 'select',
      options: [
        { value: 'portrait', label: 'Portrait' },
        { value: 'landscape', label: 'Landscape' },
        { value: 'square', label: 'Square' },
      ],
    },
  ],
  imageText: [
    imageField,
    { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
    { key: 'heading', label: 'Heading', kind: 'text' },
    { key: 'body', label: 'Body', kind: 'textarea' },
    ...cta,
    {
      key: 'imagePosition',
      label: 'Image side',
      kind: 'select',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ],
    },
    {
      key: 'mediaAspect',
      label: 'Aspect',
      kind: 'select',
      options: [
        { value: 'portrait', label: 'Portrait' },
        { value: 'landscape', label: 'Landscape' },
        { value: 'square', label: 'Square' },
      ],
    },
  ],
  promoBanner: [
    imageField,
    { key: 'heading', label: 'Heading', kind: 'text' },
    { key: 'body', label: 'Body', kind: 'textarea' },
    ...cta,
    {
      key: 'tone',
      label: 'Tone',
      kind: 'select',
      options: [
        { value: 'image', label: 'Image background' },
        { value: 'accent', label: 'Accent' },
        { value: 'ink', label: 'Ink' },
        { value: 'surface', label: 'Surface' },
      ],
    },
    {
      key: 'layout',
      label: 'Layout',
      kind: 'select',
      options: [
        { value: 'full', label: 'Full width' },
        { value: 'contained', label: 'Contained' },
      ],
    },
  ],
  brandStory: [
    { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
    { key: 'heading', label: 'Heading', kind: 'text' },
    { key: 'paragraphs', label: 'Paragraphs', kind: 'lines', hint: 'One per line, up to 6' },
    ...cta,
    { key: 'showOrderingSteps', label: 'Show ordering steps', kind: 'boolean' },
  ],
  socialShowcase: [
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'caption', label: 'Caption', kind: 'text' },
    { key: 'mediaIds', label: 'Images', kind: 'mediaList', hint: 'Up to 8' },
    columns,
    { key: 'useSiteSocialLinks', label: 'Link to social profiles', kind: 'boolean' },
  ],
  contact: [
    { key: 'heading', label: 'Heading', kind: 'text' },
    { key: 'body', label: 'Body', kind: 'textarea' },
    { key: 'buttonLabel', label: 'Button label', kind: 'text' },
    { key: 'note', label: 'Note under the buttons', kind: 'text' },
    { key: 'showMessenger', label: 'Show Messenger button', kind: 'boolean' },
    { key: 'showFacebook', label: 'Show Facebook button', kind: 'boolean' },
    { key: 'showContactPage', label: 'Show contact link', kind: 'boolean' },
  ],
  newsletter: [
    { key: 'heading', label: 'Heading', kind: 'text' },
    { key: 'body', label: 'Body', kind: 'textarea' },
    { key: 'consentNote', label: 'Consent note', kind: 'text' },
    { key: 'buttonLabel', label: 'Button label', kind: 'text' },
    { key: 'successMessage', label: 'Success message', kind: 'text' },
  ],
  serviceInfo: [
    { key: 'heading', label: 'Heading', kind: 'text' },
    { key: 'showPayments', label: 'Show payment methods', kind: 'boolean' },
    { key: 'showHours', label: 'Show business hours', kind: 'boolean' },
    { key: 'showOrderingSteps', label: 'Show ordering steps', kind: 'boolean' },
    { key: 'showDelivery', label: 'Show delivery note', kind: 'boolean' },
    { key: 'deliveryNote', label: 'Delivery note', kind: 'textarea' },
  ],
};

/** Values are coerced here so the config that reaches the server is typed. */
export function readConfigValue(
  spec: FieldSpec,
  raw: FormDataEntryValue | null,
): unknown {
  switch (spec.kind) {
    case 'number': {
      const value = Number(raw ?? 0);
      return Number.isFinite(value) ? Math.trunc(value) : 0;
    }
    case 'boolean':
      return raw === '1';
    case 'lines':
      return String(raw ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    case 'mediaList':
      try {
        const parsed = JSON.parse(String(raw ?? '[]')) as unknown;
        return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
      } catch {
        return [];
      }
    default:
      return String(raw ?? '');
  }
}
