import { describe, it, expect } from 'vitest';
import blueprint from '../../docs/ultimate-course-builder/lessons/cosmetology-welcome.blueprint.json';
import { UltimatePlatformInstructionalGenerator } from '../../lib/ultimate-course-builder/adapters/platform-instructional-generator';

describe('existing authored cosmetology sample', () => {
  it('preserves the complete authored script and every visual requirement', async () => {
    const generator = new UltimatePlatformInstructionalGenerator();
    const competency = { id: blueprint.competencyId, title: 'Welcome to Cosmetology Apprenticeship', authorityRequirementIds: [], requiresPracticalEvidence: false };
    const input = { competency, profile: { authority: 'course-defined', lessonBlueprints: { [competency.id]: blueprint } } };
    const script = await generator.instructorScript(input);
    const storyboard = await generator.storyboard(input);
    expect(script.segments).toEqual(blueprint.segments);
    expect(storyboard.scenes).toHaveLength(13);
    expect(storyboard.scenes.map(scene => scene.dialogue)).toEqual(blueprint.segments.map(segment => segment.text));
    expect(storyboard.scenes.map(scene => scene.visualRequirement)).toEqual(blueprint.segments.map(segment => segment.visualRequirement));
  });
});
