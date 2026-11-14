import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const exts = ['.js', '.jsx', '.ts', '.tsx'];
const root = 'src';
const missing = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full);
    else if (exts.some((e) => full.endsWith(e))) scanFile(full);
  }
}

function scanFile(file) {
  const src = readFileSync(file, 'utf8');
  const regex = /import\s+(?:[^'"]+from\s+)?["'](\.?\.?\/[^"']+)["'];?/g;
  let m;
  while ((m = regex.exec(src))) {
    const imp = m[1];
    if (imp.startsWith('http') || imp.startsWith('@')) continue;
    const resolvedCandidates = exts.map((e) => path.resolve(path.dirname(file), imp + e));
    const indexCandidates = exts.map((e) => path.resolve(path.dirname(file), imp, 'index' + e));
    const exists = [...resolvedCandidates, ...indexCandidates].some((f) => {
      try {
        return statSync(f).isFile();
      } catch {
        return false;
      }
    });
    if (!exists) {
      missing.push({
        file,
        import: imp,
      });
    }
  }
}

walk(root);

if (missing.length) {
  for (const m of missing) {
  }
  process.exitCode = 1;
} else {
}
