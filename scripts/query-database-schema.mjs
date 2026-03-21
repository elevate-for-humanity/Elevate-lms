import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function querySchema() {

  const results = {};

  try {
    // Critical tables to check
    const tables = [
      'marketplace_creators',
      'marketplace_products',
      'marketplace_sales',
      'program_holder_documents',
      'program_holder_banking',
      'program_holder_verification',
      'program_holders',
      'profiles',
      'applications'
    ];

    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        results[table] = { exists: false, error: error.message };
      } else {
        results[table] = { exists: true, count };

        // Get first row to see structure
        const { data: sample } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (sample && sample[0]) {
          results[table].columns = Object.keys(sample[0]);
        }
      }
    }

    writeFileSync('schema-audit-results.json', JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

querySchema();
