import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import postgres from 'postgres';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';

import { schema } from './schema';

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS_FOLDER = path.join(process.cwd(), 'drizzle');

interface DbHandle {
  db: Database;
  driver: 'postgres' | 'pglite';
  close: () => Promise<void>;
}

function createPostgresDb(connectionString: string): DbHandle {
  const client = postgres(connectionString, {
    max: 10,
    // Neon's pooled (PgBouncer) endpoints do not support prepared statements.
    prepare: false,
    connect_timeout: 15,
    idle_timeout: 30,
  });
  const db = drizzlePostgres(client, { schema }) as unknown as Database;
  return {
    db,
    driver: 'postgres',
    close: async () => {
      await client.end({ timeout: 5 });
    },
  };
}

function createPgliteDb(dataDir?: string): DbHandle {
  if (dataDir) fs.mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(dataDir ? { dataDir } : {});
  const db = drizzle(client, { schema }) as unknown as Database;
  return {
    db,
    driver: 'pglite',
    close: async () => {
      await client.close();
    },
  };
}

function resolveHandle(): DbHandle {
  const mode = process.env.MICS_DB;
  if (mode === 'memory') {
    return createPgliteDb();
  }
  const connectionString = process.env.DATABASE_URL;
  if (connectionString && /^postgres(ql)?:\/\//i.test(connectionString)) {
    return createPostgresDb(connectionString);
  }
  const dataDir = process.env.PGLITE_DIR ?? path.join(process.cwd(), '.local', 'pg');
  return createPgliteDb(dataDir);
}

const globalStore = globalThis as unknown as {
  __micsDbHandle?: DbHandle;
  __micsDbPromise?: Promise<DbHandle>;
};

/**
 * Migrations run automatically in development so `next dev` always matches the
 * schema. In production they are applied out-of-band (`npm run db:migrate`,
 * normally via the `prebuild` hook) — set `MICS_AUTO_MIGRATE=1` to opt in.
 */
function shouldAutoMigrate(): boolean {
  const flag = process.env.MICS_AUTO_MIGRATE;
  if (flag === '1' || flag === 'true') return true;
  if (flag === '0' || flag === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

async function initHandle(): Promise<DbHandle> {
  if (globalStore.__micsDbHandle) return globalStore.__micsDbHandle;
  if (!globalStore.__micsDbPromise) {
    globalStore.__micsDbPromise = (async () => {
      const handle = resolveHandle();
      if (shouldAutoMigrate()) {
        const { migrate } = handle.driver === 'postgres'
          ? await import('drizzle-orm/postgres-js/migrator')
          : await import('drizzle-orm/pglite/migrator');
        await migrate(handle.db as never, { migrationsFolder: MIGRATIONS_FOLDER });
      }
      globalStore.__micsDbHandle = handle;
      return handle;
    })().catch((error) => {
      globalStore.__micsDbPromise = undefined;
      throw error;
    });
  }
  return globalStore.__micsDbPromise;
}

/** Resolves the application database, running pending migrations on first use. */
export async function getDb(): Promise<Database> {
  return (await initHandle()).db;
}

export async function closeDb(): Promise<void> {
  const handle = globalStore.__micsDbHandle;
  globalStore.__micsDbHandle = undefined;
  globalStore.__micsDbPromise = undefined;
  if (handle) await handle.close();
}

/** Fresh in-memory database for tests. Runs migrations immediately. */
export async function createTestDb(): Promise<{
  db: Database;
  close: () => Promise<void>;
}> {
  const client = new PGlite();
  const db = drizzle(client, { schema }) as unknown as Database;
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  await migrate(db as never, { migrationsFolder: MIGRATIONS_FOLDER });
  return {
    db,
    close: async () => {
      await client.close();
    },
  };
}
