#!/usr/bin/env tsx
/**
 * Configure Sentry inbound filters to reduce noise.
 * 
 * Usage: SENTRY_AUTH_TOKEN=xxx SENTRY_ORG=elevate-for-humanity SENTRY_PROJECT=elevate-lms npx tsx scripts/configure-sentry-filters.ts
 * 
 * Or set these in .env.local:
 *   SENTRY_AUTH_TOKEN=xxx
 *   SENTRY_ORG=elevate-for-humanity
 *   SENTRY_PROJECT=elevate-lms
 */

import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false, quiet: true });
}

const SENTRY_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const SENTRY_ORG = process.env.SENTRY_ORG || 'elevate-for-humanity';
const SENTRY_PROJECT = process.env.SENTRY_PROJECT || 'elevate-lms';

if (!SENTRY_TOKEN) {
  console.error('❌ Missing SENTRY_AUTH_TOKEN');
  console.error('   Get from: https://sentry.io/settings/account/api/auth-tokens/');
  console.error('   Required scope: project:write');
  process.exit(1);
}

const API_BASE = 'https://sentry.io/api/0';

async function sentryFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SENTRY_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sentry API ${res.status}: ${text}`);
  }
  return res.json();
}

interface FilterConfig {
  id: string;
  name: string;
  description: string;
  curl: string;
}

// Inbound filters to create
const FILTERS: FilterConfig[] = [
  {
    id: 'ignored',
    name: 'Invalid Image 404s',
    description: 'Ignore Next.js image optimization 404s for missing Supabase storage images',
    curl: `curl -X PUT \\
  "https://sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/filters/" \\
  -H "Authorization: Bearer ${SENTRY_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{"id":"ignored","active":true}'',
  },
  {
    id: 'browser-extension',
    name: 'Browser Extension Errors',
    description: 'Ignore errors from browser extensions',
    curl: `curl -X PUT \\
  "https://sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/filters/" \\
  -H "Authorization: Bearer ${SENTRY_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{"id":"browser-extension","active":true}'',
  },
  {
    id: 'localhost',
    name: 'Localhost Errors',
    description: 'Ignore errors from localhost development',
    curl: `curl -X PUT \\
  "https://sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/filters/" \\
  -H "Authorization: Bearer ${SENTRY_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{"id":"localhost","active":true}'',
  },
  {
    id: 'web-crawler',
    name: 'Web Crawler Errors',
    description: 'Ignore errors from web crawlers/bots',
    curl: `curl -X PUT \\
  "https://sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/filters/" \\
  -H "Authorization: Bearer ${SENTRY_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{"id":"web-crawler","active":true}'',
  },
];

// Error patterns to suppress via client-side filtering
const ERROR_PATTERNS_TO_SUPPRESS = [
  {
    pattern: "The requested resource isn't a valid image",
    reason: 'Missing images in Supabase storage - known issue, not actionable',
    sampleError: 'GET /_next/image with 404 for /images/pages/*.jpg',
  },
  {
    pattern: 'POST /api/track-usage',
    reason: 'Client disconnects during tracking - expected behavior',
    sampleError: 'aborted - client closed connection',
  },
  {
    pattern: 'Redis unavailable',
    reason: 'Infrastructure issue, already handled gracefully',
    sampleError: '[rate-limit] Redis unavailable',
  },
  {
    pattern: 'transformAlgorithm is not a function',
    reason: 'Node.js internal HTTP handling, not actionable',
    sampleError: 'TypeError: controller[kState].transformAlgorithm',
  },
  {
    pattern: 'Webhook signature verification failed',
    reason: 'External spam/attacks on webhook endpoints',
    sampleError: 'No signatures found matching expected signature',
  },
  {
    pattern: 'fetch failed',
    reason: 'External API timeouts, handled gracefully',
    sampleError: 'TypeError: fetch failed',
  },
];

async function configureFilters() {
  console.log('🎯 Configuring Sentry Inbound Filters\n');
  console.log(`Organization: ${SENTRY_ORG}`);
  console.log(`Project: ${SENTRY_PROJECT}\n`);

  // Get current filter settings
  console.log('📋 Fetching current filter settings...');
  try {
    const filters = await sentryFetch(
      `/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/filters/`
    ) as Array<{ id: string; active: boolean }>;
    
    console.log('Current filters:');
    filters.forEach(f => {
      console.log(`  ${f.active ? '✅' : '❌'} ${f.id}`);
    });
    console.log('');
  } catch (e) {
    console.log('⚠️  Could not fetch current filters (may need different API endpoint)\n');
  }

  // Apply filter settings via drop rules (project settings)
  console.log('🔧 Filter Configuration (via Sentry Dashboard):\n');

  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('MANUAL CONFIGURATION REQUIRED IN SENTRY DASHBOARD');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  console.log('1. Go to: https://sentry.io/settings/elevate-for-humanity/elevate-lms/filters/\n');

  console.log('2. Enable these built-in filters:\n');
  console.log('   ✅ Ignore Errors from "Invalid Image 404s"');
  console.log('      → This handles: GET /_next/image with "isn\'t a valid image"\n');
  console.log('   ✅ Ignore Errors from Browser Extensions');
  console.log('   ✅ Ignore Errors from localhost');
  console.log('   ✅ Ignore Errors from Web Crawlers\n');

  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('DROPDOWN FILTER RULES (for specific error patterns)');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  console.log('3. Go to: https://sentry.io/settings/elevate-for-humanity/elevate-lms/dropdown-filters/\n');

  const rules = [
    {
      name: 'Drop: Track-usage Aborted',
      condition: 'event.message contains "aborted" AND event.request.url contains "/api/track-usage"',
      action: 'drop',
    },
    {
      name: 'Drop: Redis Unavailable (handled gracefully)',
      condition: 'event.message contains "Redis unavailable"',
      action: 'drop',
    },
    {
      name: 'Drop: Node Internal Errors',
      condition: 'event.exception.values[0].value contains "transformAlgorithm is not a function"',
      action: 'drop',
    },
    {
      name: 'Drop: Webhook Spam',
      condition: 'event.message contains "Webhook signature verification failed" AND event.count < 10',
      action: 'drop',
    },
    {
      name: 'Drop: External API Fetch Failed',
      condition: 'event.exception.values[0].value contains "fetch failed"',
      action: 'drop',
    },
  ];

  rules.forEach((rule, i) => {
    console.log(`   Rule ${i + 1}: ${rule.name}`);
    console.log(`      Condition: ${rule.condition}`);
    console.log(`      Action: ${rule.action}\n`);
  });

  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('BULK ACTIONS FOR EXISTING ERRORS');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  console.log('To suppress existing noisy errors:\n');

  ERROR_PATTERNS_TO_SUPPRESS.forEach(({ pattern, reason }) => {
    console.log(`   1. Search for: "${pattern}"`);
    console.log(`      2. Select all → Actions → Ignore (set to 1 hour / 1 day / 1 week)\n`);
  });

  console.log('═══════════════════════════════════════════════════════════════════════\n');
  console.log('✅ FILTER CONFIGURATION GUIDE COMPLETE\n');
  console.log('Run this script with SENTRY_AUTH_TOKEN to verify settings:\n');
  console.log(`   SENTRY_AUTH_TOKEN=${SENTRY_TOKEN} npx tsx scripts/configure-sentry-filters.ts\n`);
}

// Script to generate server-side error filtering (for next.config.js)
function generateServerFilterCode(): string {
  return `
# Sentry Server-Side Filtering (add to next.config.js)

# Use @sentry/nextjs server config (sentry.server.config.ts)

// Custom ignore rules for server-side filtering
const SENTRY_IGNORE_ERRORS = [
  // Client disconnects (expected behavior)
  /aborted/,
  
  // Node.js internal errors (not actionable)
  /transformAlgorithm is not a function/,
  
  // Image optimization 404s (known issue)
  /isn't a valid image/,
  
  // Webhook spam
  /Webhook signature verification failed/,
  
  // Redis unavailable (handled gracefully)
  /Redis unavailable/,
];

// Apply in init:
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  ignoreErrors: SENTRY_IGNORE_ERRORS,
  // ... other config
});
`;
}

// Main execution
configureFilters()
  .then(() => {
    console.log('\n📝 Server-side filter code snippet:\n');
    console.log(generateServerFilterCode());
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
