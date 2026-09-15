import { describe, expect, it } from 'vitest';
import { buildLessonLearningObjects } from '@/lib/course-factory/learning-objects';
import { directMedia } from '@/lib/video/media-director';
import { approveControlledStoryboard } from '@/lib/video/controlled-media-contract';
import { cpuOnlyCourseMedia } from '@/lib/video/remotion-render';

describe('controlled course media architecture', () => {
  it('builds fourteen ordered first-class learning objects', () => {
    const objects = buildLessonLearningObjects({
      slug: 'pilot',
      videoUrl: 'https://cdn.example/pilot.mp4',
      quizQuestions: [{}],
      experience: { practicalTask: {}, scenario: {}, knowledgeChecks: [{}] },
    });
    expect(objects).toHaveLength(14);
    expect(objects.map((object) => object.order)).toEqual([...Array(14)].map((_, i) => i + 1));
    expect(objects.filter((object) => object.type === 'instructional-video')).toHaveLength(1);
  });

  it('approves a deterministic eight-scene 60/40 storyboard', () => {
    const scenes = [...Array(8)].map((_, index) => ({
      id: `scene-${index + 1}`,
      narration: `Narration for controlled scene ${index + 1}.`,
      action: `Show evidence ${index + 1}`,
      required_visual_evidence: `Visible evidence ${index + 1}`,
      scene_type: index === 7 ? 'knowledge_check' : index === 0 ? 'problem_hook' : 'worked_example',
      media_source: index < 5 ? 'pexels' : 'elevate-motion',
    }));
    const storyboard = directMedia({
      title: 'Pilot',
      objective: 'Complete the pilot',
      script: 'Pilot lesson.',
      sceneData: { scenes },
    });
    const approved = approveControlledStoryboard(storyboard);
    expect(approved.storyboard.scenes.every((scene) => scene.reviewStatus === 'approved')).toBe(
      true,
    );
    expect(approved.reviews).toHaveLength(6);
  });

  it('keeps GPU generation disabled unless explicitly opting into legacy mode', () => {
    expect(cpuOnlyCourseMedia({} as NodeJS.ProcessEnv)).toBe(true);
    expect(
      cpuOnlyCourseMedia({ COURSE_MEDIA_RENDER_MODE: 'legacy-gpu-opt-in' } as NodeJS.ProcessEnv),
    ).toBe(false);
  });
});
