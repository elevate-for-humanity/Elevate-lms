// Barber practical submissions
// GET  /api/barber/practicals  — student's practical progress
// POST /api/barber/practicals  — submit a practical for review

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BARBER_PROGRAM_ID = process.env.BARBER_PROGRAM_ID ?? '';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    // Categories with required counts
    const { data: categories } = await supabase
      .from('barber_practical_categories')
      .select('*')
      .order('module_number');

    // Student progress
    const { data: progress } = await supabase
      .from('barber_student_practicals')
      .select('*')
      .eq('user_id', user.id)
      .eq('program_id', BARBER_PROGRAM_ID);

    // Recent submissions
    const { data: submissions } = await supabase
      .from('barber_practical_submissions')
      .select('id, category_key, status, service_date, submitted_at, rejection_reason')
      .eq('user_id', user.id)
      .eq('program_id', BARBER_PROGRAM_ID)
      .order('submitted_at', { ascending: false })
      .limit(20);

    // Merge categories with progress
    const progressMap = Object.fromEntries((progress ?? []).map((p) => [p.category_key, p]));

    const merged = (categories ?? []).map((cat) => ({
      ...cat,
      count_completed: progressMap[cat.category_key]?.count_completed ?? 0,
      verification_status: progressMap[cat.category_key]?.verification_status ?? 'in_progress',
      last_verified_at: progressMap[cat.category_key]?.last_verified_at ?? null,
    }));

    return NextResponse.json({ categories: merged, submissions: submissions ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Failed to load practicals');
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const body = await request.json();
    const { category_key, notes, photo_url, video_url, client_initials, service_date, shop_name } =
      body;

    if (!category_key) return safeError('category_key required', 400);

    // Validate category exists
    const { data: cat } = await supabase
      .from('barber_practical_categories')
      .select('category_key')
      .eq('category_key', category_key)
      .maybeSingle();

    if (!cat) return safeError('Invalid category', 400);

    const db = await requireAdminClient();
    if (!db) return safeError('Service unavailable', 503);

    const { data: submission, error } = await db
      .from('barber_practical_submissions')
      .insert({
        user_id: user.id,
        program_id: BARBER_PROGRAM_ID,
        category_key,
        notes: notes ?? null,
        photo_url: photo_url ?? null,
        video_url: video_url ?? null,
        client_initials: client_initials ?? null,
        service_date: service_date ?? new Date().toISOString().split('T')[0],
        shop_name: shop_name ?? null,
        status: 'pending',
      })
      .select('id, status, submitted_at')
      .single();

    if (error) return safeInternalError(error, 'Failed to submit practical');
    return NextResponse.json({ submission }, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'Failed to submit practical');
  }
}
