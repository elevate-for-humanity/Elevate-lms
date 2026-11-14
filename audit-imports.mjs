import fs from 'fs';
import path from 'path';

const root = process.cwd();

function getAllFiles(dir, exts) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        if (e.name !== 'node_modules' && !e.name.startsWith('.')) walk(full);
      } else if (exts.some(ext => e.name.endsWith(ext))) {
        files.push(full);
      }
    }
  }
  walk(dir);
  return files;
}

function extractImports(content) {
  const imports = [];
  const regex = /import\s+(?:[\w*{}\s,]+from\s+)?['"]([^'"]+)['"]/g;
  let m;
  while ((m = regex.exec(content)) !== null) imports.push(m[1]);
  return imports;
}

function resolve(imp) {
  if (!imp.startsWith('@/')) return null;
  const rel = imp.slice(2);
  const resolved = path.join(root, rel);
  const exts = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
  for (const ext of exts) {
    if (fs.existsSync(resolved + ext)) return resolved + ext;
  }
  return fs.existsSync(resolved) ? resolved : null;
}

const files = getAllFiles(path.join(root, 'app'), ['.ts', '.tsx']);
files.push(...getAllFiles(path.join(root, 'components'), ['.ts', '.tsx']));
files.push(...getAllFiles(path.join(root, 'lib'), ['.ts', '.tsx']));

const missing = new Map();

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    const imports = extractImports(content);
    for (const imp of imports) {
      if (imp.startsWith('@/')) {
        const resolved = resolve(imp);
        if (!resolved || !fs.existsSync(resolved)) {
          const key = `${path.relative(root, file)}: ${imp}`;
          missing.set(key, true);
        }
      }
    }
  } catch (e) { /* ignore */ }
}

if (missing.size > 0) {
  const err = new Error('Found ' + missing.size + ' broken imports');
  // @ts-ignore
  err.missing = Array.from(missing.keys());
  console.error(err.message);
  for (const [k] of missing) {
    console.error('  ' + k);
  }
}
