#!/usr/bin/env node

const API_BASE = 'https://api.northflank.com/v1';
const token = process.env.NORTHFLANK_API_TOKEN;
const projectId = process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';
const sourceSecretId = process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env';
const builderSecretId = process.env.NORTHFLANK_BUILDER_SECRET_GROUP_ID || 'elevate-website-builder-env';
const serviceId = process.env.NORTHFLANK_BUILDER_SERVICE_ID || 'elevate-website-builder';
const execute = process.argv.includes('--execute');

if (!token) throw new Error('NORTHFLANK_API_TOKEN is required');

const ALLOWED_KEYS = new Set([
  // Supabase/auth
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_PROJECT_REF',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  // OpenAI/PARIS and voice
  'OPENAI_API_KEY',
  'OPENAI_PROJECT_ID',
  'OPENAI_ORG_ID',
  'ELEVENLABS_API_KEY',
  // Payments/entitlement
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  // Messaging used by trial/onboarding flows
  'SENDGRID_API_KEY',
  'RESEND_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  // Cache / rate limiting
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'REDIS_URL',
  // Domain management
  'DOMAINEE_API_KEY',
  'DOMAINEE_API_URL',
  'DOMAINEE_WEBHOOK_SECRET',
  // Public service URLs/config
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_ADMIN_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_LMS_URL',
  'NEXT_PUBLIC_BUILDER_URL',
  'NEXT_PUBLIC_ORG_NAME',
  'NEXT_PUBLIC_SUPPORT_EMAIL',
  'NEXT_PUBLIC_SUPPORT_PHONE',
]);

const REQUIRED_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXTAUTH_SECRET',
  'OPENAI_API_KEY',
];

async function nf(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!response.ok) throw new Error(`Northflank ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`);
  return body.data ?? body;
}

function extractVariables(secret) {
  const variables = secret?.secrets?.variables || secret?.data?.secrets?.variables || {};
  if (!variables || typeof variables !== 'object') return {};
  return variables;
}

async function main() {
  const source = await nf(`/projects/${projectId}/secrets/${sourceSecretId}`);
  const sourceVariables = extractVariables(source);
  const selected = {};
  for (const [key, value] of Object.entries(sourceVariables)) {
    if (ALLOWED_KEYS.has(key) && value !== undefined && value !== null && String(value) !== '') {
      selected[key] = String(value);
    }
  }

  // Canonical public Builder URL belongs to this service even if the source
  // production group predates the standalone Builder.
  selected.NEXT_PUBLIC_BUILDER_URL = 'https://builder.elevateforhumanity.org';
  selected.NEXTAUTH_URL = 'https://builder.elevateforhumanity.org';

  const missing = REQUIRED_KEYS.filter((key) => !selected[key]);
  console.log(JSON.stringify({
    execute,
    projectId,
    sourceSecretId,
    builderSecretId,
    serviceId,
    copiedKeyCount: Object.keys(selected).length,
    copiedKeys: Object.keys(selected).sort(),
    missingRequired: missing,
  }, null, 2));

  if (missing.length) {
    throw new Error(`Refusing Builder secret sync; source group is missing required keys: ${missing.join(', ')}`);
  }
  if (!execute) return;

  let exists = true;
  try {
    await nf(`/projects/${projectId}/secrets/${builderSecretId}`);
  } catch (error) {
    if (String(error).includes('404')) exists = false;
    else throw error;
  }

  const payload = {
    name: builderSecretId,
    description: 'Least-privilege runtime environment for Elevate Website Builder',
    priority: 20,
    type: 'secret',
    secretType: 'environment',
    restrictions: {
      restricted: true,
      nfObjects: [{ id: serviceId, type: 'service' }],
      tagMatchCondition: 'or',
    },
    secrets: { variables: selected },
  };

  if (exists) {
    await nf(`/projects/${projectId}/secrets/${builderSecretId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } else {
    await nf(`/projects/${projectId}/secrets`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  console.log(`Builder secret group ${builderSecretId} synchronized with ${Object.keys(selected).length} least-privilege variables.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
