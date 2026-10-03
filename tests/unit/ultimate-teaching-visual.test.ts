import { describe, it, expect } from 'vitest';
import blueprint from '../../docs/ultimate-course-builder/lessons/cosmetology-welcome.blueprint.json';
import {
  validateTeachingVisual,
  teachingVisualStepIndex,
  produceTeachingVisual,
  type TeachingVisual,
} from '@/lib/ultimate-course-builder/instructional/teaching-visual';
import { prepareUltimateStoryboardInput } from '@/lib/ultimate-course-builder/adapters/platform-renderer';
import { directMedia } from '@/lib/video/media-director';
describe('script-bound teaching producer', () => {
  it('constructs every teaching state from the script without dropping or inventing words', () => {
    const narration =
      'Record the actual duration. Ask the designated reviewer to check the entry. Do not claim independent performance when you only observed a service.';
    const plan = produceTeachingVisual(narration, 'demonstration');
    expect(plan.steps.map((s) => s.value).join(' ')).toBe(narration);
    expect(plan.steps.every((s) => s.value === s.narrationQuote)).toBe(true);
    expect(() => validateTeachingVisual(plan, narration)).not.toThrow();
  });
  it('preserves every authored teaching state through the actual storyboard converter', () => {
    const assets = blueprint.segments.map((s, i) => ({
      id: `a${i}`,
      entitlement_id: `e${i}`,
      provider: 'envato',
      provider_item_id: `p${i}`,
      license_evidence_url: 'https://example.org/license',
      public_url: `https://example.org/a${i}.jpg`,
    }));
    const scenes = blueprint.segments.map((s) => ({
      ...s,
      id: `scene:${s.id}`,
      dialogue: s.text,
      teachingPoint: s.text,
      title: s.stage,
    }));
    const input = prepareUltimateStoryboardInput({
      courseTitle: 'Cosmetology',
      artifacts: {
        storyboard: { storyboard: { scenes } },
        visual_assignment: {
          media: {
            readyAssets: assets,
            assignments: scenes.map((s, i) => ({ sceneId: s.id, assetId: `a${i}` })),
          },
        },
      },
    });
    const actual = directMedia(input);
    expect(actual.scenes.map((s) => s.teachingVisual)).toEqual(
      blueprint.segments.map((s) => s.teachingVisual),
    );
    for (const s of blueprint.segments)
      expect(() =>
        validateTeachingVisual(s.teachingVisual as TeachingVisual, s.text),
      ).not.toThrow();
  });
  it('rejects teaching evidence quoted from another lesson', () => {
    const plan = {
      kind: 'record' as const,
      steps: [
        {
          label: 'Approval',
          value: 'Approved',
          narrationQuote: 'The supervisor approved the hours.',
        },
      ],
    };
    expect(() => validateTeachingVisual(plan, blueprint.segments[0].text)).toThrow(
      'NOT_SCRIPT_BOUND',
    );
  });
  it('advances through all states exactly once instead of replaying a loop', () => {
    expect([0, 5, 10, 15, 19.9].map((t) => teachingVisualStepIndex(t, 20, 4))).toEqual([
      0, 1, 2, 3, 3,
    ]);
  });
});
