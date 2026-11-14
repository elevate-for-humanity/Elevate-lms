import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const targetDirs = ['app', 'components', 'data'];

const searchPatterns = [
  { regex: /SNAP E&T/g, replacement: 'Gov Portal' },
  { regex: /FSSA IMPACT/g, replacement: 'FSSA Gov Portal' },
  { regex: /FSSA Gov Portal: Gov Portal Attendance\/Budget/g, replacement: 'FSSA Gov Portal: Attendance & Budget' }
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

      for (const pattern of searchPatterns) {
        if (pattern.regex.test(content)) {
          content = content.replace(pattern.regex, pattern.replacement);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`[Renaming] Updated: ${fullPath}`);
      }
    }
  }
}

console.log('--- STARTING FSSA RENAMING ---');
targetDirs.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) processDirectory(fullPath);
});
console.log('--- RENAMING COMPLETE ---');
