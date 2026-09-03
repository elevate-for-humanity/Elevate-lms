import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appDir = path.join(root, 'app');

function getRoutes(dir, base = '') {
  let routes = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      routes = [...routes, ...getRoutes(path.join(dir, item.name), path.join(base, item.name))];
    } else if (item.name === 'page.tsx') {
      routes.push(base.replace(/\\/g, '/') || '/');
    }
  }
  return routes;
}

const allRoutes = getRoutes(appDir);
console.log('--- MASTER ROUTE INVENTORY ---');
console.log(JSON.stringify(allRoutes, null, 2));
