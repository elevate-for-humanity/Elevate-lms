#!/usr/bin/env node
/**
 * @deprecated Use scripts/ops/apprentice-week-hours.mjs (all barber + cosmetology apprentices).
 * Thin wrapper kept for existing runbooks.
 */
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const child = spawnSync(process.execPath, [join(here, 'apprentice-week-hours.mjs'), ...process.argv.slice(2)], {
  stdio: 'inherit',
});
process.exit(child.status ?? 1);
