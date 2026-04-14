/**
 * MOU status helpers.
 *
 * These functions are called from both server components and API routes.
 * They accept a pre-created Supabase client so the caller controls the
 * auth context (server vs. browser). Do NOT create a browser client here.
 */

export type MOUStatus = {
  status: string;
  isFullyExecuted: boolean;
  holderSigned: boolean;
  adminSigned: boolean;
  hasPDF: boolean;
};

/**
 * Check if a program holder has a fully executed MOU.
 * Pass the Supabase client from the calling context.
 */
export async function hasMOUFullyExecuted(
  supabase: { from: (table: string) => any },
  programHolderId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('program_holders')
    .select('mou_status')
    .eq('id', programHolderId)
    .maybeSingle();

  if (error || !data) return false;
  return data.mou_status === 'fully_executed';
}

/**
 * Get full MOU status for a program holder.
 * Pass the Supabase client from the calling context.
 */
export async function getMOUStatus(
  supabase: { from: (table: string) => any },
  programHolderId: string
): Promise<MOUStatus> {
  const { data, error } = await supabase
    .from('program_holders')
    .select('mou_status, mou_holder_signed_at, mou_admin_signed_at, mou_final_pdf_url')
    .eq('id', programHolderId)
    .maybeSingle();

  if (error || !data) {
    return {
      status: 'unknown',
      isFullyExecuted: false,
      holderSigned: false,
      adminSigned: false,
      hasPDF: false,
    };
  }

  return {
    status: data.mou_status ?? 'unknown',
    isFullyExecuted: data.mou_status === 'fully_executed',
    holderSigned: !!data.mou_holder_signed_at,
    adminSigned: !!data.mou_admin_signed_at,
    hasPDF: !!data.mou_final_pdf_url,
  };
}

/**
 * Server-side check for MOU status (for API routes).
 * Kept for backward compatibility — prefer getMOUStatus.
 */
export async function checkMOUStatusServer(
  supabase: { from: (table: string) => any },
  programHolderId: string
) {
  const { data, error } = await supabase
    .from('program_holders')
    .select('mou_status')
    .eq('id', programHolderId)
    .maybeSingle();

  if (error || !data) {
    return { isValid: false, status: 'unknown' };
  }

  return {
    isValid: data.mou_status === 'fully_executed',
    status: data.mou_status ?? 'unknown',
  };
}
