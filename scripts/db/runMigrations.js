// scripts/db/runMigrations.js
// Run all SQL files in supabase/migrations in alphabetical order.
// Tracks applied files in efh_migrations — skips already-applied ones.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error('SUPABASE_DB_URL not set');
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('Connected to database');

    await client.query(`
      CREATE TABLE IF NOT EXISTS efh_migrations (
        id          SERIAL PRIMARY KEY,
        filename    TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationsDir = path.join(__dirname, '../../supabase/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.error('supabase/migrations directory not found');
      process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log('Found ' + files.length + ' migration files');

    let applied = 0;
    let skipped = 0;

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT 1 FROM efh_migrations WHERE filename = $1 LIMIT 1',
        [file]
      );
      if (rows.length > 0) {
        skipped++;
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log('Applying ' + file + '...');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO efh_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        applied++;
        console.log('Applied ' + file);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('FAILED ' + file + ': ' + err.message);
        process.exit(1);
      }
    }

    console.log('Done: ' + applied + ' applied, ' + skipped + ' skipped');
  } finally {
    await client.end();
  }
}

runMigrations();
