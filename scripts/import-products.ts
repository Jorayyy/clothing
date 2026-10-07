import 'dotenv/config';

import fs from 'node:fs';
import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  categories,
  media,
  productAttributes,
  productCategories,
  productImages,
  products,
} from '../src/lib/db/schema';
import { slugify } from '../src/lib/utils';

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
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

function parseCsv(text: string): Record<string, string>[] {
  text = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((r) => r.some((cell) => cell.trim() !== ''));
  if (!header) return [];
  return body.map((cells) => Object.fromEntries(header.map((key, i) => [key.trim(), (cells[i] ?? '').trim()])));
}

function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/[₱$,\s]/g, '');
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
};

async function storeImage(
  csvPath: string,
  imagePath: string,
  slug: string,
): Promise<{ url: string; storageKey: string; fileName: string; mimeType: string; byteSize: number } | null> {
  const resolved = path.isAbsolute(imagePath) ? imagePath : path.resolve(path.dirname(csvPath), imagePath);
  if (!fs.existsSync(resolved)) return null;
  const bytes = fs.readFileSync(resolved);
  const ext = path.extname(resolved).toLowerCase();
  const mimeType = MIME[ext] ?? 'application/octet-stream';
  const key = `products/${slug}${ext}`;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const { put } = await import('@vercel/blob');
    const result = await put(key, bytes, { access: 'public', token, contentType: mimeType, allowOverwrite: true });
    return { url: result.url, storageKey: key, fileName: path.basename(resolved), mimeType, byteSize: bytes.length };
  }

  const target = path.join(process.cwd(), 'public', 'uploads', ...key.split('/'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, bytes);
  return { url: `/uploads/${key}`, storageKey: key, fileName: path.basename(resolved), mimeType, byteSize: bytes.length };
}

/* ------------------------------------------------------------------ */
/* Import                                                              */
/* ------------------------------------------------------------------ */

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath || !fs.existsSync(csvPath)) {
    console.error('Usage: npx tsx scripts/import-products.ts <file.csv>');
    console.error('');
    console.error('Columns: name,price,category,description,sizes,image,label,status');
    console.error('  name, price   required (price in PHP, e.g. 750 or ₱1,299)');
    console.error('  category      created if it does not exist yet');
    console.error('  sizes         e.g. S,M,L  (or S|M|L) — optional');
    console.error('  image         path to a local image file, relative to the CSV');
    console.error('  label         badge text, e.g. NEW or BEST SELLER');
    console.error('  status        publish → live immediately, otherwise draft');
    process.exitCode = 1;
    return;
  }

  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  if (rows.length === 0) {
    console.error('No data rows found in the CSV.');
    process.exitCode = 1;
    return;
  }

  const { db, close } = await connect();
  const errors: string[] = [];
  let created = 0;
  let skipped = 0;

  try {
    const existingSlugs = new Set((await db.select({ slug: products.slug }).from(products)).map((r) => r.slug));
    const categoryRows = await db
      .select({ id: categories.id, name: categories.name, position: categories.position })
      .from(categories);
    const categoryByName = new Map(categoryRows.map((r) => [r.name.toLowerCase(), r.id]));
    let nextPosition = categoryRows.reduce((max, r) => Math.max(max, r.position), -1) + 1;

    for (const [index, row] of rows.entries()) {
      const line = index + 2;
      const name = row.name?.trim();
      const price = row.price ? parsePrice(row.price) : null;
      if (!name) {
        errors.push(`Row ${line}: missing name`);
        continue;
      }
      if (price === null) {
        errors.push(`Row ${line} (${name}): missing or invalid price`);
        continue;
      }

      const slug = slugify(name);
      if (existingSlugs.has(slug)) {
        skipped++;
        console.log(`- skipped, already exists: ${name}`);
        continue;
      }
      existingSlugs.add(slug);

      let categoryId: string | undefined;
      const categoryName = row.category?.trim();
      if (categoryName) {
        const found = categoryByName.get(categoryName.toLowerCase());
        if (found) {
          categoryId = found;
        } else {
          const catRows = await db
            .insert(categories)
            .values({
              slug: slugify(categoryName),
              name: categoryName,
              description: '',
              position: nextPosition++,
              status: 'published',
            })
            .returning({ id: categories.id });
          categoryId = catRows[0]!.id;
          categoryByName.set(categoryName.toLowerCase(), categoryId);
          console.log(`  + category: ${categoryName}`);
        }
      }

      const sizes = (row.sizes ?? '')
        .split(/[;,|]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const productRows = await db
        .insert(products)
        .values({
          slug,
          name,
          summary: '',
          description: row.description ?? '',
          price,
          label: row.label ?? '',
          status: row.status?.toLowerCase().startsWith('publish') ? 'published' : 'draft',
          trackStock: false,
          stockQuantity: 0,
          publishedAt: row.status?.toLowerCase().startsWith('publish') ? new Date() : null,
        })
        .returning({ id: products.id });
      const productId = productRows[0]!.id;

      if (categoryId) {
        await db.insert(productCategories).values({ productId, categoryId });
      }

      if (row.image) {
        const stored = await storeImage(csvPath, row.image, slug);
        if (stored) {
          const mediaRows = await db.insert(media).values({ ...stored, alt: name }).returning({ id: media.id });
          await db.insert(productImages).values({ productId, mediaId: mediaRows[0]!.id, alt: name, position: 0 });
        } else {
          errors.push(`Row ${line} (${name}): image not found at ${row.image}`);
        }
      }

      if (sizes.length > 0) {
        await db.insert(productAttributes).values({
          productId,
          key: 'size',
          name: 'Size',
          values: sizes,
          position: 0,
        });
      }

      created++;
      console.log(`✓ ${name} (${(price / 100).toFixed(2)} PHP)${sizes.length ? ` [${sizes.join(', ')}]` : ''}`);
    }
  } finally {
    await close();
  }

  console.log('');
  console.log(`Imported ${created} product(s), skipped ${skipped}.`);
  if (errors.length > 0) {
    console.log('');
    console.log('Issues:');
    for (const error of errors) console.log(`  - ${error}`);
  }
}

main().catch((error: unknown) => {
  console.error('Import failed.');
  if (error instanceof Error) {
    console.error(error.message);
    if (error.cause) console.error('Cause:', error.cause);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
