#!/usr/bin/env tsx
/**
 * Register Elevate production domains on the Northflank team (TXT verification required).
 *
 *   pnpm tsx scripts/northflank/register-domains.ts
 *   pnpm tsx scripts/northflank/register-domains.ts --verify
 *
 * After adding TXT records at your DNS provider, run with --verify to poll Northflank verification.
 */

import { nfFetch, resolveTeamId } from './lib';

const DOMAINS = [
  'elevateforhumanity.org',
  'www.elevateforhumanity.org',
  'admin.elevateforhumanity.org',
] as const;

type TeamDomain = {
  name: string;
  status: string;
  hostname?: string;
  token?: string;
};

function teamDomainsPath(teamId: string, suffix = ''): string {
  return `/teams/${teamId}/domains${suffix}`;
}

async function listDomains(teamId: string): Promise<TeamDomain[]> {
  const data = await nfFetch<{ domains: TeamDomain[] }>(teamDomainsPath(teamId));
  return data.domains ?? [];
}

async function registerDomain(teamId: string, domain: string): Promise<TeamDomain> {
  return nfFetch<TeamDomain>(teamDomainsPath(teamId), {
    method: 'POST',
    body: JSON.stringify({ domain }),
  });
}

async function verifyDomain(teamId: string, domain: string): Promise<void> {
  await nfFetch(teamDomainsPath(teamId, `/${encodeURIComponent(domain)}/verify`), {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

function printDnsInstructions(domains: TeamDomain[]) {
  console.log('\n=== DNS verification (TXT records) ===\n');
  for (const d of domains) {
    console.log(`${d.name}  status=${d.status}`);
    if (d.hostname && d.token) {
      console.log(`  Record type: TXT`);
      console.log(`  Name/Host:   ${d.hostname}`);
      console.log(`  Value:       ${d.token}`);
    } else if (d.status === 'verified') {
      console.log('  Already verified — link to service ports next.');
    }
    console.log('');
  }
  console.log(
    'Add each TXT record at your DNS host (Cloudflare/registrar), then:\n' +
      '  pnpm tsx scripts/northflank/register-domains.ts --verify\n' +
      '  pnpm tsx scripts/northflank/configure-domains.ts --execute\n',
  );
}

async function main() {
  const teamId = resolveTeamId();
  if (!teamId) {
    console.error('Set NORTHFLANK_TEAM_ID (default: elevates-team)');
    process.exit(1);
  }

  const verifyOnly = process.argv.includes('--verify');
  let domains = await listDomains(teamId);
  const existing = new Set(domains.map((d) => d.name));

  if (!verifyOnly) {
    for (const domain of DOMAINS) {
      if (existing.has(domain)) {
        console.log(`Already registered: ${domain}`);
        continue;
      }
      console.log(`Registering: ${domain}`);
      const created = await registerDomain(teamId, domain);
      existing.add(created.name);
    }
    domains = await listDomains(teamId);
  }

  if (process.argv.includes('--verify')) {
    for (const domain of DOMAINS) {
      const row = domains.find((d) => d.name === domain);
      if (!row) continue;
      if (row.status === 'verified') {
        console.log(`Verified: ${domain}`);
        continue;
      }
      try {
        await verifyDomain(teamId, domain);
        console.log(`Verified: ${domain}`);
      } catch (e) {
        console.warn(`Not verified yet: ${domain} — ${(e as Error).message}`);
      }
    }
    domains = await listDomains(teamId);
  }

  printDnsInstructions(domains.filter((d) => DOMAINS.includes(d.name as (typeof DOMAINS)[number])));

  const pending = domains.filter(
    (d) => DOMAINS.includes(d.name as (typeof DOMAINS)[number]) && d.status !== 'verified',
  );
  if (pending.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
