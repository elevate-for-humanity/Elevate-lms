#!/usr/bin/env node

const required = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

for (const name of required) {
  if (!process.env[name]?.trim()) throw new Error(`Missing required secret: ${name}`);
}

const stripeKey = process.env.STRIPE_SECRET_KEY.trim();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
const expectedAccount = process.env.EXPECTED_STRIPE_ACCOUNT_ID?.trim();

const accountResponse = await fetch('https://api.stripe.com/v1/account', {
  headers: { Authorization: `Bearer ${stripeKey}` },
});

if (!accountResponse.ok) {
  throw new Error(`GitHub STRIPE_SECRET_KEY failed Stripe validation (HTTP ${accountResponse.status})`);
}

const account = await accountResponse.json();
if (expectedAccount && account.id !== expectedAccount) {
  throw new Error(`Refusing key for unexpected Stripe account ${account.id}`);
}
if (account.charges_enabled !== true || account.payouts_enabled !== true) {
  throw new Error(`Stripe account ${account.id} is not enabled for charges and payouts`);
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=minimal',
};

async function upsert(table, body) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=key`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Failed to update ${table} (HTTP ${response.status})`);
  }
}

await upsert('app_secrets', [{
  key: 'STRIPE_SECRET_KEY',
  value: stripeKey,
  scope: 'runtime',
  description: 'Canonical live Stripe server key synchronized from GitHub production secrets',
  updated_at: new Date().toISOString(),
}]);

await upsert('platform_secrets', [{
  key: 'STRIPE_SECRET_KEY',
  value_enc: stripeKey,
  scope: 'runtime',
  updated_at: new Date().toISOString(),
}]);

console.log(`Validated and synchronized Stripe key for account ${account.id}`);
