// scripts/db/runSeeds.js
// Run all SQL files in supabase/seeds in alphabetical order.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runSeeds() {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.log('SUPABASE_DB_URL not set, skipping seeds');
    return;
  }

  const seedsDir = path.join(__dirname, '../../supabase/seeds');
  if (!fs.existsSync(seedsDir)) {
    console.log('No supabase/seeds directory, skipping');
    return;
  }

  const files = fs.readdirSync(seedsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No seed files found');
    return;
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('Connected for seeds');

    for (const file of files) {
      const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
      console.log('Running seed ' + file + '...');
      try {
        await client.query(sql);
        console.log('Seeded ' + file);
      } catch (err) {
        console.error('Seed failed ' + file + ': ' + err.message);
      }
    }
  } finally {
    await client.end();
  }
}

runSeeds();
