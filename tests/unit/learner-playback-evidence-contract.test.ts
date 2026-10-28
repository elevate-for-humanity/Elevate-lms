import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const player = readFileSync('components/lms/InteractiveVideoPlayer.tsx', 'utf8');
const route = readFileSync('apps/lms/app/api/video-playback-events/route.ts', 'utf8');

describe('learner playback evidence contract', () => {
  it('records genuine learner play and bounded heartbeat evidence', () => {
    expect(player).toContain("fetch('/api/video-playback-events'");
    expect(player).toContain("Math.floor(ct / 30)");
    expect(player).toContain("recordPlaybackEvent('play'");
    expect(player).toContain("recordPlaybackEvent('heartbeat'");
    expect(player).toContain("recordPlaybackEvent('ended'");
  });

  it('never writes playback evidence from read-only administrator preview', () => {
    expect(player).toContain('if (readOnly || !lessonRecordId || !courseId) return');
  });

  it('revalidates authenticated lesson access before the service insert', () => {
    expect(route).toContain('const user = await getCurrentUser()');
    expect(route).toContain('await assertLessonAccess(user.id, lessonId)');
    expect(route).toContain("lesson.status !== 'published'");
    expect(route).toContain(".from('video_playback_events').insert");
    expect(route).toContain("action: 'learner_video_playback'");
    expect(route).not.toContain("from('lesson_progress')");
    expect(route).not.toContain("from('course_progress')");
  });
});
