import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Authentication required', 401);

  const admin = createAdminClient();
  if (!admin) return safeInternalError(new Error('Admin client unavailable'), 'Service unavailable');

  const { data, error } = await admin
    .from('tax_payments')
    .select('id, status, amount, paid_at, payment_type')
    .eq('client_id', user.id)
    .eq('status', 'paid')
    .limit(1)
    .maybeSingle();

  if (error) return safeInternalError(error, 'Failed to check payment status');

  return NextResponse.json({ paid: !!data, record: data ?? null });
}
