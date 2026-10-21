import 'server-only';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import { completionAlert } from '@/lib/program-holder/student-training';

// Financial evidence is only queried after the server role guard succeeds.
export async function getVoucherRoster() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();
  async function all(table: string, fields: string) {
    const rows: any[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await db.from(table).select(fields).order('id').range(offset, offset + 499);
      if (error) throw new Error(`Reconciliation ${table} could not load.`);
      rows.push(...(data ?? []));
      if (!data || data.length < 500) return rows;
    }
  }
  const [vouchers, funding] = await Promise.all([
    all('ita_vouchers', 'id,voucher_id,participant_name,user_id,enrollment_id,program_id,voucher_date,service_start_date,service_end_date,fund_stream,status,payments_to_date,comments'),
    all('enrollment_funding_records', 'id,enrollment_id,learner_id,program_id,funding_source,status,notes,authorization_date'),
  ]);
  const enrollmentIds = [...new Set([...vouchers, ...funding].map(r => r.enrollment_id).filter(Boolean))];
  async function linked(table: string, fields: string, column: string, ids: string[]) {
    const rows: any[] = [];
    for (let i = 0; i < ids.length; i += 100) {
      const { data, error } = await db.from(table).select(fields).in(column, ids.slice(i, i + 100));
      if (error) throw new Error(`Reconciliation ${table} evidence could not load.`);
      rows.push(...(data ?? []));
    }
    return rows;
  }
  const enrollmentFields = 'id,user_id,student_id,full_name,program_id,program_slug,program_holder_id,status,training_start_date,expected_end_date,training_end_date,completion_date,completed_at';
  const byLink = await linked('program_enrollments', enrollmentFields, 'id', enrollmentIds);
  const unlinkedUsers = [...new Set(vouchers.filter(r => !r.enrollment_id && r.user_id).map(r => r.user_id))] as string[];
  const byUser = await linked('program_enrollments', enrollmentFields, 'user_id', unlinkedUsers);
  const enrollments = [...new Map([...byLink, ...byUser].map(r => [r.id, r])).values()];
  const users = [...new Set(enrollments.map(r => r.user_id || r.student_id).filter(Boolean))] as string[];
  const [uploads, resumes, documents, careers, holders, providers] = await Promise.all([
    linked('student_credential_uploads', 'id,user_id,program_id,verification_status', 'user_id', users),
    linked('resumes', 'id,user_id', 'user_id', users),
    linked('documents', 'id,user_id,metadata', 'user_id', users),
    linked('resume_profiles', 'id,user_id', 'user_id', users),
    linked('program_holders', 'id,organization_name,name', 'id', [...new Set(enrollments.map(r => r.program_holder_id).filter(Boolean))] as string[]),
    linked('partner_lms_enrollments', 'id,student_id,provider_id,status,partner_lms_providers(provider_name)', 'student_id', users),
  ]);
  const records = [
    ...vouchers.map(v => ({ ...v, source: v.fund_stream || 'ITA', evidence: v.comments, authorization: v.voucher_date, recordedPaid: Number(v.payments_to_date || 0) })),
    ...funding.filter(f => !vouchers.some(v => v.enrollment_id === f.enrollment_id)).map(f => ({ ...f, user_id: f.learner_id, voucher_id: null, source: f.funding_source, evidence: f.notes, recordedPaid: null, authorization: f.authorization_date })),
  ];
  return records.map(record => {
    const candidates = enrollments.filter(e => record.enrollment_id ? e.id === record.enrollment_id : e.user_id === record.user_id && (!record.program_id || e.program_id === record.program_id));
    const e = candidates.length === 1 ? candidates[0] : null;
    const uid = e?.user_id || e?.student_id || record.user_id;
    const credentials = uploads.filter(c => c.user_id === uid && c.program_id === e?.program_id);
    const credentialStatus = credentials.some(c => c.verification_status === 'approved') ? 'Approved upload' : credentials.some(c => c.verification_status === 'pending') ? 'Submitted for review' : credentials.some(c => c.verification_status === 'rejected') ? 'Rejected — review needed' : 'No uploaded evidence';
    const resume = resumes.some(r => r.user_id === uid) || documents.some(d => d.user_id === uid && d.metadata?.original_type === 'resume');
    const career = careers.some(c => c.user_id === uid);
    const holder = holders.find(h => h.id === e?.program_holder_id);
    const alerts = [!e ? 'Enrollment link needs review' : completionAlert(e), !uid ? 'Student login not linked' : null, !holder ? 'Program Holder missing' : null, credentialStatus !== 'Approved upload' ? 'Certification evidence needs reconciliation' : null, !resume ? 'Resume missing' : null, !career ? 'Career Services not started' : null].filter(Boolean) as string[];
    return { id: record.id, name: record.participant_name || e?.full_name || 'Identity needs review', userId: uid,
      voucher: record.voucher_id, source: record.source, fundingStatus: record.status, recordedPaid: record.recordedPaid,
      authorization: record.authorization, program: e?.program_slug || 'Program needs review', enrollmentStatus: e?.status || 'Unlinked',
      holder: holder?.organization_name || holder?.name || 'Unassigned', start: e?.training_start_date || record.service_start_date,
      expected: e?.expected_end_date || record.service_end_date || e?.training_end_date, actual: e?.completion_date || e?.completed_at,
      credentialStatus, resume, career, providers: providers.filter(p => p.student_id === uid).map(p => ({ name: p.partner_lms_providers?.provider_name || 'Provider', status: p.status })), alerts, evidence: record.evidence || 'Source documentation needs review' };
  });
}
export type VoucherRosterRow = Awaited<ReturnType<typeof getVoucherRoster>>[number];
