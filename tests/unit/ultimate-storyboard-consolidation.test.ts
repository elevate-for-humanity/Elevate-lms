import { describe, expect, it } from 'vitest';
import { storyboardSegments } from '@/lib/ultimate-course-builder/adapters/platform-instructional-generator';
import { ULTIMATE_TEACHING_SEQUENCE } from '@/lib/ultimate-course-builder/instructional/teaching-sequence';
import {
  stepInputHash,
  contractHash,
  ULTIMATE_LESSON_CONTRACT_VERSION,
} from '@/lib/ultimate-course-builder/core/lesson-contract';
import { produceTeachingVisual } from '@/lib/ultimate-course-builder/instructional/teaching-visual';

function authored() {
  return ULTIMATE_TEACHING_SEQUENCE.flatMap((stage, i) =>
    Array.from({ length: i < 7 ? 2 : 1 }, (_, part) => ({
      id: `${stage}:${part}`,
      stage,
      text: `Authorized instruction ${stage} part ${part}.`,
      objectiveIds: [`objective:${part}`],
      sourceRequirementIds: [`source:${part}`],
      visualRequirement: `Show ${stage} part ${part}.`,
      sceneType: 'system_diagram',
    })),
  );
}
describe('long authored storyboard alignment', () => {
  it('preserves all 20 narration passages and source mappings in 13 ordered stage scenes', () => {
    const original = authored();
    const snapshot = structuredClone(original);
    const grouped = storyboardSegments(original);
    expect(grouped).toHaveLength(13);
    expect(grouped.map((s) => s.stage)).toEqual([...ULTIMATE_TEACHING_SEQUENCE]);
    expect(grouped.map((s) => s.text).join('\n\n')).toBe(original.map((s) => s.text).join('\n\n'));
    expect(grouped[0].sourceRequirementIds).toEqual(['source:0', 'source:1']);
    expect(grouped[0].objectiveIds).toEqual(['objective:0', 'objective:1']);
    expect(original).toEqual(snapshot);
  });
  it('keeps valid short scripts unchanged and does not silently discard custom visual plans', () => {
    const short = authored().slice(0, 13);
    expect(storyboardSegments(short)).toBe(short);
    const original = authored();
    const custom = original.map((s, i) =>
      i === 0 ? { ...s, teachingVisual: produceTeachingVisual(s.text, s.stage) } : s,
    );
    expect(() => storyboardSegments(custom)).toThrow('AUTHORED_VISUAL_CONSOLIDATION_REQUIRED');
  });
  it('invalidates old script checkpoints while retaining the standards contract', () => {
    const old = contractHash({
      version: ULTIMATE_LESSON_CONTRACT_VERSION,
      profile: {},
      step: 'instructor_script',
      dependencies: [
        'standards_lock',
        'learning_objectives',
        'prerequisites',
        'teaching_sequence',
      ].map((s) => [s, contractHash({})]),
    });
    expect(stepInputHash('instructor_script', {}, {})).not.toBe(old);
    expect(stepInputHash('standards_lock', {}, {})).toBe(
      contractHash({
        version: ULTIMATE_LESSON_CONTRACT_VERSION,
        profile: {},
        step: 'standards_lock',
        dependencies: [],
      }),
    );
  });
});
