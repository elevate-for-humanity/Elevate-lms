#!/usr/bin/env tsx
/**
 * Find and consolidate duplicate partner applications across all tables.
 * 
 *   pnpm tsx scripts/consolidate-duplicate-applications.ts --dry-run
 *   pnpm tsx scripts/consolidate-duplicate-applications.ts --execute
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';
import { writeFileSync } from 'fs';

const EXECUTE = process.argv.includes('--execute');

interface DuplicateGroup {
  email: string;
  tables: { table: string; id: string; status: string; shop_name: string; created_at: string }[];
}

async function main() {
  await hydrateProcessEnv();
  const db = createAdminClient();

  console.log(EXECUTE ? '=== EXECUTE MODE ===' : '=== DRY RUN ===\n');

  const tables = [
    'barbershop_partner_applications',
    'nail_partner_applications',
    'partner_applications',
    'host_shop_applications',
  ];

  // Fetch all applications grouped by email
  const allByEmail = new Map<string, DuplicateGroup>();
  
  for (const table of tables) {
    try {
      const { data, error } = await db
        .from(table as any)
        .select('id, email, status, shop_name, shop_legal_name, contact_name, created_at');

      if (error) {
        console.log(`  [${table}] Error: ${error.message}`);
        continue;
      }

      console.log(`[${table}] ${data?.length ?? 0} rows`);

      for (const row of data ?? []) {
        const email = ((row as any).email ?? (row as any).contact_email ?? '').toLowerCase().trim();
        if (!email || !email.includes('@')) continue;

        const shopName = (row as any).shop_name ?? (row as any).shop_legal_name ?? 'Unknown';
        
        if (!allByEmail.has(email)) {
          allByEmail.set(email, { email, tables: [] });
        }
        const group = allByEmail.get(email)!;
        group.tables.push({
          table,
          id: row.id,
          status: (row as any).status ?? 'unknown',
          shop_name: shopName,
          created_at: (row as any).created_at ?? '',
        });
      }
    } catch (e) {
      console.log(`  [${table}] Exception: ${e}`);
    }
  }

  // Find duplicates (same email in multiple tables)
  const duplicates: DuplicateGroup[] = [];
  for (const group of allByEmail.values()) {
    if (group.tables.length > 1) {
      duplicates.push(group);
    }
  }

  console.log(`\n=== DUPLICATES FOUND: ${duplicates.length} emails with multiple applications ===\n`);

  const toDelete: { table: string; id: string; reason: string }[] = [];

  for (const dup of duplicates) {
    console.log(`\nEmail: ${dup.email}`);
    
    // Sort by status priority: approved > active > pending > other
    const statusPriority: Record<string, number> = {
      approved: 1,
      active: 2,
      pending: 3,
      rejected: 4,
      expired: 5,
      unknown: 6,
    };
    
    dup.tables.sort((a, b) => {
      const pA = statusPriority[a.status.toLowerCase()] ?? 99;
      const pB = statusPriority[b.status.toLowerCase()] ?? 99;
      if (pA !== pB) return pA - pB;
      // Keep the oldest (first created)
      return a.created_at.localeCompare(b.created_at);
    });

    for (const t of dup.tables) {
      console.log(`  - ${t.table}: ${t.shop_name} (${t.status}) [${t.id}]`);
    }

    // Keep first (best status), delete others
    const [keep, ...deleteThese] = dup.tables;
    console.log(`  → KEEP: ${keep.table}/${keep.id} (${keep.status})`);
    
    for (const del of deleteThese) {
      // Determine reason
      let reason = '';
      if (del.status.toLowerCase() === 'rejected' || del.status.toLowerCase() === 'expired') {
        reason = `Duplicate of ${keep.table}/${keep.id} - status=${del.status}`;
      } else if (keep.created_at < del.created_at) {
        reason = `Duplicate of ${keep.table}/${keep.id} - newer entry`;
      } else {
        reason = `Duplicate of ${keep.table}/${keep.id}`;
      }
      
      console.log(`  → DELETE: ${del.table}/${del.id} (${del.status}) - ${reason}`);
      toDelete.push({ table: del.table, id: del.id, reason });
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Duplicate emails: ${duplicates.length}`);
  console.log(`Applications to delete: ${toDelete.length}`);

  if (toDelete.length === 0) {
    console.log('\nNo duplicates to clean up!');
    return;
  }

  // Export report
  const report = {
    timestamp: new Date().toISOString(),
    duplicateEmails: duplicates.length,
    deletions: toDelete,
  };
  
  mkdirSync('exports', { recursive: true });
  writeFileSync('exports/duplicate-applications-report.json', JSON.stringify(report, null, 2));
  console.log('\nReport saved to exports/duplicate-applications-report.json');

  // Execute deletions
  if (EXECUTE) {
    console.log('\n=== EXECUTING DELETIONS ===');
    let deleted = 0;
    let failed = 0;

    for (const del of toDelete) {
      console.log(`Deleting ${del.table}/${del.id}...`);
      try {
        const { error } = await db.from(del.table as any).delete().eq('id', del.id);
        if (error) {
          console.log(`  ✗ Failed: ${error.message}`);
          failed++;
        } else {
          console.log(`  ✓ Deleted`);
          deleted++;
        }
      } catch (e) {
        console.log(`  ✗ Exception: ${e}`);
        failed++;
      }
    }

    console.log(`\nDeleted: ${deleted}, Failed: ${failed}`);
  } else {
    console.log('\nRun with --execute to actually delete duplicates.');
  }
}

function mkdirSync(dir: string, opts: any) {
  try {
    require('fs').mkdirSync(dir, opts);
  } catch {}
}

main().catch(console.error);