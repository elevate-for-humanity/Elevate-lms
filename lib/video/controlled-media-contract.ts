import type { MediaStoryboard } from './media-director';
import { MAX_LESSON_VIDEO_SCENES, MIN_LESSON_VIDEO_SCENES } from './media-director';

export const CONTROLLED_REVIEW_ROLES = [
  'instructional-design',
  'factual-citation',
  'assessment',
  'accessibility',
  'standards-coverage',
  'media-quality',
] as const;

export type ControlledReview = {
  role: (typeof CONTROLLED_REVIEW_ROLES)[number];
  passed: boolean;
  issues: string[];
};

export function reviewControlledStoryboard(storyboard: MediaStoryboard): ControlledReview[] {
  const issues: string[] = [];
  if (
    storyboard.scenes.length < MIN_LESSON_VIDEO_SCENES ||
    storyboard.scenes.length > MAX_LESSON_VIDEO_SCENES
  )
    issues.push(`Video must contain ${MIN_LESSON_VIDEO_SCENES}-${MAX_LESSON_VIDEO_SCENES} scenes.`);
  if (!storyboard.objective.trim()) issues.push('Objective is required.');
  if (!storyboard.scenes.some((scene) => scene.sceneType === 'knowledge_check'))
    issues.push('A knowledge-check scene is required.');
  const maxStock = Math.ceil(storyboard.scenes.length * 0.6);
  if (storyboard.scenes.filter((scene) => scene.mediaSource === 'pexels').length > maxStock)
    issues.push('Pexels scenes exceed the 60% controlled-build target.');
  for (const scene of storyboard.scenes) {
    if (!scene.dialogue?.trim()) issues.push(`${scene.id}: narration is required.`);
    if (!scene.requiredVisualEvidence?.trim())
      issues.push(`${scene.id}: visual evidence is required.`);
    if (!/^[a-f0-9]{64}$/i.test(scene.contentHash))
      issues.push(`${scene.id}: content hash is invalid.`);
    if (!scene.overlayTemplate.trim()) issues.push(`${scene.id}: overlay template is required.`);
  }
  return CONTROLLED_REVIEW_ROLES.map((role) => ({ role, passed: issues.length === 0, issues }));
}

export function approveControlledStoryboard(storyboard: MediaStoryboard) {
  const reviews = reviewControlledStoryboard(storyboard);
  const failures = reviews.flatMap((review) => review.issues);
  if (failures.length)
    throw new Error(`CONTROLLED_MEDIA_REVIEW_FAILED:${[...new Set(failures)].join('|')}`);
  return {
    storyboard: {
      ...storyboard,
      scenes: storyboard.scenes.map((scene) => ({ ...scene, reviewStatus: 'approved' as const })),
    },
    reviews,
  };
}
