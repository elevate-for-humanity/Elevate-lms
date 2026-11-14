import { existsSync, mkdirSync, symlinkSync, lstatSync, readdirSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const app = process.argv[2];
if (!['marketing', 'admin', 'lms'].includes(app)) throw new Error('Expected marketing, admin or lms');
const destination = resolve(root, 'apps', app, 'public');
mkdirSync(destination, { recursive: true });
// Docker packages these shared assets into each service's public directory.
// Next dev serves only the app-local public directory; mirror that contract
// without copying the media library or overriding app-specific PWA assets.
function mirror(source, target) {
  let entry;
  try { entry = lstatSync(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!entry) {
    symlinkSync(relative(dirname(target), source), target, lstatSync(source).isDirectory() ? 'dir' : 'file');
    return;
  }
  if (entry.isDirectory() && lstatSync(source).isDirectory()) {
    for (const name of readdirSync(source)) mirror(resolve(source, name), resolve(target, name));
  }
}
for (const directory of ['images', 'hero-images', 'fonts', 'videos', 'audio']) {
  const source = resolve(root, 'public', directory);
  if (existsSync(source)) mirror(source, resolve(destination, directory));
}
console.log(`[dev-public] ${app}: shared media available; app-specific assets preserved`);
