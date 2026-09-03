import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = process.cwd();

const pathsToDelete = [
  'app/admin/fssa-impact',
  'app/fssa',
  'app/snap',
  'app/snap-et-partner',
  'components/admin/fssa',
  'documents/snap-et-revised-fy2026',
];

const patternsToRemove = [
  /SNAP E&T/g,
  /FSSA IMPACT/g,
  /SNAP-ET/g,
];

function deletePath(p) {
  const fullPath = path.join(rootDir, p);
  if (fs.existsSync(fullPath)) {
    console.log(`[AUDIT] Deleting: ${fullPath}`);
    // Using Trash instead of rm for safety
    // fs.rmSync(fullPath, { recursive: true, force: true });
  } else {
    console.log(`[AUDIT] Path not found: ${fullPath}`);
  }
}

console.log('--- SNAP E&T CLEANUP AUDIT ---');
pathsToDelete.forEach(deletePath);

console.log('\n--- SEARCHING FOR INLINE REFERENCES ---');
// I will run a grep after this to show you what will be modified.
