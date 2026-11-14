/**
 * Kill switch for ops/outreach SendGrid scripts.
 *
 * Outbound email is BLOCKED until testing is complete. Use --dry-run to preview
 * HTML locally without sending. After sign-off:
 *
 *   OUTREACH_EMAIL_UNLOCK=1 pnpm tsx --env-file=.env.local scripts/ops/<script>.ts --force-send
 */

export function outreachEmailBlocked(): boolean {
  if (process.argv.includes('--dry-run') || process.argv.includes('--write-only')) return false;
  if (process.argv.includes('--force-send') && process.env.OUTREACH_EMAIL_UNLOCK === '1') {
    return false;
  }
  return true;
}

export function assertOutreachEmailAllowed(scriptName: string): void {
  if (!outreachEmailBlocked()) return;

  console.error(`\n⛔ Outreach email blocked (${scriptName})`);
  console.error('   No outbound email until portal/dashboard testing is complete.');
  console.error('   Preview only:  add --dry-run (writes HTML under exports/email-copies when supported)');
  console.error('   After sign-off: OUTREACH_EMAIL_UNLOCK=1 ... --force-send\n');
  process.exit(1);
}
