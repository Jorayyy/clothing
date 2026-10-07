import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/* ------------------------------------------------------------------ */
/* Enums                                                              */
/* ------------------------------------------------------------------ */

export const productStatusEnum = pgEnum('product_status', ['draft', 'published', 'archived']);
export const contentStatusEnum = pgEnum('content_status', ['draft', 'published']);
export const adminRoleEnum = pgEnum('admin_role', ['owner', 'admin', 'editor', 'viewer']);
export const adminStatusEnum = pgEnum('admin_status', ['active', 'suspended']);
export const collectionSelectionModeEnum = pgEnum('collection_selection_mode', ['manual', 'rules']);
export const inquiryStatusEnum = pgEnum('inquiry_status', ['new', 'open', 'resolved', 'spam']);

const createdAt = timestamp('created_at', { withTimezone: true })
  .notNull()
  .default(sql`now()`);
const updatedAt = timestamp('updated_at', { withTimezone: true })
  .notNull()
  .default(sql`now()`);

/* ------------------------------------------------------------------ */
/* Admin users                                                        */
/* ------------------------------------------------------------------ */

export const adminUsers = pgTable(
  'admin_users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull(),
    name: text('name').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: adminRoleEnum('role').notNull().default('editor'),
    status: adminStatusEnum('status').notNull().default('active'),
    tokenVersion: integer('token_version').notNull().default(0),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [uniqueIndex('admin_users_email_unique').on(sql`lower(${t.email})`)],
);

/* ------------------------------------------------------------------ */
/* Media                                                              */
/* ------------------------------------------------------------------ */

export const media = pgTable(
  'media',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    url: text('url').notNull(),
    storageKey: text('storage_key').notNull(),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    width: integer('width'),
    height: integer('height'),
    alt: text('alt').notNull().default(''),
    createdAt,
  },
  (t) => [index('media_created_at_idx').on(t.createdAt)],
);

/* ------------------------------------------------------------------ */
/* Catalog                                                            */
/* ------------------------------------------------------------------ */

export const categories = pgTable(
  'categories',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    imageId: text('image_id').references(() => media.id, { onDelete: 'set null' }),
    position: integer('position').notNull().default(0),
    status: contentStatusEnum('status').notNull().default('draft'),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    createdAt,
    updatedAt,
  },
  (t) => [uniqueIndex('categories_slug_unique').on(t.slug), index('categories_status_idx').on(t.status)],
);

export const collections = pgTable(
  'collections',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    coverImageId: text('cover_image_id').references(() => media.id, { onDelete: 'set null' }),
    isFeatured: boolean('is_featured').notNull().default(false),
    selectionMode: collectionSelectionModeEnum('selection_mode').notNull().default('manual'),
    rules: jsonb('rules').$type<CollectionRule[]>().default(sql`'[]'::jsonb`),
    position: integer('position').notNull().default(0),
    status: contentStatusEnum('status').notNull().default('draft'),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('collections_slug_unique').on(t.slug),
    index('collections_status_idx').on(t.status),
    index('collections_featured_idx').on(t.isFeatured),
  ],
);

export const products = pgTable(
  'products',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    summary: text('summary').notNull().default(''),
    description: text('description').notNull().default(''),
    richContent: jsonb('rich_content').$type<RichBlock[]>().default(sql`'[]'::jsonb`),
    /** Price in centavos (PHP). */
    price: integer('price').notNull(),
    /** Previous "was" price in centavos, shown struck-through when higher than price. */
    compareAtPrice: integer('compare_at_price'),
    /** Explicit sale price in centavos; when set it takes precedence over `price`. */
    salePrice: integer('sale_price'),
    label: text('label').notNull().default(''),
    sku: text('sku'),
    status: productStatusEnum('status').notNull().default('draft'),
    featured: boolean('featured').notNull().default(false),
    isNewArrival: boolean('is_new_arrival').notNull().default(false),
    isBestSeller: boolean('is_best_seller').notNull().default(false),
    trackStock: boolean('track_stock').notNull().default(false),
    stockQuantity: integer('stock_quantity').notNull().default(0),
    material: text('material'),
    fit: text('fit'),
    measurements: text('measurements'),
    care: text('care'),
    videoUrl: text('video_url'),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    socialImageId: text('social_image_id').references(() => media.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata').$type<Record<string, string>>().default(sql`'{}'::jsonb`),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('products_slug_unique').on(t.slug),
    index('products_status_idx').on(t.status),
    index('products_status_created_idx').on(t.status, t.createdAt),
    index('products_price_idx').on(t.price),
    index('products_featured_idx').on(t.featured),
  ],
);

