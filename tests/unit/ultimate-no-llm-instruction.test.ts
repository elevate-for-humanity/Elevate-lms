import { describe, expect, it } from 'vitest';
import { UltimateAppendixAStandardsSource } from '../../lib/ultimate-course-builder/credential/appendix-a-source';
import { UltimatePlatformInstructionalGenerator } from '../../lib/ultimate-course-builder/adapters/platform-instructional-generator';
describe('source-grounded instruction', () => {
  it('does not fabricate a full lesson from a work-process title', async () => {
    const profile = await new UltimateAppendixAStandardsSource().load({
      programSlug: 'barber-apprenticeship',
    });
    await expect(
      new UltimatePlatformInstructionalGenerator().objectives({
        profile,
        competency: profile.competencies[0],
      }),
    ).rejects.toThrow('ULTIMATE_AUTHORED_BLUEPRINT_OR_INSTRUCTIONAL_SOURCES_REQUIRED');
  });
});
