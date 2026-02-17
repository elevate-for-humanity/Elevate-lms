/**
 * Check table schema
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkSchema() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });

  console.log('Checking license_agreement_acceptances schema...\n');

  // Try to select all columns
  const { data, error } = await supabase
    .from('license_agreement_acceptances')
    .select('*')
    .limit(0);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  // The schema is in the response headers or we can infer from a sample
  console.log('Table exists. Attempting to get column info...\n');

  // Get a real user
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role')
    .limit(1)
    .single();

  if (!profile) {
    console.log('No users found');
    return;
  }

  console.log('Using user:', profile.email);

  // Try inserting with all expected columns
  const testInsert = await supabase
    .from('license_agreement_acceptances')
    .insert({
      user_id: profile.id,
      agreement_type: 'enrollment',
      document_version: '1.0',
      signer_name: 'Test User',
      signer_email: profile.email || 'test@test.com',
      signature_method: 'checkbox',
      role_at_signing: profile.role || 'student',
    })
    .select();

  console.log('\nInsert test result:');
  if (testInsert.error) {
    console.log('Error:', testInsert.error.message);
    console.log('Details:', testInsert.error.details);
  } else {
    console.log('Success! Columns in response:');
    console.log(Object.keys(testInsert.data[0] || {}).join(', '));
    console.log('\nRecord:', JSON.stringify(testInsert.data[0], null, 2));
    
    // Clean up
    if (testInsert.data?.[0]?.id) {
      await supabase
        .from('license_agreement_acceptances')
        .delete()
        .eq('id', testInsert.data[0].id);
      console.log('\nTest record cleaned up');
    }
  }
}

checkSchema().catch(console.error);
