#!/usr/bin/env node

/**
 * Add server-side auth guards to protected routes
 * Adds Supabase auth check and redirect for unauthorized access
 */

import fs from 'node:fs';
import path from 'node:path';

const filesPath = '/tmp/auth_guard_files.txt';
if (!fs.existsSync(filesPath)) {
  console.error('Run archetype mapper first to generate file list');
  process.exit(1);
}

const uniqueFiles = fs.readFileSync(filesPath, 'utf8').trim().split('\n').filter(Boolean);

const AUTH_GUARD = `import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

`;

const AUTH_CHECK = `  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

`;

let added = 0;

for (const file of uniqueFiles) {
  if (!fs.existsSync(file)) {
    console.warn(`Skipping missing file: ${file}`);
    continue;
  }

  let content = fs.readFileSync(file, 'utf8');

  // Check if already has auth guard
  if (/createServerClient|getServerSession|cookies\(|headers\(/.test(content)) {
    continue;
  }

  // Check if it's already an async function
  const hasAsyncDefault = /export\s+default\s+async\s+function/.test(content);

  if (!hasAsyncDefault) {
    // Convert to async if needed
    content = content.replace(
      /export\s+default\s+function\s+(\w+)/,
      'export default async function $1',
    );
  }

  // Add imports at top (after 'use client' if present)
  const lines = content.split('\n');
  let importIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("'use client'") || lines[i].includes('"use client"')) {
      importIndex = i + 1;
      break;
    }
    if (lines[i].trim().startsWith('import ')) {
      importIndex = 0;
      break;
    }
  }

  // Check if imports already exist
  if (!content.includes("from '@/lib/supabase/server'")) {
    lines.splice(importIndex, 0, AUTH_GUARD.trim());
  }

  content = lines.join('\n');

  // Add auth check at start of function body
  content = content.replace(
    /(export\s+default\s+async\s+function\s+\w+[^{]*\{)/,
    `$1\n${AUTH_CHECK}`,
  );

  fs.writeFileSync(file, content, 'utf8');
  added++;
}
