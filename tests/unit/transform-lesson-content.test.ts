import { describe, it, expect } from 'vitest';
import {
  transformLessonContent,
  isAiJsonBlob,
} from '@/lib/lms/transformLessonContent';

// ── fixtures ──────────────────────────────────────────────────────────────────

const VALID_BLOB = {
  learning_points: [
    'Refrigerant handling requires EPA 608 certification',
    'Section 608 covers four certification types: Type I, II, III, and Universal',
    'Technicians must recover refrigerant before opening a system',
  ],
  scenario:
    'A technician is called to service a rooftop unit. Before opening the system they must verify their certification type covers the equipment class.',
  assessment_question: {
    question: 'Which EPA 608 certification type covers all equipment?',
    choices: {
      a: 'Type I',
      b: 'Type II',
      c: 'Type III',
      d: 'Universal',
    },
    correct: 'd' as const,
    rationale:
      'Universal certification covers all equipment types under Section 608.',
  },
};

const VALID_JSON = JSON.stringify(VALID_BLOB);

// ── transformLessonContent ────────────────────────────────────────────────────

describe('transformLessonContent', () => {
  it('returns empty result for null input', () => {
    const result = transformLessonContent(null);
    expect(result.html).toBe('');
    expect(result.quizQuestions).toHaveLength(0);
  });

  it('returns empty result for undefined input', () => {
    const result = transformLessonContent(undefined);
    expect(result.html).toBe('');
    expect(result.quizQuestions).toHaveLength(0);
  });

  it('passes through existing HTML unchanged', () => {
    const html = '<div class="lesson-content"><h2>Key Concepts</h2></div>';
    const result = transformLessonContent(html);
    expect(result.html).toBe(html);
    expect(result.quizQuestions).toHaveLength(0);
  });

  it('returns raw string for unparseable JSON', () => {
    const bad = 'not json at all';
    const result = transformLessonContent(bad);
    expect(result.html).toBe(bad);
    expect(result.quizQuestions).toHaveLength(0);
  });

  it('passes through non-AI JSON objects unchanged', () => {
    const other = JSON.stringify({ title: 'something', body: 'text' });
    const result = transformLessonContent(other);
    expect(result.html).toBe(other);
    expect(result.quizQuestions).toHaveLength(0);
  });

  it('transforms a valid JSON string into HTML', () => {
    const result = transformLessonContent(VALID_JSON, 'hvac-lesson-1');
    expect(result.html).toContain('<div class="lesson-content">');
    expect(result.html).toContain('<h2>Key Concepts</h2>');
    expect(result.html).toContain('<li>Refrigerant handling requires EPA 608 certification</li>');
    expect(result.html).toContain('<h2>Workplace Scenario</h2>');
    expect(result.html).toContain('rooftop unit');
  });

  it('transforms a valid parsed object into HTML', () => {
    const result = transformLessonContent(VALID_BLOB, 'hvac-lesson-1');
    expect(result.html).toContain('<li>Refrigerant handling requires EPA 608 certification</li>');
  });

  it('produces a quiz question from assessment_question', () => {
    const result = transformLessonContent(VALID_JSON, 'hvac-lesson-1');
    expect(result.quizQuestions).toHaveLength(1);
    const q = result.quizQuestions[0];
    expect(q.question).toBe('Which EPA 608 certification type covers all equipment?');
    expect(q.options).toHaveLength(4);
    expect(q.options[0]).toBe('Type I');
    expect(q.options[3]).toBe('Universal');
    expect(q.correct_index).toBe(3); // 'd' is index 3
    expect(q.explanation).toContain('Universal certification');
  });

  it('sets correct_index to 0 for choice "a"', () => {
    const blob = { ...VALID_BLOB, assessment_question: { ...VALID_BLOB.assessment_question, correct: 'a' as const } };
    const result = transformLessonContent(blob, 'test');
    expect(result.quizQuestions[0].correct_index).toBe(0);
  });

  it('sets correct_index to 1 for choice "b"', () => {
    const blob = { ...VALID_BLOB, assessment_question: { ...VALID_BLOB.assessment_question, correct: 'b' as const } };
    const result = transformLessonContent(blob, 'test');
    expect(result.quizQuestions[0].correct_index).toBe(1);
  });

  it('returns empty quiz when assessment_question is missing', () => {
    const blob = { learning_points: ['Point A'], scenario: 'A scenario here for testing purposes.' };
    const result = transformLessonContent(JSON.stringify(blob), 'test');
    expect(result.quizQuestions).toHaveLength(0);
    expect(result.html).toContain('<li>Point A</li>');
  });

  it('escapes HTML special characters in learning_points', () => {
    const blob = {
      ...VALID_BLOB,
      learning_points: ['Use <script>alert(1)</script> safely', 'A & B are both valid'],
    };
    const result = transformLessonContent(blob, 'test');
    expect(result.html).not.toContain('<script>');
    expect(result.html).toContain('&lt;script&gt;');
    expect(result.html).toContain('A &amp; B');
  });

  it('escapes HTML special characters in scenario', () => {
    const blob = { ...VALID_BLOB, scenario: 'Check "quotes" & <tags> here for safety.' };
    const result = transformLessonContent(blob, 'test');
    expect(result.html).toContain('&quot;quotes&quot;');
    expect(result.html).toContain('&amp;');
    expect(result.html).not.toContain('<tags>');
  });

  it('includes compliance_notice when present', () => {
    const blob = { ...VALID_BLOB, compliance_notice: 'Must hold active EPA 608 certification.' };
    const result = transformLessonContent(blob, 'test');
    expect(result.html).toContain('Compliance Notice');
    expect(result.html).toContain('Must hold active EPA 608 certification.');
  });

  it('omits compliance section when compliance_notice is absent', () => {
    const result = transformLessonContent(VALID_JSON, 'test');
    expect(result.html).not.toContain('Compliance Notice');
  });

  it('assigns a stable id using the lessonSlug', () => {
    const result = transformLessonContent(VALID_JSON, 'hvac-lesson-42');
    expect(result.quizQuestions[0].id).toBe('hvac-lesson-42-q1');
  });

  it('uses default slug when none provided', () => {
    const result = transformLessonContent(VALID_JSON);
    expect(result.quizQuestions[0].id).toBe('lesson-q1');
  });
});

// ── isAiJsonBlob ──────────────────────────────────────────────────────────────

describe('isAiJsonBlob', () => {
  it('returns true for a valid AI JSON string', () => {
    expect(isAiJsonBlob(VALID_JSON)).toBe(true);
  });

  it('returns false for an HTML string', () => {
    expect(isAiJsonBlob('<div>content</div>')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isAiJsonBlob(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isAiJsonBlob(undefined)).toBe(false);
  });

  it('returns false for plain text', () => {
    expect(isAiJsonBlob('just some text')).toBe(false);
  });

  it('returns false for JSON without AI fields', () => {
    expect(isAiJsonBlob(JSON.stringify({ title: 'foo', body: 'bar' }))).toBe(false);
  });

  it('returns true for JSON with only learning_points', () => {
    expect(isAiJsonBlob(JSON.stringify({ learning_points: ['A', 'B'] }))).toBe(true);
  });

  it('returns true for JSON with only scenario', () => {
    expect(isAiJsonBlob(JSON.stringify({ scenario: 'A workplace situation.' }))).toBe(true);
  });
});
