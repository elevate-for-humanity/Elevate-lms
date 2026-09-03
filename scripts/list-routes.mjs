import fs from 'fs';
import path from 'path';

const appDir = path.join(process.cwd(), 'app');
const routes = [];

function walk(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip special Next.js folders
      if (entry.name.startsWith('_') || entry.name === 'api') continue;
      walk(full, prefix + '/' + entry.name);
    } else if (
      entry.name === 'page.tsx' ||
      entry.name === 'page.jsx' ||
      entry.name === 'page.js' ||
      entry.name === 'page.ts'
    ) {
      // Normalize root
      let route = prefix === '' ? '/' : prefix;
      // Remove route groups (legal) -> /legal
      route = route.replace(/\/\([^)]+\)/g, '');
      // Remove dynamic segments for now
      if (!route.includes('[')) {
        routes.push(route);
      }
    }
  }
}

walk(appDir);

const unique = Array.from(new Set(routes)).sort();
