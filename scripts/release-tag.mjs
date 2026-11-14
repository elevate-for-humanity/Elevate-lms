import { execSync } from 'node:child_process';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const ver = pkg.version;
const tag = 'v' + ver;
try {
  execSync(`git tag ${tag}`);
  execSync(`git push origin ${tag}`);
} catch (e) {
  console.error('Tagging failed:', e.message);
  process.exit(1);
}
