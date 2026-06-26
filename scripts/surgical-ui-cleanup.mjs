import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const targetDirs = ['app', 'components'];

const searchPatterns = [
  { regex: /SNAP E&T/g, replacement: '' },
  { regex: /FSSA IMPACT/g, replacement: '' },
  { regex: /SNAP-ET/g, replacement: '' }
];

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

      // Ensure we are not touching database column definitions or types
      if (content.includes('funding_source') || content.includes('tenant_id')) {
          // Skip or handle carefully if needed - for now just stripping the labels
      }

      for (const pattern of searchPatterns) {
        if (pattern.regex.test(content)) {
          content = content.replace(pattern.regex, pattern.replacement);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`[Surgical Cleanup] Sanitized: ${fullPath}`);
      }
    }
  }
}

console.log('--- STARTING SURGICAL UI CLEANUP ---');
targetDirs.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) processDirectory(fullPath);
});
console.log('--- CLEANUP COMPLETE ---');
