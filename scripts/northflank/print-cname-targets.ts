#!/usr/bin/env tsx
/**
 * Print canonical Northflank CNAME targets for DNS verification.
 *
 *   npx tsx scripts/northflank/print-cname-targets.ts
 */

import { nfFetch, resolveTeamId } from './lib';

type SubdomainRow = {
  fullName?: string;
  content?: string;
  verified?: boolean;
};

async function printDomain(domain: string) {
  const teamId = resolveTeamId();
  if (!teamId) throw new Error('Set NORTHFLANK_TEAM_ID');
  const row = await nfFetch<SubdomainRow>(
    `/teams/${teamId}/domains/${encodeURIComponent(domain)}/subdomains/@`,
  );
  console.log(`${row.fullName ?? domain}`);
  console.log(`  CNAME host: @ (or ${domain})`);
  console.log(`  Target:     ${row.content ?? '(unknown)'}`);
  console.log(`  Verified:   ${row.verified ? 'yes' : 'no — update DNS and allow propagation'}`);
  console.log('');
}

async function main() {
  console.log('\n=== Canonical Northflank CNAME records ===\n');
  await printDomain('www.elevateforhumanity.org');
  await printDomain('app.elevateforhumanity.org');
  await printDomain('admin.elevateforhumanity.org');

  console.log('=== Apex redirect (not an application service CNAME) ===\n');
  console.log('elevateforhumanity.org');
  console.log('  Permanent redirect -> https://www.elevateforhumanity.org');
  console.log('  Do not attach the apex to Marketing, LMS, or Admin as a service fallback.\n');

  console.log('Full runbook: docs/northflank-dns-durable.md');
  console.log('After DNS propagates:');
  console.log('  npx tsx scripts/northflank/configure-domains.ts --execute\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
