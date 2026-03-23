import { describe, it, expect } from 'vitest';
import {
  normalizeLessonContent,
  mergeLessonContent,
  extractInstructionalText,
} from '@/lib/curriculum/normalize-lesson-content';
import { emptyLessonContent } from '@/lib/curriculum/lesson-content-schema';

describe('normalizeLessonContent', () => {
  it('returns empty defaults for null', () => {
    const result = normalizeLessonContent(null);
    expect(result.version).toBe(1);
    expect(result.objectives).toEqual([]);
    expect(result.instructionalContent).toBe('');
  });

  it('returns empty defaults for undefined', () => {
    const result = normalizeLessonContent(undefined);
    expect(result.version).toBe(1);
  });

  it('wraps a plain string as instructionalContent', () => {
    const result = normalizeLessonContent('This is lesson content about HVAC systems.');
    expect(result.version).toBe(1);
    expect(result.instructionalContent).toBe('This is lesson content about HVAC systems.');
    expect(result.objectives).toEqual([]);
  });

  it('returns empty for empty string', () => {
    const result = normalizeLessonContent('   ');
    expect(result.instructionalContent).toBe('');
  });

  it('parses a JSON string as structured content', () => {
    const structured = JSON.stringify({ version: 1, instructionalContent: 'Hello', objectives: ['Obj 1'] });
    const result = normalizeLessonContent(structured);
    expect(result.instructionalContent).toBe('Hello');
    expect(result.objectives).toEqual(['Obj 1']);
  });

  it('validates and returns already-structured content', () => {
    const input = {
      version: 1 as const,
      instructionalContent: 'Full lesson text here.',
      objectives: ['Identify key concepts', 'Apply techniques'],
      summary: 'A brief summary',
      materials: ['Textbook', 'Worksheet'],
      transcript: '',
      activityInstructions: '',
      evidence: { enabled: false, submissionModes: [], minItems: 0, reviewerRequired: false, instructions: '' },
      rubric: [],
      completionRule: { minMinutes: 0, requiresQuizPass: false, requiresEvidenceApproval: false, requiresSignoff: false, requiresHours: 0, requiresAttempts: 0 },
    };
    const result = normalizeLessonContent(input);
    expect(result.instructionalContent).toBe('Full lesson text here.');
    expect(result.objectives).toHaveLength(2);
  });

  it('hydrates legacy curriculum_lessons shape', () => {
    const legacy = {
      script_text: 'Legacy script content here.',
      summary_text: 'Legacy summary',
      reflection_prompt: 'Reflect on this.',
    };
    const result = normalizeLessonContent(legacy);
    expect(result.instructionalContent).toBe('Legacy script content here.');
    expect(result.summary).toBe('Legacy summary');
    expect(result.activityInstructions).toBe('Reflect on this.');
  });

  it('hydrates legacy video fields', () => {
    const legacy = {
      video_file: '/videos/lesson-1.mp4',
      transcript: 'Full transcript here.',
      video_runtime_seconds: 300,
    };
    const result = normalizeLessonContent(legacy);
    expect(result.video?.videoFile).toBe('/videos/lesson-1.mp4');
    expect(result.video?.runtimeSeconds).toBe(300);
  });

  it('never throws on malformed input', () => {
    expect(() => normalizeLessonContent(42)).not.toThrow();
    expect(() => normalizeLessonContent([])).not.toThrow();
    expect(() => normalizeLessonContent({ version: 99 })).not.toThrow();
  });
});

describe('mergeLessonContent', () => {
  it('merges a partial patch into existing content', () => {
    const base = emptyLessonContent();
    const merged = mergeLessonContent(base, { summary: 'New summary', objectives: ['Goal 1'] });
    expect(merged.summary).toBe('New summary');
    expect(merged.objectives).toEqual(['Goal 1']);
    expect(merged.version).toBe(1);
  });

  it('preserves unpatched fields', () => {
    const base = { ...emptyLessonContent(), instructionalContent: 'Original content' };
    const merged = mergeLessonContent(base, { summary: 'Updated' });
    expect(merged.instructionalContent).toBe('Original content');
  });
});

describe('extractInstructionalText', () => {
  it('extracts text from structured content', () => {
    const content = { version: 1 as const, instructionalContent: 'Main content', summary: 'Summary', activityInstructions: 'Do this', transcript: 'Transcript', objectives: [], materials: [], evidence: { enabled: false, submissionModes: [], minItems: 0, reviewerRequired: false, instructions: '' }, rubric: [], completionRule: { minMinutes: 0, requiresQuizPass: false, requiresEvidenceApproval: false, requiresSignoff: false, requiresHours: 0, requiresAttempts: 0 } };
    const text = extractInstructionalText(content);
    expect(text).toContain('Main content');
    expect(text).toContain('Summary');
  });

  it('extracts text from a plain string', () => {
    const text = extractInstructionalText('Plain lesson text here.');
    expect(text).toBe('Plain lesson text here.');
  });

  it('returns empty string for null', () => {
    expect(extractInstructionalText(null)).toBe('');
  });
});
