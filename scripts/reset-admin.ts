import 'dotenv/config';

import fs from 'node:fs';
import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { hashPassword } from '../src/lib/auth/password-core';
import { adminUsers } from '../src/lib/db/schema';

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

async function main() {
  const password = process.argv[2];
  const email = (process.argv[3] ?? process.env.MICS_ADMIN_EMAIL ?? 'admin@micsapparel.ph')
    .trim()
    .toLowerCase();

  if (!password || password.length < 10) {
    console.error('Usage: npx tsx scripts/reset-admin.ts <password (min 10 chars)> [email]');
    process.exitCode = 1;
    return;
  }
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set — falling back to local PGlite database.');
  }

  const { db, close } = await connect();
  try {
    const passwordHash = await hashPassword(password);
    const rows = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(sql`lower(${adminUsers.email}) = ${email}`)
      .limit(1);

    if (rows[0]) {
      await db
        .update(adminUsers)
        .set({ passwordHash, status: 'active', tokenVersion: sql`${adminUsers.tokenVersion} + 1`, updatedAt: new Date() })
        .where(sql`lower(${adminUsers.email}) = ${email}`);
      console.log(`Updated admin: ${email}`);
    } else {
      await db.insert(adminUsers).values({
        email,
        name: 'Store Owner',
        passwordHash,
        role: 'owner',
        status: 'active',
        tokenVersion: 0,
      });
      console.log(`Created admin: ${email}`);
    }
    console.log('Sign in at /admin/login with the password you just set.');
  } finally {
    await close();
  }
}

main().catch((error: unknown) => {
  console.error('Reset failed.');
  if (error instanceof Error) {
    console.error(error.message);
    if (error.cause) console.error('Cause:', error.cause);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
