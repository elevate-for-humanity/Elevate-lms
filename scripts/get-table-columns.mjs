import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' }
});

async function getColumns() {

  try {
    // Use raw SQL via RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN (
            'program_holder_documents',
            'program_holder_banking',
            'program_holder_verification',
            'marketplace_sales'
          )
        ORDER BY table_name, ordinal_position
      `
    });

    if (error) {
      console.error('RPC not available, trying direct query...');

      // Try getting sample data to infer structure
      const tables = ['program_holder_documents', 'program_holder_verification', 'marketplace_sales'];

      for (const table of tables) {
        const { data: sample, error: err } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (!err && sample && sample[0]) {
          Object.keys(sample[0]).forEach(col => console.log(`  - ${col}`));
        } else {
        }
      }
    } else {
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getColumns();
