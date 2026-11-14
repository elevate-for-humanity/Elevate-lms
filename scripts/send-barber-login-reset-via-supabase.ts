#!/usr/bin/env tsx

import { config } from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const recipients = [
  { name: 'Jordan White', email: 'jbwhite888@icloud.com' },
  { name: 'Mercedes Wellington', email: 'msanqin@gmail.com' },
  { name: 'Natalia Roa', email: 'natataroa@gmail.com' },
];

async function main() {
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const { error } = await supabase.auth.resetPasswordForEmail(recipient.email, {
      redirectTo: `${SITE_URL}/login`,
    });

    if (error) {
      failed += 1;
      console.error(`failed reset email for ${recipient.email}: ${error.message}`);
      continue;
    }

    sent += 1;
    console.log(`sent reset email for ${recipient.email}`);
  }

  console.log(`done. sent=${sent}, failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main();
