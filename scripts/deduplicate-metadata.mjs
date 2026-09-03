#!/usr/bin/env node

/**
 * Deduplicate metadata titles by adding route context
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// Get duplicate metadata from archetype mapper
const output = execSync('node scripts/archetype-mapper.mjs 2>&1', { encoding: 'utf8' });
const lines = output.split('\n').filter((line) => line.includes('Duplicate metadata title'));

const duplicates = [];

for (const line of lines) {
  const titleMatch = line.match(/"([^"]+)"/);
  const routesMatch = line.match(/routes: (.+)$/);

  if (titleMatch && routesMatch) {
    const title = titleMatch[1];
    const routes = routesMatch[1].split(', ');
    duplicates.push({ title, routes });
  }
}

function routeToContextualTitle(route) {
  // Extract meaningful context from route
  const parts = route.split('/').filter(Boolean);

  if (parts.length === 0) return 'Home';

  // Get role/context from first part
  const context = parts[0]
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // Get page name from last part
  const pageName = parts[parts.length - 1]
    .replace(/\[([^\]]+)\]/, (_, param) => {
      return param.charAt(0).toUpperCase() + param.slice(1);
    })
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // Combine context + page name
  if (parts.length === 1) {
    return pageName;
  }

  return `${context} ${pageName}`;
}

let fixed = 0;

for (const { title, routes } of duplicates) {
  for (const route of routes) {
    // Convert route to file path
    const filePath = path.join(process.cwd(), 'app', route, 'page.tsx');

    if (!fs.existsSync(filePath)) {
      console.warn(`Skipping missing file: ${filePath}`);
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Generate contextual title
    const newTitle = routeToContextualTitle(route);
    const fullNewTitle = `${newTitle} | Elevate For Humanity`;

    // Replace metadata title
    const oldTitlePattern = new RegExp(
      `title:\\s*['"\`]${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`,
      'g',
    );

    if (oldTitlePattern.test(content)) {
      content = content.replace(oldTitlePattern, `title: '${fullNewTitle}'`);
      fs.writeFileSync(filePath, content, 'utf8');
      fixed++;
    }
  }
}
