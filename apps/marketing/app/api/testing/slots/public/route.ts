import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { MINIMUM_BOOKING_NOTICE_HOURS } from '@/lib/testing/booking-validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'public');
  if (rateLimited) return rateLimited;

  const examType = request.nextUrl.searchParams.get('examType')?.trim();
  if (!examType) {
    return NextResponse.json({ error: 'examType is required', slots: [] }, { status: 400 });
  }

  const earliestStart = new Date(
    Date.now() + MINIMUM_BOOKING_NOTICE_HOURS * 60 * 60 * 1000,
  ).toISOString();
  const supabase = await requireAdminClient();
  const { data, error } = await supabase
    .from('testing_slots')
    .select('id, exam_type, start_time, end_time, capacity, booked_count, location')
    .eq('exam_type', examType)
    .eq('is_cancelled', false)
    .gte('start_time', earliestStart)
    .order('start_time', { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: 'Testing appointments are temporarily unavailable', slots: [] }, { status: 503 });
  }

  const slots = (data ?? [])
    .filter((slot) => slot.booked_count < slot.capacity)
    .map((slot) => ({
      id: slot.id,
      examType: slot.exam_type,
      startTime: slot.start_time,
      endTime: slot.end_time,
      location: slot.location,
      spotsRemaining: slot.capacity - slot.booked_count,
    }));

  return NextResponse.json({
    minimumNoticeHours: MINIMUM_BOOKING_NOTICE_HOURS,
    slots,
  });
}
