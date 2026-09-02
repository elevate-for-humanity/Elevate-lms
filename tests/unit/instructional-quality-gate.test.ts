import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import { instructionalQualityFailures } from '@/lib/video/instructional-quality-gate';
import type { MediaStoryboard } from '@/lib/video/media-director';

const longInstruction = Array.from({ length: 190 }, (_, index) =>
  index % 12 === 0 ? 'sanitation' : index % 17 === 0 ? 'disinfection' : 'instruction',
).join(' ');

function storyboard(closeUp = true): MediaStoryboard {
  return {
    version: '1.0', title: 'Sanitation and Disinfection', objective: 'Apply sanitation and disinfection',
    aspectRatio: '16:9', width: 1280, height: 720, fps: 30, characters: [], promptHash: 'test',
    scenes: [{
      id: 'scene-1', order: 1, durationSeconds: 8, operation: 'textToVideo', subject: 'Sanitation',
      environment: 'salon', action: 'Disinfect tools', visualStyle: 'educational',
      shotSize: closeUp ? 'close-up' : 'wide', cameraMove: 'locked', lighting: 'bright', transition: 'cut',
      characterIds: [], requiredVisualEvidence: 'Hands immerse cleaned tools in labeled disinfectant',
    }],
  };
}

const instructor = { id: 'avery-brooks', title: 'Cosmetology Education Specialist', specialty: 'Cosmetology' };

describe('instructional quality gate', () => {
  it('accepts substantive, aligned cosmetology instruction', () => {
    expect(instructionalQualityFailures({
      courseTitle: 'Cosmetology Apprenticeship', lessonTitle: 'Sanitation and Disinfection',
      script: longInstruction, instructor, storyboard: storyboard(),
    }).failures).toEqual([]);
  });

  it('rejects a barber instructor in a cosmetology lesson', () => {
    const result = instructionalQualityFailures({
      courseTitle: 'Cosmetology Apprenticeship', lessonTitle: 'Sanitation and Disinfection',
      script: `${longInstruction} Your master barber instructor demonstrates the procedure.`,
      instructor: { id: 'james-williams', title: 'Master Barber', specialty: 'Barbering' }, storyboard: storyboard(),
    });
    expect(result.failures.some((failure) => failure.includes('barbering instructor'))).toBe(true);
  });

  it('rejects short narration and unsupported demonstration claims', () => {
    const result = instructionalQualityFailures({
      courseTitle: 'Cosmetology Apprenticeship', lessonTitle: 'Sanitation and Disinfection',
      script: 'Watch this sanitation and disinfection demonstration.', instructor, storyboard: storyboard(false),
    });
    expect(result.failures.some((failure) => failure.includes('too short'))).toBe(true);
    expect(result.failures.some((failure) => failure.includes('claims a visual demonstration'))).toBe(true);
  });

  it('does not treat competency mastery language as a visual demonstration claim', () => {
    const result = instructionalQualityFailures({
      courseTitle: 'Cosmetology Apprenticeship', lessonTitle: 'Sanitation and Disinfection',
      script: `${longInstruction} Demonstrate mastery of sanitation and disinfection before progressing.`,
      instructor, storyboard: storyboard(false),
    });
    expect(result.evidence.demonstrationClaimed).toBe(false);
    expect(result.failures).toEqual([]);
  });

  it('requires a complete intelligence arc for HVAC lessons', () => {
    const dry = storyboard();
    dry.title = 'EPA 608 Refrigeration Cycle';
    const script = `${longInstruction} EPA 608 refrigeration cycle compressor condenser evaporator.`;
    const rejected = instructionalQualityFailures({
      courseTitle: 'HVAC EPA 608 Preparation', lessonTitle: 'EPA 608 Refrigeration Cycle',
      script, instructor: { id: 'marcus-johnson', title: 'HVAC Instructor', specialty: 'HVAC' }, storyboard: dry,
    });
    expect(rejected.failures.some((failure) => failure.includes('mental-model'))).toBe(true);

    const complete = storyboard();
    complete.scenes = [
      'problem_hook', 'mental_model', 'system_diagram', 'equipment_closeup',
      'worked_example', 'safety_warning', 'memory_recap', 'knowledge_check',
    ].map((sceneType, index) => ({ ...complete.scenes[0]!, id: `scene-${index + 1}`, order: index + 1, sceneType: sceneType as NonNullable<typeof complete.scenes[0]['sceneType']> }));
    expect(instructionalQualityFailures({
      courseTitle: 'HVAC EPA 608 Preparation', lessonTitle: 'EPA 608 Refrigeration Cycle',
      script, instructor: { id: 'marcus-johnson', title: 'HVAC Instructor', specialty: 'HVAC' }, storyboard: complete,
    }).failures).toEqual([]);
  });
});
