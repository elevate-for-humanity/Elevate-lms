const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Need service role key - check env or ask user
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function querySchema() {

  try {
    // Query marketplace tables to verify they exist
    const tables = ['marketplace_creators', 'marketplace_products', 'marketplace_sales'];

    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
      } else {
      }
    }

  } catch (error) {
  }
}

querySchema();
