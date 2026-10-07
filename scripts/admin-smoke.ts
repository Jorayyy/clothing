/**
 * Admin smoke test: mints a valid session cookie, walks every admin route
 * with and without auth, and reports status codes.
 *
 * Usage: SESSION_SECRET=<same secret as the server> tsx scripts/admin-smoke.ts
 */
import 'dotenv/config';

import { createHmac, randomBytes } from 'node:crypto';

const BASE = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3000';

function secret(): Buffer {
  const raw = process.env.SESSION_SECRET;
  if (raw && raw.length >= 32) return Buffer.from(raw, 'utf8');
  return Buffer.from('dev-only-insecure-session-secret-change-me');
}

function sessionCookie(uid: string, tv: number): string {
  const payload = {
    uid,
    tv,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    sid: randomBytes(9).toString('base64url'),
  };
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', secret()).update(body).digest('base64url');
  return `mics_admin_session=${body}.${sig}`;
}

async function getDbRow() {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { adminUsers } = await import('../src/lib/db/schema');

  const connectionString = process.env.DATABASE_URL;
  if (connectionString && /^postgres(ql)?:\/\//i.test(connectionString)) {
    const { drizzle: drizzlePostgres } = await import('drizzle-orm/postgres-js');
    const postgres = (await import('postgres')).default;
    const client = postgres(connectionString, { max: 1, prepare: false });
    const db = drizzlePostgres(client);
    const rows = await db
      .select({ id: adminUsers.id, tv: adminUsers.tokenVersion })
      .from(adminUsers)
      .limit(1);
    await client.end({ timeout: 5 });
    return finish(rows);
  }

  const dataDir = process.env.PGLITE_DIR ?? path.join(process.cwd(), '.local', 'pg');
  fs.mkdirSync(dataDir, { recursive: true });
  const client = new PGlite({ dataDir });
  const db = drizzle(client);
  const rows = await db
    .select({ id: adminUsers.id, tv: adminUsers.tokenVersion })
    .from(adminUsers)
    .limit(1);
  await client.close();
  return finish(rows);
}

function finish(rows: { id: string; tv: number }[]) {
  const row = rows[0];
  if (!row) throw new Error('No admin user found. Run `npm run db:seed` first.');
  return row;
}

const ROUTES = [
  '/admin',
  '/admin/products',
  '/admin/products/new',
  '/admin/categories',
  '/admin/collections',
  '/admin/media',
  '/admin/pages',
  '/admin/navigation',
  '/admin/homepage',
  '/admin/settings',
  '/admin/inquiries',
  '/admin/newsletter',
  '/admin/users',
  '/admin/audit',
];

async function check(url: string, cookie?: string, follow = true) {
  const res = await fetch(url, {
    headers: cookie ? { cookie } : undefined,
    redirect: follow ? 'follow' : 'manual',
  });
  const location = res.headers.get('location');
  return { status: res.status, location };
}

const failures: string[] = [];
function expect(label: string, ok: boolean, detail = '') {
  const mark = ok ? 'ok  ' : 'FAIL';
  console.log(`${mark} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(`${label} ${detail}`);
}

async function main() {
  const row = await getDbRow();
  const cookie = sessionCookie(row.id, row.tv);

  const anonymousAdmin = await check(`${BASE}/admin`, undefined, false);
  expect('GET /admin (anonymous)', anonymousAdmin.status === 307 && (anonymousAdmin.location ?? '').includes('/admin/login'), `${anonymousAdmin.status} -> ${anonymousAdmin.location}`);

  const anonymousProtected = await check(`${BASE}/admin/products`, undefined, false);
  expect('GET /admin/products (anonymous)', anonymousProtected.status === 307, `${anonymousProtected.status} -> ${anonymousProtected.location}`);

  const badCookie = await check(`${BASE}/admin/products`, 'mics_admin_session=not-a-real-token', false);
  expect('GET /admin/products (bad cookie)', badCookie.status === 307, `${badCookie.status}`);

  for (const route of ROUTES) {
    const res = await check(`${BASE}${route}`, cookie);
    if (res.status !== 200) {
      failures.push(`${route} ${res.status}`);
      console.log(`FAIL ${route} — ${res.status}`);
      continue;
    }

    if (route === '/admin/products') {
      const html = await (await fetch(`${BASE}${route}`, { headers: { cookie } })).text();
      const match = html.match(/\/admin\/products\/([0-9a-f-]{36})/);
      if (match) {
        const detail = await check(`${BASE}/admin/products/${match[1]}`, cookie);
        expect('/admin/products/[id]', detail.status === 200, String(detail.status));
      } else {
        console.log('note /admin/products — no product edit links found (empty table?)');
      }
    }

    console.log(`ok   ${route} — ${res.status}`);
  }

  const home = await check(`${BASE}/`, cookie);
  expect('GET / (storefront still up)', home.status === 200, String(home.status));
}

main()
  .then(() => {
    console.log('');
    if (failures.length) {
      console.error(`${failures.length} failure(s):`);
      for (const f of failures) console.error(`  ${f}`);
      process.exit(1);
    }
    console.log('All admin smoke checks passed.');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
