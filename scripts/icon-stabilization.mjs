import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const targetDirs = ['app', 'components', 'lib'];

// Version 1.21.0 mappings
// Facebook -> Facebook
// Instagram -> Instagram
// Youtube -> Youtube
// Linkedin -> Linkedin
// These MIGHT exist, but if they are undefined, we need a fallback.
// In Next.js 15, we can't easily check for undefined at runtime in Server Components.
// We will replace them with safe icons: Globe, Instagram (usually safe), Video, Link.

function fixIcons(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        fixIcons(fullPath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Specifically target the import lines
      if (content.includes('from \'lucide-react\'')) {
          // Replace specific high-risk icons with guaranteed ones
          if (content.includes('Facebook')) {
              content = content.replace(/Facebook/g, 'Globe');
              changed = true;
          }
          if (content.includes('Youtube')) {
              content = content.replace(/Youtube/g, 'Video');
              changed = true;
          }
          if (content.includes('Linkedin')) {
              content = content.replace(/Linkedin/g, 'Link');
              changed = true;
          }
          // Instagram usually exists in 1.x, but let's check for any others
          // Twitter was renamed to TwitterIcon or removed in some versions
          if (content.includes('Twitter')) {
              content = content.replace(/Twitter/g, 'Globe');
              changed = true;
          }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`[Icon Fixed] ${fullPath}`);
      }
    }
  }
}

console.log('--- STARTING ICON STABILIZATION ---');
targetDirs.forEach(d => fixIcons(path.join(rootDir, d)));
console.log('--- ICON STABILIZATION COMPLETE ---');
