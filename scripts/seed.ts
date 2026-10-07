import 'dotenv/config';

import fs from 'node:fs';
import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { hashPassword } from '../src/lib/auth/password-core';
import {
  adminUsers,
  categories,
  collectionProducts,
  collections,
  homeSections,
  media,
  navigationItems,
  pages,
  productAttributes,
  productCategories,
  productImages,
  products,
  productVariants,
  settings as settingsTable,
  type RichBlock,
} from '../src/lib/db/schema';
import { defaultConfigFor, defaultTitleFor } from '../src/lib/home-sections';
import { settingsSchema } from '../src/lib/settings/schema';
import { slugify } from '../src/lib/utils';

/* ------------------------------------------------------------------ */
/* Connection                                                          */
/* ------------------------------------------------------------------ */

type Db = ReturnType<typeof drizzlePglite>;

async function connect(): Promise<{ db: Db; close: () => Promise<void> }> {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString && /^postgres(ql)?:\/\//i.test(connectionString)) {
    const client = postgres(connectionString, { max: 1, prepare: false });
    const db = drizzlePostgres(client, { schema: undefined as never }) as unknown as Db;
    return {
      db,
      close: async () => {
        await client.end({ timeout: 5 });
      },
    };
  }

  const dataDir = process.env.PGLITE_DIR ?? path.join(process.cwd(), '.local', 'pg');
  fs.mkdirSync(dataDir, { recursive: true });
  const client = new PGlite({ dataDir });
  return {
    db: drizzlePglite(client) as unknown as Db,
    close: async () => {
      await client.close();
    },
  };
}

/* ------------------------------------------------------------------ */
/* Placeholder artwork                                                 */
/* ------------------------------------------------------------------ */

const PALETTES: [string, string, string][] = [
  ['#15130F', '#DD4B22', '#F4F0E9'],
  ['#DD4B22', '#15130F', '#F4F0E9'],
  ['#6C645A', '#F4F0E9', '#15130F'],
  ['#1F3A5F', '#DD4B22', '#F4F0E9'],
  ['#3F5E45', '#F4F0E9', '#15130F'],
  ['#8C3B2E', '#F4F0E9', '#15130F'],
];

function placeholderSvg(label: string, width: number, height: number, seed: number): string {
  const [bg, accent, text] = PALETTES[seed % PALETTES.length];
  const bandY = Math.round(height * 0.62);
  const bandH = Math.round(height * 0.16);
  const safeLabel = label
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const fontSize = Math.max(28, Math.round(width * 0.055));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${safeLabel}">
  <rect width="${width}" height="${height}" fill="${bg}"/>
  <circle cx="${Math.round(width * 0.78)}" cy="${Math.round(height * 0.24)}" r="${Math.round(width * 0.26)}" fill="${accent}" opacity="0.9"/>
  <rect x="0" y="${bandY}" width="${width}" height="${bandH}" fill="${accent}"/>
  <rect x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.36)}" width="${Math.round(width * 0.42)}" height="${Math.round(height * 0.2)}" fill="${text}" opacity="0.12"/>
  <text x="${Math.round(width * 0.08)}" y="${bandY + bandH / 2}" fill="${text}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" dominant-baseline="middle" letter-spacing="2">${safeLabel}</text>
  <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.9)}" fill="${text}" opacity="0.65" font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(fontSize * 0.42)}" letter-spacing="6">MICSAPPAREL</text>
