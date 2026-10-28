import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const player = readFileSync('components/lms/InteractiveVideoPlayer.tsx', 'utf8');
const route = readFileSync('apps/lms/app/api/video-playback-events/route.ts', 'utf8');

describe('learner playback evidence contract', () => {
  it('records genuine learner play and bounded heartbeat evidence', () => {
    expect(player).toContain('await sendPlaybackEvent({');
    expect(player).toContain("Math.floor(ct / 30)");
    expect(player).toMatch(/recordPlaybackEvent\(\s*'play'/);
    expect(player).toContain("recordPlaybackEvent('heartbeat'");
    expect(player).toMatch(/recordPlaybackEvent\(\s*'ended'/);
  });

  it('never writes playback evidence from read-only administrator preview', () => {
    expect(player).toContain('if (readOnly || !lessonRecordId || !courseId) return');
  });

  it('revalidates authenticated lesson access before the service insert', () => {
    expect(route).toContain('await supabase.auth.getUser()');
    expect(route).toContain("code: 'PREVIEW_READ_ONLY'");
    expect(route).toContain("supabase.rpc('get_my_course_pacing'");
    expect(route).toContain('await assertLessonAccess(user.id, lessonId)');
    expect(route).toContain("lesson.status !== 'published'");
    expect(route).toContain(".from('video_playback_events').insert");
    expect(route).toContain("action: 'learner_video_playback'");
    expect(route).not.toContain("from('lesson_progress')");
    expect(route).not.toContain("from('course_progress')");
  });
});