export const productImages = pgTable(
  'product_images',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    mediaId: text('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),
    alt: text('alt').notNull().default(''),
    position: integer('position').notNull().default(0),
    createdAt,
  },
  (t) => [
    index('product_images_product_idx').on(t.productId),
    uniqueIndex('product_images_unique').on(t.productId, t.mediaId, t.position),
  ],
);

export const productAttributes = pgTable(
  'product_attributes',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    /** Lowercased key used inside variant options, e.g. "size". */
    key: text('key').notNull(),
    name: text('name').notNull(),
    values: jsonb('values').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    position: integer('position').notNull().default(0),
    createdAt,
  },
  (t) => [
    uniqueIndex('product_attributes_unique').on(t.productId, t.key),
    index('product_attributes_product_idx').on(t.productId),
    index('product_attributes_values_gin').using('gin', t.values),
  ],
);

export const productVariants = pgTable(
  'product_variants',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    sku: text('sku'),
    /** Optional per-variant price override in centavos. */
    price: integer('price'),
    options: jsonb('options').$type<Record<string, string>>().notNull().default(sql`'{}'::jsonb`),
    trackStock: boolean('track_stock').notNull().default(false),
    stockQuantity: integer('stock_quantity').notNull().default(0),
    position: integer('position').notNull().default(0),
    createdAt,
    updatedAt,
  },
  (t) => [
    index('product_variants_product_idx').on(t.productId),
    index('product_variants_options_gin').using('gin', t.options),
  ],
);

export const productCategories = pgTable(
  'product_categories',
  {
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.categoryId] })],
);

export const collectionProducts = pgTable(
  'collection_products',
  {
    collectionId: text('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.collectionId, t.productId] }),
    index('collection_products_product_idx').on(t.productId),
  ],
);

/* ------------------------------------------------------------------ */
/* Content & presentation                                             */
/* ------------------------------------------------------------------ */

export const pages = pgTable(
  'pages',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    /** Blocks: heading / text / image / divider / faq / cta */
    content: jsonb('content').$type<RichBlock[]>().notNull().default(sql`'[]'::jsonb`),
    status: contentStatusEnum('status').notNull().default('draft'),
    showInFooter: boolean('show_in_footer').notNull().default(false),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [uniqueIndex('pages_slug_unique').on(t.slug), index('pages_status_idx').on(t.status)],
);

export const homeSections = pgTable(
  'home_sections',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    type: text('type').notNull(),
    title: text('title').notNull().default(''),
    enabled: boolean('enabled').notNull().default(true),
    position: integer('position').notNull().default(0),
    config: jsonb('config').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt,
    updatedAt,
  },
  (t) => [index('home_sections_position_idx').on(t.position)],
);

export const navigationItems = pgTable(
  'navigation_items',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    menu: text('menu').notNull().default('header'),
    label: text('label').notNull(),
    href: text('href').notNull().default(''),
    /** 'link' uses href; 'categories' expands to published categories; 'collections' likewise. */
    kind: text('kind').notNull().default('link'),
    position: integer('position').notNull().default(0),
    enabled: boolean('enabled').notNull().default(true),
    openInNewTab: boolean('open_in_new_tab').notNull().default(false),
    createdAt,
    updatedAt,
  },
  (t) => [index('navigation_menu_idx').on(t.menu, t.position)],
);

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
  updatedAt,
});

export const newsletterSubscribers = pgTable(
  'newsletter_subscribers',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull(),
    source: text('source').notNull().default('site'),
    createdAt,
  },
  (t) => [uniqueIndex('newsletter_subscribers_email_unique').on(sql`lower(${t.email})`)],
);

