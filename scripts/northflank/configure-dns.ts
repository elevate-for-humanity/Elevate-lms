#!/usr/bin/env tsx
/**
 * Configure DNS mapping between Cloudflare and Northflank.
 *
 * Run: npx tsx scripts/northflank/configure-dns.ts
 *
 * Cloudflare owns authoritative DNS for elevateforhumanity.org. Northflank
 * owns the application services and TLS termination for the three production
 * hostnames below.
 */

import { nfFetch, projectApiPath } from './lib';

const SERVICES = [
  {
    name: 'elevate-marketing',
    displayName: 'Marketing',
    publicDomain: 'www.elevateforhumanity.org',
    northflankDomain: 'www.elevateforhumanity.org.elev-5vfk.dns.northflank.app',
  },
  {
    name: 'elevate-lms',
    displayName: 'LMS',
    publicDomain: 'app.elevateforhumanity.org',
    northflankDomain: 'app.elevateforhumanity.org.elev-5vfk.dns.northflank.app',
  },
  {
    name: 'elevate-admin',
    displayName: 'Admin',
    publicDomain: 'admin.elevateforhumanity.org',
    northflankDomain: 'admin.elevateforhumanity.org.elev-5vfk.dns.northflank.app',
  },
];

async function getNorthflankDomains(serviceId: string): Promise<string[]> {
  try {
    const projectId = process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';
    const data = await nfFetch<{ ports: { domains?: { name: string }[]; dns?: string }[] }>(
      projectApiPath(projectId, `/services/${serviceId}/ports`)
    );
    const domains: string[] = [];
    for (const port of data.ports || []) {
      if (port.dns) domains.push(port.dns);
      for (const d of port.domains || []) domains.push(d.name);
    }
    return domains;
  } catch (e) {
    console.error(`  Cannot fetch Northflank config: ${e}`);
    return [];
  }
}

async function main() {
  console.log('\n=== DNS CONFIGURATION: Cloudflare -> Northflank ===\n');
  console.log('STEP 1: In Cloudflare DNS, configure these CNAME records:\n');

  for (const svc of SERVICES) {
    console.log(`${svc.displayName}:`);
    console.log(`  Type:  CNAME`);
    console.log(`  Name:  ${svc.publicDomain}`);
    console.log(`  Value: ${svc.northflankDomain}`);
    console.log('  Proxy: DNS only while Northflank verifies/provisions the domain; enable proxy only after verification if desired.');
    console.log('  TTL:   Auto\n');
  }

  console.log('Apex domain: elevateforhumanity.org must redirect permanently to https://www.elevateforhumanity.org.');
  console.log('Do not point Marketing, LMS, or Admin at Durable, Vercel, or Netlify.\n');

  console.log('STEP 2: In Northflank, verify each service has the matching custom domain:\n');

  for (const svc of SERVICES) {
    console.log(`${svc.name} (${svc.displayName}):`);
    const domains = await getNorthflankDomains(svc.name);
    if (domains.length > 0) {
      console.log(`  Northflank configured: ${domains.join(', ')}`);
    } else {
      console.log('  NOT configured in Northflank');
      console.log(`  -> Northflank -> ${svc.name} -> Ports/Domains -> Add ${svc.publicDomain}`);
    }
  }

  console.log('\n=== CANONICAL OWNERSHIP ===\n');
  console.log('www.elevateforhumanity.org   -> elevate-marketing');
  console.log('app.elevateforhumanity.org   -> elevate-lms');
  console.log('admin.elevateforhumanity.org -> elevate-admin');
  console.log('elevateforhumanity.org       -> 301/308 redirect to https://www.elevateforhumanity.org\n');
}

main().catch(console.error);