</svg>
`;
}

const PLACEHOLDER_DIR = path.join(process.cwd(), 'public', 'placeholders');

function writePlaceholder(fileName: string, label: string, width: number, height: number, seed: number): string {
  fs.mkdirSync(PLACEHOLDER_DIR, { recursive: true });
  const svg = placeholderSvg(label, width, height, seed);
  fs.writeFileSync(path.join(PLACEHOLDER_DIR, fileName), svg, 'utf8');
  return `/placeholders/${fileName}`;
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const P = (pesos: number) => Math.round(pesos * 100);

interface SeedProduct {
  slug: string;
  name: string;
  summary: string;
  description: string;
  price: number;
  salePrice?: number;
  category: string;
  sizes?: string[];
  colors: string[];
  labels?: string[];
  featured?: boolean;
  isNew?: boolean;
  best?: boolean;
  material: string;
  fit: string;
}

const PRODUCT_DATA: SeedProduct[] = [
  {
    slug: 'boxed-tee',
    name: 'Boxed Tee',
    summary: 'A structured heavyweight tee with a boxy, relaxed cut.',
    description:
      'Cut from heavyweight cotton with a dry hand-feel. Dropped shoulders and a straight hem give it that boxy shape that works tucked or loose.',
    price: P(699),
    category: 'tops',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Sand', 'Black', 'Olive'],
    featured: true,
    isNew: true,
    material: '100% cotton, 220gsm',
    fit: 'Boxy, relaxed',
  },
  {
    slug: 'everyday-tee',
    name: 'Everyday Tee',
    summary: 'The tee you reach for first — soft, simple, runs true to size.',
    description:
      'A midweight jersey tee with a clean crew neck. Made to be worn on rotation, so it keeps its shape wash after wash.',
    price: P(549),
    category: 'tops',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Black', 'Clay'],
    best: true,
    material: '100% cotton, 180gsm',
    fit: 'Regular',
  },
  {
    slug: 'relaxed-shirt',
    name: 'Relaxed Camp Shirt',
    summary: 'An open-collar shirt for warm days and late nights.',
    description:
      'A short-sleeve camp collar shirt with a relaxed body and a curved hem. Breathes well in Manila heat and layers over a tee easily.',
    price: P(1099),
    category: 'tops',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Palm', 'Ecru'],
    isNew: true,
    material: 'Rayon blend',
    fit: 'Relaxed',
  },
  {
    slug: 'cargo-pants',
    name: 'Utility Cargo Pants',
    summary: 'Straight-leg cargos with six pockets and an adjustable hem.',
    description:
      'Built from a midweight ripstop with a straight leg. The side pockets sit flat when empty, so the silhouette stays clean.',
    price: P(1599),
    category: 'bottoms',
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Khaki', 'Black', 'Olive'],
    featured: true,
    best: true,
    material: 'Cotton ripstop',
    fit: 'Straight, mid-rise',
  },
  {
    slug: 'straight-denim',
    name: 'Straight Denim',
    summary: 'Rigid straight-leg jeans that break in with wear.',
    description:
      'A mid-rise straight leg in 12oz rigid denim. Expect them to soften and fade into your own shape over time.',
    price: P(1499),
    category: 'bottoms',
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Indigo', 'Washed Black'],
    material: '12oz cotton denim',
    fit: 'Straight',
  },
  {
    slug: 'lounge-shorts',
    name: 'Lounge Shorts',
    summary: 'Elastic-waist shorts with a lined interior.',
    description:
      'Easy shorts with a drawcord waist and side seam pockets. Light enough for the gym, tidy enough for a coffee run.',
    price: P(799),
    category: 'bottoms',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Charcoal', 'Sand'],
    isNew: true,
    material: 'Cotton fleece',
    fit: 'Relaxed',
  },
  {
    slug: 'slip-dress',
    name: 'Bias Slip Dress',
    summary: 'A bias-cut slip that skims the body without clinging.',
    description:
      'Cut on the bias so it moves with you. Adjustable straps and a mid-calf length make it easy to dress up or down.',
    price: P(1299),
    category: 'dresses',
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Ink', 'Champagne'],
    featured: true,
    material: 'Viscose satin',
    fit: 'Bias, body-skimming',
  },
  {
    slug: 'linen-midi-dress',
    name: 'Linen Midi Dress',
    summary: 'A breathable linen midi with side pockets.',
    description:
      'A relaxed midi in washed linen with a square neckline and hidden side pockets. Made for humid afternoons.',
    price: P(1699),
    category: 'dresses',
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Ecru', 'Terracotta'],
    best: true,
    material: '100% linen',
    fit: 'Relaxed',
  },
  {
    slug: 'coach-jacket',
    name: 'Coach Jacket',
    summary: 'A light snap-front jacket for sudden downpours.',
    description:
      'Water-resistant shell with a mesh lining and snap placket. Packs down small enough to live in your bag.',
    price: P(2299),
    category: 'outerwear',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Navy'],
    featured: true,
    material: 'Polyester twill',
    fit: 'Regular, layer-friendly',
  },
  {
    slug: 'knit-cardigan',
    name: 'Knit Cardigan',
    summary: 'A midweight cardigan with horn-look buttons.',
    description:
      'A slightly oversized knit that works as a layer over tees or under a coat. Ribbed cuffs and hem hold their shape.',
    price: P(1899),
    category: 'outerwear',
    sizes: ['S', 'M', 'L'],
    colors: ['Oat', 'Espresso'],
    material: 'Cotton-acrylic knit',
    fit: 'Oversized',
  },
  {
    slug: 'oversized-hoodie',
    name: 'Oversized Hoodie',
    summary: 'A heavyweight hoodie with a double-layer hood.',
    description:
      'Brushed-back fleece with a dropped shoulder and a deep kangaroo pocket. Warm without feeling stiff.',
    price: P(1999),
    salePrice: P(1699),
    category: 'outerwear',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Heather Grey', 'Black'],
    labels: ['Sale'],
    best: true,
    material: '80% cotton / 20% polyester, 380gsm',
    fit: 'Oversized',
  },
  {
    slug: 'woven-tote',
    name: 'Woven Market Tote',
    summary: 'A structured woven tote that holds its shape.',
    description:
      'A roomy tote with reinforced handles and an inner pocket. Flat base so it stands on its own.',
    price: P(899),
    category: 'accessories',
    colors: ['Natural', 'Black'],
    isNew: true,
    material: 'Woven cotton',
    fit: 'One size',
  },
  {
    slug: 'ribbed-beanie',
    name: 'Ribbed Beanie',
    summary: 'A fine-rib beanie with a folded cuff.',
    description:
      'Stretchy fine rib with a snug fit. Cuff can be folded once or twice depending on how you wear it.',
    price: P(499),
    category: 'accessories',
    colors: ['Black', 'Rust', 'Ecru'],
    material: 'Acrylic-wool blend',
    fit: 'One size',
  },
  {
    slug: 'corduroy-cap',
    name: 'Corduroy Cap',
    summary: 'A six-panel cord cap with an adjustable strap.',
    description:
      'Soft wide-wale corduroy with a curved brim and a brass slider at the back.',
    price: P(599),
    category: 'accessories',
    colors: ['Rust', 'Olive', 'Black'],
    labels: ['Limited'],
    material: 'Cotton corduroy',
    fit: 'One size, adjustable',
  },
];

const CATEGORY_DATA = [
  { slug: 'tops', name: 'Tops', description: 'Tees, shirts and everything that starts the outfit.' },
  { slug: 'bottoms', name: 'Bottoms', description: 'Denim, cargos and shorts cut for movement.' },
  { slug: 'dresses', name: 'Dresses', description: 'One-piece dressing for warm weather.' },
  { slug: 'outerwear', name: 'Outerwear', description: 'Layers for cold malls, colder offices and rain.' },
  { slug: 'accessories', name: 'Accessories', description: 'The finishing pieces.' },
];

const COLLECTION_DATA = [
  {
    slug: 'everyday-basics',
    name: 'Everyday Basics',
    description: 'The reliable pieces that carry the rest of your wardrobe.',
    featured: true,
    products: ['boxed-tee', 'everyday-tee', 'straight-denim', 'lounge-shorts'],
  },
  {
    slug: 'weekend-edit',
    name: 'Weekend Edit',
    description: 'Easy fits for slow mornings and long afternoons.',
    featured: true,
    products: ['relaxed-shirt', 'lounge-shorts', 'linen-midi-dress', 'woven-tote'],
  },
  {
    slug: 'rainy-day-kit',
    name: 'Rainy Day Kit',
    description: 'What to reach for when the sky opens up.',
    featured: false,
    products: ['coach-jacket', 'oversized-hoodie', 'ribbed-beanie'],
  },
];

const NAV_ITEMS: { menu: 'header' | 'footer'; label: string; href: string; kind?: string }[] = [
  { menu: 'header', label: 'Shop All', href: '/shop' },
  { menu: 'header', label: 'Clothing', href: '/shop', kind: 'categories' },
  { menu: 'header', label: 'New Arrivals', href: '/new-arrivals' },
  { menu: 'header', label: 'Best Sellers', href: '/best-sellers' },
  { menu: 'header', label: 'Collections', href: '/collections', kind: 'collections' },
  { menu: 'header', label: 'About', href: '/about' },
  { menu: 'header', label: 'Contact', href: '/contact' },
  { menu: 'footer', label: 'Shop All', href: '/shop' },
  { menu: 'footer', label: 'New Arrivals', href: '/new-arrivals' },
  { menu: 'footer', label: 'Best Sellers', href: '/best-sellers' },
  { menu: 'footer', label: 'Collections', href: '/collections' },
  { menu: 'footer', label: 'FAQ', href: '/faq' },
  { menu: 'footer', label: 'Contact', href: '/contact' },
];

function paragraph(text: string): RichBlock {
  return { type: 'paragraph', text };
}

function heading(text: string): RichBlock {
  return { type: 'heading', level: 2, text };
}

const POLICY_PAGES: {
  slug: string;
  title: string;
  seoDescription: string;
  content: RichBlock[];
}[] = [
  {
    slug: 'shipping',
    title: 'Shipping & delivery',
    seoDescription: 'How orders are confirmed, shipped and delivered across the Philippines.',
    content: [
      heading('How delivery works'),
      paragraph(
        'Every order is confirmed with you personally on Facebook Messenger before anything is packed. At that point we quote the delivery fee for your address and the estimated timeline for your area.',
      ),
      paragraph(
        'We ship across the Philippines. Timelines depend on the courier and your location, and we will always give you a realistic estimate before you send payment.',
      ),
      heading('Tracking your order'),
      paragraph(
        'Once your parcel is on its way, we share the tracking details in the same Messenger conversation. If anything looks delayed, message us and we will follow it up with the courier.',
      ),
    ],
  },
  {
    slug: 'returns',
    title: 'Returns & exchanges',
    seoDescription: 'What to do if something is not right with your order.',
    content: [
      heading('If something is not right'),
      paragraph(
        'Message us on Messenger as soon as you can, ideally with a photo of the item and your order reference. Because each order is arranged directly with our team, we confirm what is possible for your specific order rather than applying a blanket rule.',
      ),
      heading('What helps us help you'),
      paragraph(
        'Keep the item unworn, unwashed and complete with its tags. Send the reference from your order conversation so we can pull it up quickly.',
      ),
      heading('Items we cannot take back'),
      paragraph(
        'For hygiene and safety reasons, some items cannot be returned once opened or worn. We will tell you upfront, before you order, if that applies.',
      ),
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy policy',
    seoDescription: 'What information this site collects and how it is used.',
    content: [
      heading('What this site collects'),
      paragraph(
        'This website does not run advertising trackers. If you subscribe to the newsletter we store your email address. If you use the contact form we store the name, optional email address and message you type, so our team can reply.',
      ),
      paragraph(
        'Your browser stores a small amount of data locally — for example the list of products you recently viewed. That list stays in your browser and is never sent to our server.',
      ),
      heading('What we do with it'),
      paragraph(
        'We use the information you give us only to answer you, fulfil orders you ask for, and send updates you opted into. We do not sell your information.',
      ),
      heading('Asking us to remove your data'),
      paragraph(
        'Message us on Messenger or email us and we will delete the records we hold for you, including any newsletter subscription.',
      ),
    ],
  },
  {
    slug: 'terms',
    title: 'Terms & conditions',
    seoDescription: 'The terms that apply when you browse and order from this site.',
    content: [
      heading('How orders are formed'),
      paragraph(
        'Browsing this site does not create an order. An order is only confirmed when our team and you agree on the item, the payment arrangement and the delivery details in conversation.',
      ),
      heading('Prices and availability'),
      paragraph(
        'Prices are shown in Philippine pesos. Stock is confirmed with you during your conversation — if something sells out before we reply, we will offer you an alternative or cancel at no cost.',
      ),
      heading('Product information'),
      paragraph(
        'We describe and photograph each item as accurately as we can. Colours can look different depending on your screen, so ask us for extra photos if you are unsure.',
      ),
      heading('Questions'),
      paragraph(
        'Anything unclear, message us before ordering. We would rather answer a question twice than have you guess.',
      ),
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Seed                                                                */
/* ------------------------------------------------------------------ */

async function clearAll(db: Db): Promise<void> {
  const order = [
    'collection_products',
    'product_categories',
    'product_variants',
    'product_attributes',
    'product_images',
    'products',
    'collections',
    'categories',
    'home_sections',
    'navigation_items',
    'pages',
    'inquiries',
    'newsletter_subscribers',
    'media',
    'settings',
    'audit_logs',
    'rate_limits',
    'admin_users',
  ];
  for (const table of order) {
    await db.execute(sql.raw(`DELETE FROM ${table}`));
  }
}

async function seed(db: Db, options: { force: boolean }): Promise<void> {
  const existing = await db.select({ id: products.id }).from(products).limit(1);
  if (existing.length > 0 && !options.force) {
    console.log('Catalogue already seeded. Re-run with --force to wipe and reseed.');
    return;
  }
  if (existing.length > 0 && options.force) {
    await clearAll(db);
    console.log('Cleared existing data.');
  }

  /* -------------------------------------------------- settings */
  const adminEmail = (process.env.MICS_ADMIN_EMAIL ?? 'admin@micsapparel.ph').trim();
  const adminPassword = process.env.MICS_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const generatedPassword = !process.env.MICS_ADMIN_PASSWORD;

  const settings = settingsSchema.parse({
    brand: {
      name: 'MicsApparel',
      wordmark: 'MicsApparel',
      tagline: 'Everyday pieces, cut for the way you actually live.',
      description:
        'MicsApparel is a Filipino clothing label making straightforward, well-cut basics — tees, denim, easy dresses and layers built for warm weather and long days.',
    },
    announcement: {
      enabled: true,
      text: 'Free Metro Manila delivery on orders over ₱2,000',
      linkLabel: 'See details',
      linkHref: '/policies/shipping',
    },
    contact: {
      responseTimeNote: 'We reply Monday to Saturday, 10:00 AM to 7:00 PM',
    },
    seo: {
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? '',
      defaultTitle: 'MicsApparel',
      titleTemplate: '%s | MicsApparel',
      defaultDescription:
        'Filipino fashion basics — tees, denim, dresses and layers from MicsApparel. Orders are arranged with our team on Facebook Messenger.',
    },
    social: {
      links: [
        { id: 'facebook', platform: 'facebook', label: 'Facebook', href: '', enabled: false },
        { id: 'instagram', platform: 'instagram', label: 'Instagram', href: '', enabled: false },
        { id: 'tiktok', platform: 'tiktok', label: 'TikTok', href: '', enabled: false },
      ],
    },
  });

  for (const key of ['brand', 'theme', 'store', 'contact', 'social', 'seo'] as const) {
    await db
      .insert(settingsTable)
      .values({ key, value: settings[key] })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value: settings[key] } });
  }
  console.log('✓ settings');

  /* -------------------------------------------------- admin user */
  const passwordHash = await hashPassword(adminPassword);
  await db.insert(adminUsers).values({
    email: adminEmail,
    name: 'Store Owner',
    passwordHash,
    role: 'owner',
    status: 'active',
    tokenVersion: 0,
  });
  console.log(`✓ admin user (${adminEmail})`);
  if (generatedPassword) {
    console.log('');
    console.log('  ⚠ Default admin password in use.');
    console.log(`    email:    ${adminEmail}`);
    console.log(`    password: ${adminPassword}`);
    console.log('    Sign in and change it immediately, or re-seed with MICS_ADMIN_PASSWORD set.');
    console.log('');
  }

  /* -------------------------------------------------- media */
  const heroUrl = writePlaceholder('hero-campaign.svg', 'CAMPAIGN', 1600, 900, 0);
  const heroMedia = await db
    .insert(media)
    .values({
      url: heroUrl,
      storageKey: 'placeholders/hero-campaign.svg',
      fileName: 'hero-campaign.svg',
      mimeType: 'image/svg+xml',
      byteSize: fs.statSync(path.join(PLACEHOLDER_DIR, 'hero-campaign.svg')).size,
      width: 1600,
      height: 900,
      alt: 'MicsApparel campaign placeholder',
    })
    .returning();

  const mediaBySlug = new Map<string, string>();

  for (const [index, product] of PRODUCT_DATA.entries()) {
    const fileName = `${product.slug}.svg`;
    const url = writePlaceholder(fileName, product.name.toUpperCase(), 1200, 1600, index);
    const rows = await db
      .insert(media)
      .values({
        url,
        storageKey: `placeholders/${fileName}`,
        fileName,
        mimeType: 'image/svg+xml',
        byteSize: fs.statSync(path.join(PLACEHOLDER_DIR, fileName)).size,
        width: 1200,
        height: 1600,
        alt: `${product.name} — placeholder artwork`,
      })
      .returning();
    mediaBySlug.set(product.slug, rows[0]!.id);
  }

  const categoryMediaIds = new Map<string, string>();
  for (const [index, category] of CATEGORY_DATA.entries()) {
    const fileName = `category-${category.slug}.svg`;
    const url = writePlaceholder(fileName, category.name.toUpperCase(), 1200, 900, index + 2);
    const rows = await db
      .insert(media)
      .values({
        url,
        storageKey: `placeholders/${fileName}`,
        fileName,
        mimeType: 'image/svg+xml',
        byteSize: fs.statSync(path.join(PLACEHOLDER_DIR, fileName)).size,
        width: 1200,
        height: 900,
        alt: `${category.name} — placeholder artwork`,
      })
      .returning();
    categoryMediaIds.set(category.slug, rows[0]!.id);
  }

  const collectionMediaIds = new Map<string, string>();
  for (const [index, collection] of COLLECTION_DATA.entries()) {
    const fileName = `collection-${collection.slug}.svg`;
    const url = writePlaceholder(fileName, collection.name.toUpperCase(), 1200, 1500, index + 4);
    const rows = await db
      .insert(media)
      .values({
        url,
        storageKey: `placeholders/${fileName}`,
        fileName,
        mimeType: 'image/svg+xml',
        byteSize: fs.statSync(path.join(PLACEHOLDER_DIR, fileName)).size,
        width: 1200,
        height: 1500,
        alt: `${collection.name} — placeholder artwork`,
      })
      .returning();
    collectionMediaIds.set(collection.slug, rows[0]!.id);
  }
  console.log(`✓ media (${2 + PRODUCT_DATA.length + CATEGORY_DATA.length + COLLECTION_DATA.length} files)`);

  /* -------------------------------------------------- categories */
  const categoryIds = new Map<string, string>();
  for (const [index, category] of CATEGORY_DATA.entries()) {
    const rows = await db
      .insert(categories)
      .values({
        slug: category.slug,
        name: category.name,
        description: category.description,
        imageId: categoryMediaIds.get(category.slug) ?? null,
        position: index,
        status: 'published',
      })
      .returning();
    categoryIds.set(category.slug, rows[0]!.id);
  }
  console.log(`✓ categories (${CATEGORY_DATA.length})`);

  /* -------------------------------------------------- products */
  const productIds = new Map<string, string>();
  for (const [index, product] of PRODUCT_DATA.entries()) {
    const rows = await db
      .insert(products)
      .values({
        slug: product.slug,
        name: product.name,
        summary: product.summary,
        description: product.description,
        price: product.price,
        salePrice: product.salePrice ?? null,
        compareAtPrice: product.salePrice ? product.price : null,
        label: product.labels?.join(' ') ?? '',
        status: 'published',
        featured: product.featured ?? false,
        isNewArrival: product.isNew ?? false,
        isBestSeller: product.best ?? false,
        trackStock: false,
        stockQuantity: 0,
        material: product.material,
        fit: product.fit,
        publishedAt: new Date(),
        createdAt: new Date(Date.now() - index * 86_400_000),
      })
      .returning();
    const productId = rows[0]!.id;
    productIds.set(product.slug, productId);

    await db.insert(productCategories).values({
      productId,
      categoryId: categoryIds.get(product.category)!,
    });

    const imageId = mediaBySlug.get(product.slug)!;
    await db.insert(productImages).values({
      productId,
      mediaId: imageId,
      alt: `${product.name} — placeholder artwork`,
      position: 0,
    });

    if (product.sizes && product.sizes.length > 0) {
      await db.insert(productAttributes).values({
        productId,
        key: 'size',
        name: 'Size',
        values: product.sizes,
        position: 0,
      });
      await db.insert(productAttributes).values({
        productId,
        key: 'color',
        name: 'Colour',
        values: product.colors,
        position: 1,
      });

      const variants = [];
      let position = 0;
      for (const color of product.colors) {
        for (const size of product.sizes) {
          variants.push({
            productId,
            name: `${color} / ${size}`,
            sku: `${product.slug}-${slugify(size)}-${slugify(color)}`.toUpperCase(),
            price: null,
            options: { color, size } as Record<string, string>,
            trackStock: false,
            stockQuantity: 0,
            position: position++,
          });
        }
      }
      await db.insert(productVariants).values(variants);
    } else {
      await db.insert(productAttributes).values({
        productId,
        key: 'color',
        name: 'Colour',
        values: product.colors,
        position: 0,
      });
      await db.insert(productVariants).values(
        product.colors.map((color, position) => ({
          productId,
          name: color,
          sku: `${product.slug}-${slugify(color)}`.toUpperCase(),
          price: null,
          options: { color } as Record<string, string>,
          trackStock: false,
          stockQuantity: 0,
          position,
        })),
      );
    }
  }
  console.log(`✓ products (${PRODUCT_DATA.length})`);

  /* -------------------------------------------------- collections */
  for (const [index, collection] of COLLECTION_DATA.entries()) {
    const rows = await db
      .insert(collections)
      .values({
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        coverImageId: collectionMediaIds.get(collection.slug) ?? null,
        isFeatured: collection.featured,
        selectionMode: 'manual',
        rules: [],
        position: index,
        status: 'published',
      })
      .returning();
    const collectionId = rows[0]!.id;
    await db.insert(collectionProducts).values(
      collection.products
        .filter((slug) => productIds.has(slug))
        .map((slug, position) => ({
          collectionId,
          productId: productIds.get(slug)!,
          position,
        })),
    );
  }
  console.log(`✓ collections (${COLLECTION_DATA.length})`);

  /* -------------------------------------------------- navigation */
  await db.insert(navigationItems).values(
    NAV_ITEMS.map((item, index) => ({
      menu: item.menu,
      label: item.label,
      href: item.href,
      kind: item.kind ?? 'link',
      position: index,
      enabled: true,
      openInNewTab: false,
    })),
  );
  console.log(`✓ navigation (${NAV_ITEMS.length} items)`);

  /* -------------------------------------------------- pages */
  await db.insert(pages).values(
    POLICY_PAGES.map((page) => ({
      slug: page.slug,
      title: page.title,
      content: page.content,
      status: 'published' as const,
      showInFooter: true,
      seoTitle: page.title,
      seoDescription: page.seoDescription,
      publishedAt: new Date(),
    })),
  );
  console.log(`✓ pages (${POLICY_PAGES.length} policies)`);

  /* -------------------------------------------------- homepage sections */
  const sectionSpecs: { type: string; enabled?: boolean; config?: Record<string, unknown> }[] = [
    {
      type: 'hero',
      config: {
        imageMediaId: heroMedia[0]!.id,
        eyebrow: 'New season, same standards',
        heading: 'Cut for the way you actually live',
        subheading:
          'Straightforward basics, made in small runs and arranged with us directly — no checkout, no waiting on a cart.',
        ctaLabel: 'Shop the collection',
        ctaHref: '/shop',
        secondaryLabel: 'New arrivals',
        secondaryHref: '/new-arrivals',
        alignment: 'left',
        height: 'medium',
        overlayStrength: 'soft',
      },
    },
    {
      type: 'productRail',
      config: { ...defaultConfigFor('productRail'), title: 'New arrivals', source: 'new', ctaHref: '/new-arrivals' },
    },
    {
      type: 'categoryGrid',
      config: { ...defaultConfigFor('categoryGrid'), title: 'Shop by category', columns: '3', layout: 'image' },
    },
    {
      type: 'featuredCollections',
      config: { ...defaultConfigFor('featuredCollections'), title: 'Collections', columns: '3' },
    },
    {
      type: 'brandStory',
      config: {
        ...defaultConfigFor('brandStory'),
        eyebrow: 'About the label',
        heading: 'Built in the Philippines, for everyday wear',
        paragraphs: [
          'MicsApparel started with a simple frustration: clothes that look good online and fall apart after a few washes.',
          'We cut small runs, fit them on real people, and only list what we would wear ourselves. Everything you see here is arranged directly with our team, so sizes, stock and delivery are confirmed with you before you pay.',
        ],
        ctaLabel: 'Read our story',
        ctaHref: '/about',
        showOrderingSteps: true,
      },
    },
    { type: 'productRail', config: { ...defaultConfigFor('productRail'), title: 'Best sellers', source: 'best', ctaHref: '/best-sellers' } },
    {
      type: 'contact',
      config: { ...defaultConfigFor('contact'), heading: 'Talk to us before you order', showContactPage: true },
    },
    { type: 'serviceInfo', config: { ...defaultConfigFor('serviceInfo'), heading: 'Good to know' } },
  ];

  await db.insert(homeSections).values(
    sectionSpecs.map((spec, index) => ({
      type: spec.type,
      title: defaultTitleFor(spec.type),
      enabled: true,
      position: index,
      config: (spec.config ?? defaultConfigFor(spec.type)) as Record<string, unknown>,
    })),
  );
  console.log(`✓ homepage sections (${sectionSpecs.length})`);

  const [productCount] = await db.select({ value: sql<number>`count(*)::int` }).from(products);
  const [sectionCount] = await db.select({ value: sql<number>`count(*)::int` }).from(homeSections);

  console.log('');
  console.log(`Seeded ${productCount?.value ?? 0} products, ${sectionCount?.value ?? 0} homepage sections.`);
  console.log('Placeholder artwork lives in public/placeholders — replace it with real photos in Admin → Media.');
  console.log('');
  console.log('Next steps:');
  console.log('  1. npm run dev');
  console.log(`  2. Sign in at /admin (${adminEmail}) and set your Facebook page username under Settings → Contact.`);
  console.log('  3. Swap the placeholder images for real product photography.');
  console.log('');
}

async function main() {
  const force = process.argv.includes('--force');
  const { db, close } = await connect();
  try {
    await seed(db, { force });
  } finally {
    await close();
  }
}

main().catch((error: unknown) => {
  console.error('Seed failed.');
  if (error instanceof Error) {
    console.error(error.message);
    if (error.cause) console.error('Cause:', error.cause);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
