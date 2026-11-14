export function metricCount(result) {
  return result.error || typeof result.count !== 'number' ? null : result.count;
}

export async function loadAllEnrollmentRows(db) {
  const rows = [];
  const size = 500;
  for (let offset = 0; ; offset += size) {
    const result = await db
      .from('program_enrollments')
      .select('id,program_id,status,programs:program_id(title)')
      .order('id')
      .range(offset, offset + size - 1);
    if (result.error || !Array.isArray(result.data))
      return { data: null, error: result.error || { message: 'Enrollment report unavailable' } };
    rows.push(...result.data);
    if (result.data.length < size) return { data: rows, error: null };
  }
}
