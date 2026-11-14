import { describe, expect, it } from 'vitest';
import { normalizeLessonContract } from '@/lib/course-factory/lesson-contract-normalizer';
import { normalizeProviderJson } from '@/lib/course-factory/provider-json-normalizer';

describe('lesson contract normalization', () => {
  it('derives a missing exercise verification step from its own artifact and criteria', () => {
    const normalized = JSON.parse(normalizeLessonContract(JSON.stringify({
      objective: 'Select HVAC tools safely for a service task.',
      learning_points: [
        'Match each tool to its intended measurement.',
        'Inspect tools before use.',
        'Document readings accurately.',
      ],
      experience: {
        exercises: [{
          id: 'tool-selection',
          title: 'Select the service tools',
          instructions: ['Choose the tools required for the diagnosed HVAC task.'],
          expectedArtifact: 'a completed tool-selection checklist',
          autoGrade: {
            type: 'checklist',
            criteria: [
              'Every selected tool matches the service task',
              'Safety inspection results are recorded',
            ],
          },
        }],
      },
    })));

    expect(normalized.experience.exercises[0].instructions).toEqual([
      'Choose the tools required for the diagnosed HVAC task.',
      'Document a completed tool-selection checklist, then verify it against these success criteria before submission: Every selected tool matches the service task; Safety inspection results are recorded.',
    ]);
  });

  it('leaves an empty exercise invalid for the provider retry path', () => {
    const normalized = JSON.parse(normalizeLessonContract(JSON.stringify({
      objective: 'Select HVAC tools safely.',
      learning_points: ['Select tools.', 'Inspect tools.', 'Record results.'],
      experience: {
        exercises: [{
          id: 'empty-exercise',
          title: 'Incomplete exercise',
          instructions: [],
          expectedArtifact: 'a checklist',
          autoGrade: { type: 'checklist', criteria: ['Complete the checklist'] },
        }],
      },
    })));

    expect(normalized.experience.exercises[0].instructions).toEqual([]);
  });

  it('moves provider experience fields from the root and expands the main visual prompt', () => {
    const normalized = JSON.parse(normalizeLessonContract(JSON.stringify({
      objective: 'Demonstrate safe client preparation.',
      learning_points: [
        'Prepare the workstation before service.',
        'Protect the client using the required draping steps.',
        'Verify the setup before beginning the service.',
      ],
      experience: {},
      visualPrompt: 'Show the setup.',
      instructionalTimeline: {
        version: 1,
        width: 1920,
        height: 1080,
        fps: 30,
        durationSeconds: 60,
        scenes: [],
        captions: [],
        events: [],
        requiredWatchPercent: 95,
        minimumSeatTimeSeconds: 60,
        preventSeekPastRequiredEvents: true,
        resumeEnabled: true,
      },
    })));

    expect(normalized.visualPrompt).toBeUndefined();
    expect(normalized.instructionalTimeline).toBeUndefined();
    expect(normalized.experience.visualPrompt.length).toBeGreaterThanOrEqual(40);
    expect(normalized.experience.visualPrompt).toContain('Prepare the workstation before service.');
    expect(normalized.experience.instructionalTimeline.version).toBe(1);
  });

  it('repairs unambiguous provider punctuation without inventing content', () => {
    const malformed = '{"items":[{"name":"first"} {"name":"second"},],"complete":true}';
    expect(JSON.parse(normalizeProviderJson(malformed))).toEqual({
      items: [{ name: 'first' }, { name: 'second' }],
      complete: true,
    });
  });
});
