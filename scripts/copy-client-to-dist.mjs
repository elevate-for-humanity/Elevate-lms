import { cpSync, rmSync } from 'node:fs';
import { join } from 'node:path';

// Remove old HTML files from dist root (keep other assets)
const filesToRemove = ['index.html', 'about', 'contact', 'lms', 'programs'];
filesToRemove.forEach((file) => {
  try {
    rmSync(join('dist', file), { recursive: true, force: true });
  } catch (e) {
    // Ignore if doesn't exist
  }
});

// Copy all files from dist/client to dist root
cpSync('dist/client', 'dist', { recursive: true, force: true });
