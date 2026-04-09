/**
 * GET    /api/testing/slots       — list upcoming slots (admin)
 * POST   /api/testing/slots       — create a slot (admin)
 * DELETE /api/testing/slots?id=   — cancel a slot (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { TESTING_CENTER } from '@/lib/testing/testing-config';
import { withRuntime } from '@/lib/api/withRuntime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SlotSchema = z.object({
  exam_type:  z.string().min(1),
  start_time: z.string().datetime({ message: 'start_time must be ISO 8601' }),
  end_time:   z.string().datetime({ message: 'end_time must be ISO 8601' }),
  capacity:   z.number().int().min(1).max(200),
  location:   z.string().optional(),
  notes:      z.string().optional(),
});

export const GET = withRuntime(
  { auth: 'admin' },
  async () => {
    const db = await getAdminClient();
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
);

export const POST = withRuntime(
  { auth: 'admin' },
  async (req) => {
    const db = await getAdminClient();
    if (!db) return safeError('Database unavailable', 500);

    let raw: unknown;
    try { raw = await req.json(); }
    catch { return safeError('Invalid JSON', 400); }

    const parsed = SlotSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { exam_type, start_time, end_time, capacity, location, notes } = parsed.data;

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
);

export const DELETE = withRuntime(
  { auth: 'admin' },
  async (req) => {
    const db = await getAdminClient();
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
);
