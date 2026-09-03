import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const targetDirs = ['app', 'components', 'lib', 'data'];

const image8_fix = '/images/gallery/image2.webp';
const community_fix = '/images/pages/about-hero.webp';

function auditAndFix(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        auditAndFix(fullPath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.json')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      if (content.includes('image8.jpg')) {
        content = content.replace(/\/images\/gallery\/image8\.jpg/g, image8_fix);
        changed = true;
      }
      if (content.includes('community-page-2.jpg')) {
        content = content.replace(/\/images\/pages\/community-page-2\.jpg/g, community_fix);
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`[Fixed Resource] ${fullPath}`);
      }
    }
  }
}

console.log('--- STARTING FINAL RESOURCE AUDIT ---');
targetDirs.forEach(d => {
    const p = path.join(rootDir, d);
    if (fs.existsSync(p)) auditAndFix(p);
});
console.log('--- AUDIT COMPLETE ---');
