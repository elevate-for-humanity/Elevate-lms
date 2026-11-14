#!/usr/bin/env node
/**
 * Create Admin User Script
 * Run this to create your first admin user
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createAdmin() {
  // Get Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error(
      'Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local',
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Get user input
  const email = await question('Enter admin email: ');
  const password = await question('Enter admin password (min 6 characters): ');
  const fullName = await question('Enter full name: ');

  if (!email || !password || password.length < 6) {
    console.error('❌ Invalid input. Email and password (min 6 chars) are required.');
    rl.close();
    process.exit(1);
  }

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      console.error('❌ Error creating user:', authError.message);
      rl.close();
      process.exit(1);
    }

    // Update profile to admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        full_name: fullName,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('❌ Error updating profile:', profileError.message);
    } else {
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  rl.close();
}

createAdmin();
