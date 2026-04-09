/**
 * POST /api/testing/leads
 *
 * Captures a partial booking lead (email + exam type) before the full form
 * is completed. Upserts on (email, exam_type) — safe to call multiple times.
 *
 * Called as soon as the user enters their email on the booking form.
 * The follow-up cron job reads this table to send 24hr/48hr reminder emails
 * to leads that never converted to a booking.
 *
 * Body: { email, examType, firstName?, phone?, source? }
 * Returns: { success: true, id: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'contact');
  if (rateLimited) return rateLimited;

  let body: { email?: string; examType?: string; firstName?: string; phone?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const { email, examType, firstName, phone, source } = body;

  if (!email || !email.includes('@')) return safeError('Valid email required', 400);
  if (!examType) return safeError('examType required', 400);

  const db = await getAdminClient();
  if (!db) return safeError('Database unavailable', 500);

  try {
    // Upsert on (lower(email), exam_type) — refreshes updated_at and resets
    // follow-up flags if the lead comes back, so they get the sequence again.
    const { data, error } = await db
      .from('exam_booking_leads')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          exam_type: examType,
          first_name: firstName?.trim() || null,
          phone: phone?.trim() || null,
          source: source ?? 'booking_form',
          // Reset follow-up flags on re-entry so sequence fires fresh
          follow_up_1_sent: false,
          follow_up_2_sent: false,
          converted: false,
          converted_at: null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'email,exam_type',
          ignoreDuplicates: false,
        }
      )
      .select('id')
      .single();

    if (error) {
      logger.error('[testing/leads] Upsert failed', { error });
      return safeInternalError(error, 'Failed to save lead');
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    return safeInternalError(err, 'Failed to save lead');
  }
}

/**
 * PATCH /api/testing/leads
 *
 * Marks a lead as converted once a booking is completed.
 * Called from the booking success flow.
 *
 * Body: { email, examType }
 */
export async function PATCH(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  let body: { email?: string; examType?: string };
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const { email, examType } = body;
  if (!email || !examType) return safeError('email and examType required', 400);

  const db = await getAdminClient();
  if (!db) return safeError('Database unavailable', 500);

  const { error } = await db
    .from('exam_booking_leads')
    .update({ converted: true, converted_at: new Date().toISOString() })
    .eq('email', email.toLowerCase().trim())
    .eq('exam_type', examType);

  if (error) {
    logger.error('[testing/leads] Convert update failed', { error });
    return safeInternalError(error, 'Failed to mark lead converted');
  }

  return NextResponse.json({ success: true });
}
