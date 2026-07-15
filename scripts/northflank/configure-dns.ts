#!/usr/bin/env tsx
/**
 * Configure DNS mapping between Durable and Northflank
 * 
 * Run: npx tsx scripts/northflank/configure-dns.ts
 * 
 * This script shows the required DNS configuration.
 * You need to configure these in Durable.io (or your DNS provider).
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
      for (const d of port.domains || []) {
        domains.push(d.name);
      }
    }
    return domains;
  } catch (e) {
    console.error(`  Cannot fetch Northflank config: ${e}`);
    return [];
  }
}

async function main() {
  console.log('\n=== DNS CONFIGURATION: Durable.io -> Northflank ===\n');

  console.log('STEP 1: In Durable.io (or your DNS provider), configure these CNAME records:\n');

  for (const svc of SERVICES) {
    console.log(`${svc.displayName}:`);
    console.log(`  Type:  CNAME`);
    console.log(`  Name:  ${svc.publicDomain}`);
    console.log(`  Value: ${svc.northflankDomain}`);
    console.log(`  TTL:   300\n`);
  }

  console.log('STEP 2: In Northflank dashboard, verify each service has the custom domain:\n');

  for (const svc of SERVICES) {
    console.log(`${svc.name} (${svc.displayName}):`);
    const domains = await getNorthflankDomains(svc.name);
    if (domains.length > 0) {
      console.log(`  Northflank configured: ${domains.join(', ')}`);
    } else {
      console.log(`  NOT configured in Northflank`);
      console.log(`  -> Go to Northflank -> ${svc.name} -> Ports/Domains -> Add custom domain`);
      console.log(`  -> Add: ${svc.publicDomain}`);
    }
  }

  console.log('\n=== SUMMARY ===\n');
  console.log('| Service     | Public Domain                  | Northflank Target                      |');
  console.log('|-------------|--------------------------------|----------------------------------------|');
  for (const svc of SERVICES) {
    console.log(`| ${svc.displayName.padEnd(11)} | ${svc.publicDomain.padEnd(30)} | ${svc.northflankDomain.padEnd(38)} |`);
  }
  console.log('\n');
}

main().catch(console.error);
