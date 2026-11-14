/**
 * Seed admin dashboard tables with realistic data.
 * Run: node scripts/seed-admin-tables.mjs
 * Safe to re-run: skips tables that already have rows.
 *
 * Live schema notes (differ from migration files):
 *   compliance_alerts: status TEXT (default 'open'), no boolean resolved column
 *   announcements: posted_by UUID NOT NULL, is_published BOOLEAN, naics_list is TEXT[]
 *   entities: naics_list TEXT[] (not TEXT), entity_type CHECK IN ('nonprofit','for_profit')
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local'), override: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing env vars'); process.exit(1); }

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function rowCount(table) {
  const { count: n } = await db.from(table).select('id', { count: 'exact', head: true });
  return n ?? 0;
}

async function seed(table, rows) {
  const n = await rowCount(table);
  if (n > 0) { console.log(`SKIP  ${table} (${n} rows)`); return; }
  const { error } = await db.from(table).insert(rows);
  if (error) console.error(`ERROR ${table}: ${error.message}`);
  else console.log(`OK    ${table} — ${rows.length} rows`);
}

async function run() {
  console.log('Seeding admin tables...\n');

  // Elizabeth Greene — super_admin
  const adminId = '8e352e99-d552-4690-b8e7-8a560bb1f873';
  const now = new Date();
  const d = (days) => new Date(now.getTime() + days * 86400000).toISOString();

  await seed('compliance_alerts', [
    { alert_type: 'wioa_document',  severity: 'high',     title: 'WIOA eligibility docs expiring',          description: '3 participants have WIOA eligibility documents expiring within 30 days.',                                     status: 'open' },
    { alert_type: 'enrollment',     severity: 'critical', title: 'Active enrollments missing funding',      description: '7 active enrollments have no funding source recorded. Required for ETPL and DOL compliance.',                status: 'open' },
    { alert_type: 'license_expiry', severity: 'medium',   title: 'Program license renewal due in 45 days', description: 'CNA program state license renewal due in 45 days. Submit renewal application to state board.',               status: 'open' },
    { alert_type: 'audit_finding',  severity: 'info',     title: 'Annual compliance audit scheduled',       description: 'DOL annual compliance audit scheduled for next quarter. Ensure all participant files are current.',          status: 'open' },
    { alert_type: 'data_quality',   severity: 'medium',   title: 'Missing outcome data for Q1 completers',  description: '12 program completers from Q1 are missing employment outcome data. Required for ETPL performance reporting.', status: 'open' },
  ]);

  await seed('announcements', [
    { audience: 'all',     title: 'New CNA Cohort Starting June 2026',      body: 'Applications are now open for the June 2026 CNA cohort. Classes begin June 9th. Financial aid and WIOA funding available for eligible participants.',                     posted_by: adminId, is_published: true, published_at: d(-3), expires_at: d(30),  severity: 'info'      },
    { audience: 'student', title: 'LMS Maintenance Window Saturday 2-4 AM', body: 'The learning platform will be unavailable Saturday May 3rd from 2:00-4:00 AM EST for scheduled maintenance. Save your progress before then.',                            posted_by: adminId, is_published: true, published_at: d(-1), expires_at: d(5),   severity: 'important' },
    { audience: 'staff',   title: 'Q2 Compliance Reporting Deadline',        body: 'Q2 WIOA and ETPL compliance reports are due June 30th. All case managers must submit participant outcome data by June 25th.',                                            posted_by: adminId, is_published: true, published_at: d(-7), expires_at: d(60),  severity: 'urgent'    },
    { audience: 'partner', title: 'Hiring Fair June 14 2026',                body: 'Elevate for Humanity is hosting a hiring fair on June 14th. Over 40 graduates from CNA, IT, and HVAC programs will be available. Register your company to participate.', posted_by: adminId, is_published: true, published_at: d(-5), expires_at: d(45),  severity: 'event'     },
    { audience: 'admin',   title: 'System Maintenance Window April 30',      body: 'Scheduled maintenance on April 30 from 2-4 AM EST. Admin portal will be read-only during this window. Notify staff in advance.',                                         posted_by: adminId, is_published: true, published_at: d(-2), expires_at: d(10),  severity: 'event'     },
  ]);

  await seed('entities', [
    { name: 'Elevate for Humanity Education Inc.', uei: 'EFH2024001', cage: '9EFH1', ein: '88-1234567', entity_type: 'nonprofit',  naics_list: ['611430','611699','611710'], capability_narrative: 'Workforce development, career training, and credentialing for underserved communities. ETPL-listed provider.' },
    { name: 'Gulf Coast Workforce Board',           uei: 'GCW9876543', cage: 'GCW01', ein: '74-9876543', entity_type: 'nonprofit',  naics_list: ['926110'],                  capability_narrative: 'Regional workforce development board administering WIOA Title I funds for the Gulf Coast region.' },
    { name: 'Houston Community College',            uei: 'HCC4445556', cage: 'HCC01', ein: '74-4445556', entity_type: 'nonprofit',  naics_list: ['611210'],                  capability_narrative: 'Community college providing credit and non-credit workforce training programs.' },
    { name: 'Acme HVAC Solutions LLC',              uei: 'ACM7778889', cage: 'ACM01', ein: '76-7778889', entity_type: 'for_profit', naics_list: ['238220','811412'],          capability_narrative: 'HVAC installation, maintenance, and repair. Employer partner for apprenticeship placements.' },
    { name: 'SupersonicFastCash Tax Services',      uei: 'SFC1234567', cage: 'SFC01', ein: '87-9876543', entity_type: 'for_profit', naics_list: ['541213'],                  capability_narrative: 'Tax preparation and financial services. Enrolled Agent with EFIN and PTIN. IRS-authorized e-file provider.' },
  ]);

  await seed('wotc_applications', [
    { employee_first_name: 'Marcus',  employee_last_name: 'Johnson',  employer_name: 'Acme HVAC Solutions LLC',    employer_ein: '76-7778889', position: 'HVAC Technician I',        target_groups: ['snap_recipient','long_term_unemployed'], status: 'approved',       starting_wage: 18.50, start_date: '2026-02-01', job_offer_date: '2026-01-25', certification_received: true,  tax_credit_amount: 2400.00 },
    { employee_first_name: 'Destiny', employee_last_name: 'Williams', employer_name: 'Gulf Coast Mechanical Inc.', employer_ein: '74-2223334', position: 'Refrigeration Technician', target_groups: ['ex_felon'],                              status: 'submitted',      starting_wage: 17.00, start_date: '2026-03-15', job_offer_date: '2026-03-10', certification_received: false },
    { employee_first_name: 'Carlos',  employee_last_name: 'Rivera',   employer_name: 'Texas Cool Air LLC',         employer_ein: '76-3334445', position: 'HVAC Installer',           target_groups: ['snap_recipient'],                        status: 'pending_review', starting_wage: 16.50, start_date: '2026-04-01', job_offer_date: '2026-03-28', certification_received: false },
    { employee_first_name: 'Jasmine', employee_last_name: 'Thompson', employer_name: 'Houston Climate Control',    employer_ein: '74-5556667', position: 'Service Technician',       target_groups: ['long_term_unemployed','veteran'],        status: 'draft',          starting_wage: 19.00, certification_received: false },
    { employee_first_name: 'DeShawn', employee_last_name: 'Harris',   employer_name: 'Acme HVAC Solutions LLC',    employer_ein: '76-7778889', position: 'HVAC Apprentice',          target_groups: ['snap_recipient'],                        status: 'approved',       starting_wage: 15.75, start_date: '2026-01-15', job_offer_date: '2026-01-10', certification_received: true,  tax_credit_amount: 2400.00 },
  ]);

  await seed('grants', [
    { agency: 'U.S. Department of Labor',                 draft: 'WIOA Title I Workforce Training Grant',           due_date: d(45),  intake: 'Completed',   status: 'active',    submitted: null   },
    { agency: 'U.S. Department of Education',             draft: 'Career Pathways Innovation Fund',                 due_date: d(90),  intake: 'In Progress', status: 'draft',     submitted: null   },
    { agency: 'HHS Administration for Children Families', draft: 'TANF Employment and Training Services Grant',     due_date: d(-10), intake: 'Completed',   status: 'submitted', submitted: d(-10) },
    { agency: 'SBA Small Business Development',           draft: 'Entrepreneurship and Financial Literacy Program', due_date: d(120), intake: 'Not Started', status: 'draft',     submitted: null   },
    { agency: 'U.S. Department of Commerce EDA',          draft: 'Regional Workforce Development Recovery',         due_date: d(-30), intake: 'Completed',   status: 'awarded',   submitted: d(-30) },
  ]);

  console.log('\nFinal counts:');
  for (const t of ['compliance_alerts','announcements','entities','wotc_applications','grants']) {
    console.log(`  ${t}: ${await rowCount(t)}`);
  }
  console.log('\n✅ Done.');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
