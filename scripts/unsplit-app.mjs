import fs from 'node:fs';
import path from 'node:path';

/**
 * UN-SPLIT: Restores all quarantined folders.
 */

const root = process.cwd();
const appDir = path.join(root, 'app');

if (!fs.existsSync(appDir)) {
  console.error('app directory not found');
  process.exit(1);
}

const items = fs.readdirSync(appDir);

items.forEach(item => {
  if (item.startsWith('__split_') || item.startsWith('__')) {
    const oldPath = path.join(appDir, item);
    // Remove split prefix
    const newName = item.replace(/^__split_[A-Z]+_/, '').replace(/^__/, '');
    const newPath = path.join(appDir, newName);
    
    console.log(`Restoring: ${item} -> ${newName}`);
    try {
      // If newPath already exists, we might have a conflict. Handle carefully.
      if (fs.existsSync(newPath)) {
        console.log(`  Conflict: ${newName} already exists. Skipping.`);
      } else {
        fs.renameSync(oldPath, newPath);
      }
    } catch (e) {
      console.log(`  Failed: ${e.message}`);
    }
  }
});

console.log('✅ Un-split complete.');
