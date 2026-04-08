/**
 * GET  /api/testing/slots          — list upcoming slots (admin)
 * POST /api/testing/slots          — create a slot (admin)
 * DELETE /api/testing/slots?id=    — cancel a slot (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { TESTING_CENTER } from '@/lib/testing/testing-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const db = createAdminClient();
  if (!db) return safeError('Database unavailable', 500);

  const { data, error } = await db
    .from('testing_slots')
    .select('*')
    .eq('is_cancelled', false)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  if (error) return safeInternalError(error, 'Failed to fetch slots');
  return NextResponse.json({ slots: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const db = createAdminClient();
  if (!db) return safeError('Database unavailable', 500);

  let body: {
    exam_type: string;
    start_time: string;
    end_time: string;
    capacity: number;
    location?: string;
    notes?: string;
  };
  try { body = await req.json(); } catch { return safeError('Invalid JSON', 400); }

  const { exam_type, start_time, end_time, capacity, location, notes } = body;
  if (!exam_type || !start_time || !end_time || !capacity) {
    return safeError('exam_type, start_time, end_time, and capacity are required', 400);
  }

  const { data, error } = await db
    .from('testing_slots')
    .insert({
      exam_type,
      start_time,
      end_time,
      capacity,
      booked_count: 0,
      location: location ?? `In-person — ${TESTING_CENTER.address}`,
      notes: notes ?? null,
    })
    .select('*')
    .single();

  if (error) return safeInternalError(error, 'Failed to create slot');
  return NextResponse.json({ slot: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const db = createAdminClient();
  if (!db) return safeError('Database unavailable', 500);

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return safeError('id is required', 400);

  const { error } = await db
    .from('testing_slots')
    .update({ is_cancelled: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return safeInternalError(error, 'Failed to cancel slot');
  return NextResponse.json({ success: true });
}
