import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { withRuntime } from '@/lib/api/withRuntime';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

// Returns the most recent cosmetology salon application for the logged-in user,
// used to pre-populate the sign-mou page fields.
async function _GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const db = await getAdminClient();

    const { data, error } = await db
      .from('partners')
      .select('name, legal_name, owner_name, contact_email, supervisor_name, supervisor_license_number, compensation_model, program_type')
      .eq('program_type', 'cosmetology')
      .eq('contact_email', user.email)
      .order('applied_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return safeInternalError(error, 'Failed to fetch application');
    if (!data) return NextResponse.json(null, { status: 200 });

    return NextResponse.json({
      salon_legal_name: data.legal_name || data.name,
      name: data.name,
      owner_name: data.owner_name,
      supervisor_name: data.supervisor_name,
      supervisor_license_number: data.supervisor_license_number,
      compensation_model: data.compensation_model,
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to fetch application');
  }
}

export const GET = withRuntime(_GET);
