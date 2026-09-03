import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const progressSchema = z.object({
  enrollmentId: z.string().uuid(),
  currentSeconds: z.number().min(0),
  durationSeconds: z.number().positive(),
  ended: z.boolean().default(false),
});

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      videoKey: string;
    }>;
  },
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }

  const { videoKey } = await context.params;
  const input = progressSchema.parse(await request.json());

  const percentage = Math.min(
    100,
    Math.floor(
      (input.currentSeconds / input.durationSeconds) * 100,
    ),
  );

  const completed =
    input.ended || percentage >= 90;

  const { data: assignment, error: lookupError } =
    await supabase
      .from('onboarding_video_assignments')
      .select(
        'id, user_id, required, acknowledgment_required, completed_at',
      )
      .eq('user_id', user.id)
      .eq('enrollment_id', input.enrollmentId)
      .eq('video_key', videoKey)
      .single();

  if (lookupError || !assignment) {
    return NextResponse.json(
      { error: 'Video assignment not found' },
      { status: 404 },
    );
  }

  const { error: updateError } = await supabase
    .from('onboarding_video_assignments')
    .update({
      watch_seconds: Math.floor(input.currentSeconds),
      duration_seconds: Math.floor(input.durationSeconds),
      completion_percentage: percentage,
      status: completed ? 'completed' : 'in_progress',
      completed_at:
        completed && !assignment.completed_at
          ? new Date().toISOString()
          : assignment.completed_at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assignment.id)
    .eq('user_id', user.id);

  if (updateError) {
    throw new Error(
      `Unable to update video progress: ${updateError.message}`,
    );
  }

  return NextResponse.json({
    success: true,
    completed,
    percentage,
    acknowledgmentRequired:
      assignment.acknowledgment_required,
  });
}
