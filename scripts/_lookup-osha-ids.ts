import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
import { createAdminClient } from '../lib/supabase/admin';

async function main() {
  const db = createAdminClient();

  // All credentials
  const { data: creds } = await db.from('credential_registry')
    .select('id,name,abbreviation,issuing_body')
    .order('name');
  console.log('ALL credentials:', JSON.stringify(creds, null, 2));

  // training_courses for HVAC program
  const { data: tc } = await db.from('training_courses')
    .select('id,title,program_id')
    .eq('program_id', '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7');
  console.log('HVAC training_courses:', JSON.stringify(tc, null, 2));
}

main().catch(console.error);