export const inquiries = pgTable(
  'inquiries',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),
    productName: text('product_name'),
    variantSummary: text('variant_summary'),
    name: text('name'),
    email: text('email'),
    message: text('message'),
    channel: text('channel').notNull().default('messenger'),
    source: text('source').notNull().default('product'),
    status: inquiryStatusEnum('status').notNull().default('new'),
    referrerPath: text('referrer_path'),
    createdAt,
  },
  (t) => [
    index('inquiries_created_at_idx').on(t.createdAt),
    index('inquiries_product_idx').on(t.productId),
    index('inquiries_status_idx').on(t.status),
  ],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    actorId: text('actor_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    actorLabel: text('actor_label').notNull().default(''),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull().default(''),
    entityId: text('entity_id').notNull().default(''),
    summary: text('summary').notNull().default(''),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
    ip: text('ip'),
    createdAt,
  },
  (t) => [index('audit_logs_created_at_idx').on(t.createdAt), index('audit_logs_actor_idx').on(t.actorId)],
);

export const rateLimits = pgTable(
  'rate_limits',
  {
    bucket: text('bucket').primaryKey(),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    hits: integer('hits').notNull().default(0),
  },
  (t) => [index('rate_limits_window_idx').on(t.windowStart)],
);

/* ------------------------------------------------------------------ */
/* Relations                                                          */
/* ------------------------------------------------------------------ */

export const productsRelations = relations(products, ({ many }) => ({
  images: many(productImages),
  attributes: many(productAttributes),
  variants: many(productVariants),
  productCategories: many(productCategories),
  collectionProducts: many(collectionProducts),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
  media: one(media, { fields: [productImages.mediaId], references: [media.id] }),
}));

export const productAttributesRelations = relations(productAttributes, ({ one }) => ({
  product: one(products, { fields: [productAttributes.productId], references: [products.id] }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  product: one(products, { fields: [productCategories.productId], references: [products.id] }),
  category: one(categories, { fields: [productCategories.categoryId], references: [categories.id] }),
}));

export const collectionProductsRelations = relations(collectionProducts, ({ one }) => ({
  collection: one(collections, { fields: [collectionProducts.collectionId], references: [collections.id] }),
  product: one(products, { fields: [collectionProducts.productId], references: [products.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  image: one(media, { fields: [categories.imageId], references: [media.id] }),
  productCategories: many(productCategories),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  coverImage: one(media, { fields: [collections.coverImageId], references: [media.id] }),
  collectionProducts: many(collectionProducts),
}));

export const mediaRelations = relations(media, ({ many }) => ({
  productImages: many(productImages),
}));

/* ------------------------------------------------------------------ */
/* Schema aggregate (used by Drizzle's relational query API)          */
/* ------------------------------------------------------------------ */

export const schema = {
  adminUsers,
  media,
  categories,
  collections,
  products,
  productImages,
  productAttributes,
  productVariants,
  productCategories,
  collectionProducts,
  pages,
  homeSections,
  navigationItems,
  settings,
  inquiries,
  auditLogs,
  rateLimits,
  newsletterSubscribers,
};

/* ------------------------------------------------------------------ */
/* Shared payload types                                               */
/* ------------------------------------------------------------------ */

export type AdminUser = typeof adminUsers.$inferSelect;
export type MediaAsset = typeof media.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type ProductAttribute = typeof productAttributes.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type PageRecord = typeof pages.$inferSelect;
export type HomeSection = typeof homeSections.$inferSelect;
export type NavigationItem = typeof navigationItems.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

export interface CollectionRule {
  field: 'category' | 'tag' | 'priceBelow' | 'priceAbove' | 'featured' | 'newArrival' | 'bestSeller';
  value: string | number | boolean;
}

export type RichBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'image'; mediaId: string; alt?: string; caption?: string }
  | { type: 'divider' }
  | { type: 'callout'; title: string; text: string }
  | { type: 'faq'; items: { question: string; answer: string }[] }
  | { type: 'cta'; label: string; href: string };


