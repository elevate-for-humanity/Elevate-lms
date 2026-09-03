// Inspect tables via PostgREST. Read-only.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SKEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const H = { apikey: SKEY, Authorization: `Bearer ${SKEY}` };

async function tableInfo(name) {
  // HEAD with Prefer: count=exact returns row count in Content-Range
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${name}?select=*&limit=0`, {
    method: 'HEAD',
    headers: { ...H, Prefer: 'count=exact' },
  });
  if (r.status === 404) return { exists: false };
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    return { exists: 'err', status: r.status, body: body.slice(0, 80) };
  }
  const cr = r.headers.get('content-range') || '';
  const rows = cr.split('/')[1];
  return { exists: true, rows: rows === '*' ? '?' : Number(rows) };
}

const M7 = [
  'program_enrollments','training_enrollments','apprenticeship_enrollments','cohort_enrollments',
  'audit_logs','admin_audit_events','admin_audit_log','ai_audit_log',
  'profiles','user_profiles','instructor_profiles',
  'lesson_progress','module_progress','user_progress','video_progress',
  'notifications','admin_notifications','apprentice_notifications','alert_notifications','announcement_recipients',
  'documents','user_documents','enrollment_documents','apprentice_documents','compliance_documents',
  'apprenticeship_hours','apprentice_hours','apprentice_hours_log','apprentice_hours_by_shop',
  'apprentice_hours_by_source','apprentice_hour_totals','apprenticeship_hours_summary',
  'admin_compliance_status',
  'user_settings','user_preferences','notification_preferences','feature_flags',
];

const NEW_T = [
  'rag_embeddings','platform_events','mentorships','mentor_sessions','mentor_messages','mentor_resources',
  'wioa_participants','wioa_cases','ita_vouchers','ai_plan_executions',
  'workforce_board_cases','workforce_board_participants','workforce_board_notes',
  'ai_planner_tasks','payout_queue','tenant_configurations',
];

console.log('\n========== MIGRATION #7 AFFECTED TABLES ==========');
for (const t of M7) {
  const info = await tableInfo(t);
  let line = `  ${t.padEnd(34)} `;
  if (info.exists === false) line += 'DROPPED/missing';
  else if (info.exists === 'err') line += `ERR ${info.status} ${info.body}`;
  else line += `EXISTS  rows=${info.rows}`;
  console.log(line);
}

console.log('\n========== NEW TABLES (created by pending migrations) ==========');
for (const t of NEW_T) {
  const info = await tableInfo(t);
  let line = `  ${t.padEnd(34)} `;
  if (info.exists === false) line += 'missing (needs migration)';
  else if (info.exists === 'err') line += `ERR ${info.status} ${info.body}`;
  else line += `EXISTS  rows=${info.rows}`;
  console.log(line);
}

console.log('\n========== PROGRAMS — #6 target ==========');
const ps = await fetch(`${SUPABASE_URL}/rest/v1/programs?select=status&limit=10000`, { headers: H });
const programs = await ps.json();
const counts = {};
for (const p of programs) counts[p.status] = (counts[p.status] || 0) + 1;
console.log('  status distribution:', counts);
console.log('  total:', programs.length);

const archiveTargets = [
  'ai-forklift-safety-certification-1774495387731','ai-advanced-project-management-1774494313718',
  'pub-path-test-1773772605941','gen-acceptance-test-elec-1773765247614',
  'cna-training','cna-cert','cpr-cert','hvac-2024','barber','barber-2024','cosmetology',
  'hair-stylist-esthetician-apprenticeship','nail-technician','nail-tech-apprenticeship',
  'hair-stylist-nail-tech-apprenticeship','phlebotomy-technician','peer-support',
  'peer-recovery-specialist-jri','certified-recovery-specialist','tax-prep','health-safety',
  'dsp-training','bookkeeping-fundamentals','entrepreneurship-small-business','forklift-operator',
  'it-support','it-support-specialist','building-services-technician-apprenticeship',
  'recovery-coach','ems-apprenticeship',
];
console.log('\n  Programs that #6 will archive:');
const inList = `(${archiveTargets.map((s) => `"${s}"`).join(',')})`;
const a = await fetch(`${SUPABASE_URL}/rest/v1/programs?slug=in.${inList}&select=slug,status&order=slug`, { headers: H });
const arch = await a.json();
for (const p of arch) console.log(`    ${p.slug.padEnd(50)} status=${p.status}`);
console.log(`    (${arch.length} matched / ${archiveTargets.length} targeted)`);
