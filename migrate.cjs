const { Client } = require('pg');

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('SUPABASE_DB_URL or DATABASE_URL must be configured.');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

async function main() {
  try {
    console.warn('🔌 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.warn('✅ Connected!\n');

    // Check for schema_migrations table
    console.warn('📊 Checking schema_migrations table...');
    const migrationsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%migration%'
    `);
    
    if (migrationsResult.rows.length === 0) {
      console.warn('⚠️  No schema_migrations table found. Will run all migrations.');
    } else {
      console.warn(`✅ Found: ${migrationsResult.rows.map(r => r.table_name).join(', ')}`);
    }

    // Check Supabase migrations
    console.warn('\n📋 Checking Supabase schema_migrations...');
    const supabaseMigrations = await client.query(`
      SELECT version, executed_at 
      FROM schema_migrations 
      ORDER BY version
    `).catch(() => ({ rows: [] }));
    
    console.warn(`Found ${supabaseMigrations.rows.length} migrations already executed:`);
    supabaseMigrations.rows.forEach(r => {
      console.warn(`  - ${r.version} (${r.executed_at})`);
    });

    // Check for elevatemigrations table
    console.warn('\n📋 Checking for Elevate migrations table...');
    const elevateMigrations = await client.query(`
      SELECT version, applied_at 
      FROM elevatemigrations 
      ORDER BY version
    `).catch(() => ({ rows: [] }));
    
    if (elevateMigrations.rows.length > 0) {
      console.warn(`Found ${elevateMigrations.rows.length} Elevate migrations:`);
      elevateMigrations.rows.forEach(r => {
        console.warn(`  - ${r.version}`);
      });
    } else {
      console.warn('⚠️  No elevatemigrations table or empty');
    }

    // Check key tables exist
    console.warn('\n📊 Checking key tables...');
    const tables = ['programs', 'program_enrollments', 'profiles', 'lms_courses'];
    for (const table of tables) {
      const result = await client.query(`
        SELECT COUNT(*) as count FROM ${table} LIMIT 1
      `).catch(e => ({ rows: [{ count: `ERROR: ${e.message}` }] }));
      console.warn(`  ${table}: ${result.rows[0].count} rows`);
    }

    console.warn('\n✅ Audit complete!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
