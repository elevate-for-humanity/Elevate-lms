import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const outPath = path.join(process.cwd(), 'public', 'build.json');

// Get full git SHA
let gitCommitFull = process.env.COMMIT_REF ?? null;
try {
  gitCommitFull = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
} catch (e) {
  // Fall back to COMMIT_REF if git command fails
}

const payload = {
  builtAt: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV ?? null,
  gitCommit: gitCommitFull,
  gitCommitShort: gitCommitFull ? gitCommitFull.substring(0, 8) : null,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
console.log('Wrote', outPath, payload);
