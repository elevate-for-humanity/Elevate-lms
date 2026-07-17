// PUBLIC ROUTE: returns the cosmetology partner application for the logged-in user
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  const db = await requireAdminClient();

  // Match by email + cosmetology program type. Also accept NULL program_type for
  // legacy records created before the column existed.
  const { data, error } = await db
    .from('partners')
    .select(
      'id,name,legal_name,owner_name,contact_name,contact_email,contact_phone,address_line1,address_line2,city,state,zip,license_number,supervisor_name,supervisor_license_number,supervisor_years_licensed,compensation_model,number_of_employees,workers_comp_status,has_general_liability,can_supervise_and_verify,mou_acknowledged,mou_signed,status,applied_at,notes',
    )
    .eq('contact_email', user.email ?? '')
    .or('program_type.eq.cosmetology,program_type.is.null')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return safeError('Failed to load application', 500);
  if (!data) return NextResponse.json(null, { status: 200 });

  return NextResponse.json(data);
}
