/**
 * Public projection for Host Shop placement requests.
 * Never forward a student's full application, phone number, intake notes,
 * government/financial information or admin-only metadata into a Host Shop.
 * The query authorizes the shop first; this function is defense in depth.
 */
export function hostShopMatchSummary(row: any) {
  return {
    id: String(row.id),
    status: String(row.status || 'pending'),
    program_slug: String(row.program_slug || ''),
    created_at: row.created_at || null,
    apprentice: row.apprentice ? {
      full_name: String(row.apprentice.full_name || 'Student'),
      email: typeof row.apprentice.email === 'string' ? row.apprentice.email : null,
    } : null,
  };
}
