/**
 * Creates Stripe products + prices for EPA 608 exam fees and writes
 * stripe_product_id / stripe_price_id back to the credentials table.
 *
 * Run AFTER applying migration 20260401000013 in Supabase Dashboard:
 *   node scripts/sync-exam-fee-stripe-products.cjs
 *
 * Idempotent — skips rows that already have a stripe_product_id.
 */

'use strict';

const path = require('path');
const fs   = require('fs');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}

const Stripe      = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripeKey   = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_RESTRICTED_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeKey)   { console.error('❌ STRIPE_SECRET_KEY not set'); process.exit(1); }
if (!supabaseUrl) { console.error('❌ NEXT_PUBLIC_SUPABASE_URL not set'); process.exit(1); }
if (!supabaseKey) { console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1); }

const stripe = new Stripe(stripeKey, { apiVersion: '2025-10-29.clover' });
const db     = createClient(supabaseUrl, supabaseKey);

const EXAM_IDS = [
  'e6080000-0000-0000-0000-000000000001',
  'e6080000-0000-0000-0000-000000000002',
  'e6080000-0000-0000-0000-000000000003',
  'e6080000-0000-0000-0000-000000000004',
];

(async () => {
  const { data: rows, error } = await db
    .from('credentials')
    .select('id, name, description, exam_fee_cents, stripe_product_id, stripe_price_id, exam_provider, exam_format, metadata')
    .in('id', EXAM_IDS);

  if (error) { console.error('❌ DB fetch error:', error.message); process.exit(1); }
  if (!rows?.length) {
    console.error('❌ No rows found — apply migration 20260401000013 first');
    process.exit(1);
  }

  for (const row of rows) {
    if (row.stripe_product_id) {
      console.log(`⏭  ${row.name} — already synced (${row.stripe_product_id})`);
      continue;
    }

    console.log(`⏳ Syncing: ${row.name} ($${(row.exam_fee_cents / 100).toFixed(2)})`);

    // Create Stripe product
    const product = await stripe.products.create({
      name: row.name,
      description: row.description ?? undefined,
      metadata: {
        kind:          'exam_fee',
        credential_id: row.id,
        exam_provider: row.exam_provider ?? '',
        exam_format:   row.exam_format   ?? '',
        free_retests:  String(row.metadata?.free_retests ?? false),
      },
    });

    // Create Stripe price
    const price = await stripe.prices.create({
      product:     product.id,
      unit_amount: row.exam_fee_cents,
      currency:    'usd',
    });

    // Write back to DB
    const { error: updateErr } = await db
      .from('credentials')
      .update({
        stripe_product_id: product.id,
        stripe_price_id:   price.id,
        updated_at:        new Date().toISOString(),
      })
      .eq('id', row.id);

    if (updateErr) {
      console.error(`❌ DB update failed for ${row.id}:`, updateErr.message);
    } else {
      console.log(`✅ ${row.name} → product: ${product.id} | price: ${price.id}`);
    }
  }

  console.log('\n✅ Done. All EPA 608 exam fee products synced to Stripe.');
})();
