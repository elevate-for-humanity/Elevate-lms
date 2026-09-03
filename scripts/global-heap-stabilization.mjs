import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const targetDirs = ['app'];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        processDirectory(fullPath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      if (content.includes('force-static')) {
        content = content.replace(/force-static/g, 'force-dynamic');
        changed = true;
      }
      
      if (content.includes('generateStaticParams')) {
        content = content.replace(/export function generateStaticParams/g, '// generateStaticParams disabled');
        content = content.replace(/export async function generateStaticParams/g, '// generateStaticParams disabled');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`[HEAP FIX] Stabilized: ${fullPath}`);
      }
    }
  }
}

console.log('--- STARTING GLOBAL HEAP STABILIZATION ---');
targetDirs.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) processDirectory(fullPath);
});
console.log('--- STABILIZATION COMPLETE ---');
