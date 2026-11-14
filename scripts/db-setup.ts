// scripts/db-setup.ts
// Auto-run SQL migrations + seed into Supabase using SUPABASE_DB_URL

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function runSqlFile(client: Client, filePath: string) {
  const sql = fs.readFileSync(filePath, 'utf8');
  if (!sql.trim()) return;

  await client.query(sql);
}

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();

    // Optional: simple migrations tracking table (so we don't double-run)
    await client.query(`
      CREATE TABLE IF NOT EXISTS efh_migrations (
        id serial PRIMARY KEY,
        filename text UNIQUE NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
    if (!fs.existsSync(migrationsDir)) {
    } else {
      const files = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort(); // run in filename order

      for (const file of files) {
        const filePath = path.join(migrationsDir, file);

        // Check if already applied
        const { rows } = await client.query('SELECT 1 FROM efh_migrations WHERE filename = $1', [
          file,
        ]);
        if (rows.length > 0) {
          continue;
        }

        // Run and record
        await client.query('BEGIN');
        try {
          await runSqlFile(client, filePath);
          await client.query('INSERT INTO efh_migrations (filename) VALUES ($1)', [file]);
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          process.exit(1);
        }
      }
    }

    // Seed data
    const seedFile = path.join(process.cwd(), 'supabase/seed.sql');

    if (fs.existsSync(seedFile)) {
      await runSqlFile(client, seedFile);
    } else {
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  process.exit(1);
});
