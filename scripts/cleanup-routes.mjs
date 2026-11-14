#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(__dirname, '..', 'app');

const ROUTES_TO_REMOVE = [
  'app-backup-*',
  '*-old',
  '*-backup',
  '*-redesign',
  '*-new',
  '*.backup',
  '*.disabled',
];

function shouldRemove(name) {
  return ROUTES_TO_REMOVE.some((pattern) => {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return regex.test(name);
  });
}

function cleanupDirectory(dir) {
  const items = fs.readdirSync(dir);
  let removed = 0;

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (shouldRemove(item)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        removed++;
      } else {
        removed += cleanupDirectory(fullPath);
      }
    } else if (shouldRemove(item)) {
      fs.unlinkSync(fullPath);
      removed++;
    }
  }

  return removed;
}

const removed = cleanupDirectory(appDir);
