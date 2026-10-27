import type { SupabaseClient } from '@supabase/supabase-js';

export interface RecordedPlacement {
  id: string; studentName: string; programName: string; employerName: string;
  position: string; salary: number; startDate: string | null; status: string; createdAt: string;
}

export async function loadRecordedPlacements(db: SupabaseClient, programId?: string): Promise<RecordedPlacement[]> {
  const rows: any[] = [];
  for (let offset = 0; ; offset += 1000) {
    let query = db.from('placement_records')
      .select('id,program_id,learner_id,employer_id,employer_name,job_title,annual_salary,start_date,status,created_at')
      .order('created_at', { ascending: false }).order('id');
    if (programId) query = query.eq('program_id', programId);
    const result = await query.range(offset, offset + 999);
    if (result.error) throw result.error;
    rows.push(...(result.data ?? []));
    if (!result.data || result.data.length < 1000) break;
  }
  async function related(table: string, fields: string, ids: unknown[]) {
    const keys = [...new Set(ids.filter(Boolean))];
    const records: any[] = [];
    for (let offset = 0; offset < keys.length; offset += 100) {
      const result = await db.from(table).select(fields).in('id', keys.slice(offset, offset + 100));
      if (result.error) throw result.error;
      records.push(...(result.data ?? []));
    }
    return new Map(records.map(row => [row.id, row]));
  }
  const [learners, programs, employers] = await Promise.all([
    related('profiles', 'id,full_name', rows.map(row => row.learner_id)),
    related('programs', 'id,title', rows.map(row => row.program_id)),
    related('employers', 'id,business_name,company_name', rows.map(row => row.employer_id)),
  ]);
  return rows.map(row => ({ id: row.id, studentName: learners.get(row.learner_id)?.full_name || 'Learner not recorded',
    programName: programs.get(row.program_id)?.title || 'Program not recorded',
    employerName: row.employer_name || employers.get(row.employer_id)?.company_name || employers.get(row.employer_id)?.business_name || 'Employer not recorded',
    position: row.job_title || 'Position not recorded', salary: Math.max(0, Number(row.annual_salary) || 0),
    startDate: row.start_date || null, status: row.status || 'Not recorded', createdAt: row.created_at }));
}
