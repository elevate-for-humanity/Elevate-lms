// scripts/db/runSeeds.js
// Run ALL SQL files in supabase/seeds in alphabetical order

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runSeeds() {
  const connectionString = process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    const seedsDir = path.join(process.cwd(), 'supabase', 'seeds');

    if (!fs.existsSync(seedsDir)) {
      process.exit(1);
    }

    const files = fs
      .readdirSync(seedsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      return;
    }


    for (const file of files) {
      const filePath = path.join(seedsDir, file);

      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        process.exit(1);
      }
    }

  } catch (err) {
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runSeeds();
}

module.exports = { runSeeds };
