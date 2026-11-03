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

  const enrollment = await supabase.from('program_enrollments').select('id')
    .eq('id', input.enrollmentId).eq('user_id', input.userId).maybeSingle();
  if (enrollment.error || !enrollment.data) throw new Error('Enrollment could not be verified');
  // General orientation is assigned once per person/video by the canonical
  // schema. Reassignment must preserve existing watch/completion evidence.
  const rows = videos.map(video => ({ user_id: input.userId, video_key: video.id }));

  const { error } = await supabase
    .from('onboarding_video_assignments')
    .upsert(rows, {
      onConflict: 'user_id,video_key',
      ignoreDuplicates: true,
    });

  if (error) {
    throw new Error(
      `Unable to assign onboarding videos: ${error.message}`,
    );
  }

  const assignments = await supabase.from('onboarding_video_assignments').select('*')
    .eq('user_id', input.userId).in('video_key', videos.map(video => video.id));
  if (assignments.error) throw new Error('Assigned onboarding videos could not be read');
  return (assignments.data ?? []).map(row => {
    const video = videos.find(item => item.id === row.video_key)!;
    return { ...row, title: video.title, sequence: video.sequence, required: video.required,
      acknowledgment_required: video.acknowledgmentRequired ?? false };
  }).sort((a, b) => a.sequence - b.sequence);
}
