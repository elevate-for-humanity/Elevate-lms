import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = process.cwd();

const mappings = [
  { from: /\/student-portal\/billing/g, to: '/apprentice/billing' },
  { from: /\/student-portal\/onboarding/g, to: '/onboarding/learner' },
  { from: /\/student-portal\/dashboard/g, to: '/learner/dashboard' },
  { from: /\/student-portal\/documents/g, to: '/apprentice/documents' },
  { from: /\/student-portal\/hours/g, to: '/apprentice/hours' },
  { from: /\/student-portal\/profile/g, to: '/apprentice/profile' },
  { from: /\/student-portal\/messages/g, to: '/lms/messages' },
  { from: /\/student-portal/g, to: '/learner/dashboard' },
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        processDir(fullPath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const mapping of mappings) {
        if (mapping.from.test(content)) {
          content = content.replace(mapping.from, mapping.to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

console.log('Starting /student-portal link cleanup...');
processDir(path.join(rootDir, 'app'));
processDir(path.join(rootDir, 'components'));
console.log('Cleanup complete.');
