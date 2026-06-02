#!/usr/bin/env tsx
/**
 * Print Northflank CNAME targets for Durable DNS (after TXT verification).
 *
 *   pnpm tsx scripts/northflank/print-cname-targets.ts
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
  console.log(`  Verified:   ${row.verified ? 'yes' : 'no — update DNS in Durable, wait ~15–60 min'}`);
  console.log('');
}

async function main() {
  console.log('\n=== Northflank CNAME records for Durable ===\n');
  await printDomain('www.elevateforhumanity.org');
  await printDomain('admin.elevateforhumanity.org');
  await printDomain('elevateforhumanity.org');
  console.log('Replace AWS ALB CNAMEs with the targets above, then:');
  console.log('  pnpm tsx scripts/northflank/configure-domains.ts --execute\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
