import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { schema } from '../src/lib/db/schema';

const MIGRATIONS_FOLDER = path.join(process.cwd(), 'drizzle');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString && /^postgres(ql)?:\/\//i.test(connectionString)) {
    const client = postgres(connectionString, { max: 1, prepare: false });
    const db = drizzlePostgres(client, { schema });
    const { migrate } = await import('drizzle-orm/postgres-js/migrator');
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    await client.end({ timeout: 5 });
    console.log('Applied migrations to PostgreSQL:', safeHost(connectionString));
    return;
  }

  const dataDir = process.env.PGLITE_DIR ?? path.join(process.cwd(), '.local', 'pg');
  fs.mkdirSync(dataDir, { recursive: true });
  const client = new PGlite({ dataDir });
  const db = drizzlePglite(client, { schema });
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  await client.close();
  console.log('Applied migrations to local PGlite database:', dataDir);
}

function safeHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return '(unparsable)';
  }
}

main().catch((error: unknown) => {
  console.error('Migration failed.');
  if (error instanceof Error) {
    console.error(error.message);
    if (error.cause) console.error('Cause:', error.cause);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
