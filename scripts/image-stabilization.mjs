import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const targetDirs = ['app', 'components', 'config', 'lms-data'];

const placeholderImage = '/images/pages/training-classroom.webp';

function fixImages(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        fixImages(fullPath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.json')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Rule 1: Replace common broken media paths with the existing /images/ folder equivalents
      if (content.includes('/media/')) {
          content = content.replace(/\/media\/programs\/cna-hd\.jpg/g, '/images/programs/efh-cna-hero.jpg');
          content = content.replace(/\/media\/programs\/barber-hd\.jpg/g, '/images/programs/efh-barber-hero.jpg');
          content = content.replace(/\/media\/programs\/hvac-hd\.jpg/g, '/images/programs/efh-hvac-hero.jpg');
          
          // Rule 2: Generic fallback for any other /media/ path to prevent crash
          // We use a regex to find strings starting with /media/ and ending in .jpg/.png
          const mediaRegex = /"\/media\/[^"]+\.(jpg|png|webp|jpeg)"/g;
          content = content.replace(mediaRegex, `"${placeholderImage}"`);
          changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`[Stabilization] Fixed image paths: ${fullPath}`);
      }
    }
  }
}

console.log('--- STARTING IMAGE STABILIZATION ---');
targetDirs.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) fixImages(fullPath);
});
console.log('--- STABILIZATION COMPLETE ---');
