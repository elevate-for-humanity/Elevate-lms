/**
 * RAPIDS Export API
 * 
 * Generates CSV files for RAPIDS bulk upload.
 * Admin only endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  exportNewRegistrations,
  exportProgressUpdates,
  exportCompletions,
  exportCancellations,
  markAsSubmitted,
} from '@/lib/compliance/rapids-export';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
// Verify admin access
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'registrations';
  const startDate = searchParams.get('start_date') || undefined;
  const endDate = searchParams.get('end_date') || undefined;
  const format = searchParams.get('format') || 'csv';

  let result;

  switch (type) {
    case 'registrations':
      result = await exportNewRegistrations(startDate, endDate);
      break;
    case 'progress':
      result = await exportProgressUpdates(startDate || new Date().toISOString().split('T')[0]);
      break;
    case 'completions':
      result = await exportCompletions(startDate, endDate);
      break;
    case 'cancellations':
      result = await exportCancellations(startDate, endDate);
      break;
    default:
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
  }

  if (result.errors.length > 0 && result.count === 0) {
    return NextResponse.json({ 
      error: result.errors[0],
      errors: result.errors 
    }, { status: 400 });
  }

  // Return as downloadable CSV
  if (format === 'csv') {
    const filename = `rapids_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    
    return new NextResponse(result.csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  // Return as JSON with metadata
  return NextResponse.json({
    type,
    count: result.count,
    errors: result.errors,
    csv: result.csv,
    generated_at: new Date().toISOString(),
  });
}

/**
 * POST - Mark records as submitted to RAPIDS
 */
export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  // Verify admin access
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { enrollment_ids, type } = body;

  if (!enrollment_ids || !Array.isArray(enrollment_ids) || enrollment_ids.length === 0) {
    return NextResponse.json({ error: 'enrollment_ids required' }, { status: 400 });
  }

  if (!['registration', 'completion', 'cancellation'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const result = await markAsSubmitted(enrollment_ids, type);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: `${enrollment_ids.length} records marked as submitted`,
  });
}
