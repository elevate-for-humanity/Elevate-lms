import { createClient } from '@/lib/supabase/server';
import {
  ONBOARDING_VIDEO_CATALOG,
  type Audience,
} from '@/content/onboarding/video-catalog';

interface AssignVideosInput {
  userId: string;
  enrollmentId: string;
  audience: Audience;
  programId?: string;
}

export async function assignRequiredOnboardingVideos(
  input: AssignVideosInput,
) {
  const supabase = await createClient();

  const videos = ONBOARDING_VIDEO_CATALOG
    .filter((video) => video.audience.includes(input.audience))
    .sort((a, b) => a.sequence - b.sequence);

  if (videos.length === 0) {
    throw new Error(
      `No onboarding videos are configured for audience ${input.audience}`,
    );
  }

  const rows = videos.map((video) => ({
    user_id: input.userId,
    enrollment_id: input.enrollmentId,
    program_id: input.programId ?? null,
    video_key: video.id,
    title: video.title,
    sequence: video.sequence,
    required: video.required,
    acknowledgment_required:
      video.acknowledgmentRequired ?? false,
    status: 'assigned',
    watch_seconds: 0,
    completion_percentage: 0,
    assigned_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('onboarding_video_assignments')
    .upsert(rows, {
      onConflict: 'user_id,enrollment_id,video_key',
    })
    .select();

  if (error) {
    throw new Error(
      `Unable to assign onboarding videos: ${error.message}`,
    );
  }

  return data;
}
