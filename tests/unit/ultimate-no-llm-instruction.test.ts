import { describe, expect, it } from 'vitest';
import { UltimateAppendixAStandardsSource } from '../../lib/ultimate-course-builder/credential/appendix-a-source';
import { UltimatePlatformInstructionalGenerator } from '../../lib/ultimate-course-builder/adapters/platform-instructional-generator';
describe('source-grounded instruction', () => {
  it('builds the registered barber lesson from the authorized curriculum blueprint', async () => {
    const profile = await new UltimateAppendixAStandardsSource().load({
      programSlug: 'barber-apprenticeship',
    });
    const objectives = await new UltimatePlatformInstructionalGenerator().objectives({
      profile,
      competency: profile.competencies[0],
    });
    expect(profile.instructionalSources).toHaveLength(profile.competencies.length);
    expect(profile.instructionalSources?.[0]?.text).toContain('Clipper Over Comb');
    expect(objectives[0]?.text).toBe(profile.competencies[0].description);
    const generator = new UltimatePlatformInstructionalGenerator();
    for (const competency of profile.competencies) {
      const storyboard = await generator.storyboard({ profile, competency });
      expect(storyboard.scenes).toHaveLength(13);
      expect(storyboard.scenes.every((scene) => scene.teachingVisual.steps.length > 0)).toBe(true);
    }
  });
});
