#!/usr/bin/env tsx
/**
 * Prestige Elevation™ — Use unified CLI instead
 * 
 * DEPRECATED: Use the unified CLI for all operations
 * 
 * Usage:
 *   pnpm tsx scripts/cli.ts course build --course=barber
 *   pnpm tsx scripts/cli.ts seed barber
 *   pnpm tsx scripts/cli.ts generate videos --course=barber
 */

import { execSync } from 'child_process';

const args = process.argv.slice(2);
const course = 'barber';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  Prestige Elevation™ - Using Unified CLI');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('Instead of running this script, use:\n');
console.log('  pnpm tsx scripts/cli.ts course build --course=barber');
console.log('  pnpm tsx scripts/cli.ts generate videos --course=barber');
console.log('\nFor specific lessons:');
console.log('  pnpm tsx scripts/cli.ts generate videos --course=barber --slug barber-lesson-1\n');

// If --execute passed, run the unified CLI
if (args.includes('--execute')) {
  const action = args.includes('--videos') ? 'videos' : 'build';
  console.log(`▶ Running: pnpm tsx scripts/cli.ts course ${action} --course=${course}\n`);
  execSync(`pnpm tsx scripts/cli.ts course ${action} --course=${course}`, { stdio: 'inherit' });
} else {
  console.log('Dry run - no action taken. Pass --execute to run.\n');
}
