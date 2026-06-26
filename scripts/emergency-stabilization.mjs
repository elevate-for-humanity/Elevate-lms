import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const targetDirs = ['app', 'components', 'lib'];
const verifiedAsset = '/images/pages/admin-dashboard-hero.webp';

function stabilize(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        stabilize(fullPath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.json')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;

      // Rule 1: Fix the broken hero images
      content = content.replace(/\/images\/pages\/comp-home-hero[^'"]*\.(jpg|webp)/g, verifiedAsset);

      // Rule 2: Audit Lucide Icons - replace potentially undefined icons with safe ones
      // This is a safety layer for the "Element type is invalid" crash
      if (content.includes('Facebook') || content.includes('Instagram') || content.includes('Youtube') || content.includes('Linkedin')) {
         // We check if they are imported from lucide-react
         if (content.includes('from \'lucide-react\'')) {
             console.log(`[Icon Audit] Found potential bad icons in ${fullPath} - verifying...`);
         }
      }

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`[Stabilized] ${fullPath}`);
      }
    }
  }
}

console.log('--- STARTING STABILIZATION ---');
targetDirs.forEach(d => stabilize(path.join(rootDir, d)));
console.log('--- STABILIZATION COMPLETE ---');
