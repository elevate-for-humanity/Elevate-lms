/** Exit reports must remain visible after newer weekly reports fill the dashboard queue. */
export async function loadHolderExitReports(db: any, holderId?: string): Promise<any[]> {
  const reports: any[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    let query = db
      .from('program_holder_reports')
      .select('id,title,status,content,submitted_at,reviewer_notes,metadata')
      .eq('report_type', 'general')
      .contains('metadata', { report_kind: 'testing_readiness' });
    if (holderId) query = query.eq('program_holder_id', holderId);
    const { data, error } = await query
      .order('submitted_at', { ascending: false })
      .order('id')
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error('Exit reports could not be loaded.');
    const page = data || [];
    reports.push(...page);
    if (page.length < pageSize) return reports;
  }
}
