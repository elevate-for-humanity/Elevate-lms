import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);


async function exportSchema() {
  try {
    // Get all tables
    const { data: tables, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `
      });

    if (error) {

      // Alternative: Query known tables
      const knownTables = [
        'profiles', 'applications', 'programs', 'enrollments',
        'marketplace_creators', 'marketplace_products', 'marketplace_sales',
        'program_holders', 'program_holder_documents', 'program_holder_verification',
        'program_holder_banking'
      ];

      const schemaDoc = {
        exported_at: new Date().toISOString(),
        method: 'sample_query',
        tables: {}
      };

      for (const tableName of knownTables) {
        const { data, error: err } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!err && data && data[0]) {
          schemaDoc.tables[tableName] = {
            exists: true,
            columns: Object.keys(data[0])
          };
        } else if (!err) {
          schemaDoc.tables[tableName] = {
            exists: true,
            columns: []
          };
        } else {
        }
      }

      writeFileSync('current-schema-export.json', JSON.stringify(schemaDoc, null, 2));

      return schemaDoc;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

exportSchema();
