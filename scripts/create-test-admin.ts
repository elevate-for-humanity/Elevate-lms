/**
 * Creates a test admin user for Playwright E2E tests.
 * Writes TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD to .env.local.
 * Safe to re-run — skips creation if user already exists.
 */
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_EMAIL = 'e2e-admin@elevate-test.internal'
const TEST_PASSWORD = 'E2eTestAdmin2026!'

async function main() {
  // Check if user already exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('email', TEST_EMAIL)
    .maybeSingle()

  let userId: string

  if (existing) {
    console.log(`Test admin already exists: ${existing.id} (role: ${existing.role})`)
    userId = existing.id

    // Ensure role is admin
    if (!['admin', 'super_admin'].includes(existing.role)) {
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId)
      console.log('Updated role to admin')
    }
  } else {
    // Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    })

    if (authErr || !authData.user) {
      console.error('Failed to create auth user:', authErr?.message)
      process.exit(1)
    }

    userId = authData.user.id
    console.log(`Created auth user: ${userId}`)

    // Upsert profile with admin role
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: userId,
      email: TEST_EMAIL,
      full_name: 'E2E Test Admin',
      role: 'admin',
    })

    if (profileErr) {
      console.error('Failed to create profile:', profileErr.message)
      process.exit(1)
    }

    console.log('Created profile with admin role')
  }

  // Write credentials to .env.local
  const envPath = path.join(process.cwd(), '.env.local')
  let envContent = fs.readFileSync(envPath, 'utf-8')

  const vars: Record<string, string> = {
    TEST_ADMIN_EMAIL: TEST_EMAIL,
    TEST_ADMIN_PASSWORD: TEST_PASSWORD,
  }

  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`^${key}=.*$`, 'm')
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`)
    } else {
      envContent += `\n${key}=${value}`
    }
  }

  fs.writeFileSync(envPath, envContent)
  console.log(`\nWrote to .env.local:`)
  console.log(`  TEST_ADMIN_EMAIL=${TEST_EMAIL}`)
  console.log(`  TEST_ADMIN_PASSWORD=${TEST_PASSWORD}`)
  console.log('\nTest admin ready.')
}

main().catch(e => { console.error(e); process.exit(1) })
