import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {

  const sql = readFileSync('supabase/migrations/20251227_fix_verification_schema.sql', 'utf8');


  try {
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.includes('COMMENT ON')) {
      } else if (statement.includes('ALTER TABLE')) {
      } else if (statement.includes('CREATE INDEX')) {
      } else if (statement.includes('UPDATE')) {
      }

      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

      if (error) {
        // Try alternative method
        const { error: err2 } = await supabase.from('_migrations').insert({ sql: statement });
        if (err2) {
          console.error(`  ❌ Failed: ${error.message}`);
        }
      } else {
      }
    }


  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyMigration();
