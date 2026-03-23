import { describe, it, expect } from 'vitest';
import {
  ALL_LESSON_TYPES,
  LESSON_TYPE_META,
  LEGACY_TYPE_MAP,
  normalizeLessonType,
  GATED_LESSON_TYPES,
  EVIDENCE_LESSON_TYPES,
  VIDEO_LESSON_TYPES,
  ASSESSMENT_LESSON_TYPES,
  PRACTICAL_LESSON_TYPES,
  type LessonType,
} from '@/lib/curriculum/lesson-types';

describe('ALL_LESSON_TYPES', () => {
  it('contains all 14 canonical types', () => {
    expect(ALL_LESSON_TYPES).toHaveLength(14);
  });

  it('includes all required types for accreditation', () => {
    const required: LessonType[] = [
      'reading', 'video', 'quiz', 'checkpoint', 'lab', 'assignment',
      'simulation', 'practicum', 'externship', 'clinical', 'observation',
      'final_exam', 'capstone', 'certification',
    ];
    for (const t of required) {
      expect(ALL_LESSON_TYPES).toContain(t);
    }
  });

  it('does not contain legacy types lesson or exam', () => {
    expect(ALL_LESSON_TYPES).not.toContain('lesson');
    expect(ALL_LESSON_TYPES).not.toContain('exam');
  });
});

describe('LESSON_TYPE_META', () => {
  it('has metadata for every canonical type', () => {
    for (const t of ALL_LESSON_TYPES) {
      expect(LESSON_TYPE_META[t]).toBeDefined();
      expect(LESSON_TYPE_META[t].label).toBeTruthy();
      expect(LESSON_TYPE_META[t].badge).toBeTruthy();
    }
  });
});

describe('normalizeLessonType', () => {
  it('maps legacy lesson → reading', () => {
    expect(normalizeLessonType('lesson')).toBe('reading');
  });

  it('maps legacy exam → final_exam', () => {
    expect(normalizeLessonType('exam')).toBe('final_exam');
  });

  it('passes through canonical types unchanged', () => {
    for (const t of ALL_LESSON_TYPES) {
      expect(normalizeLessonType(t)).toBe(t);
    }
  });

  it('falls back to reading for unknown types', () => {
    expect(normalizeLessonType('unknown_type')).toBe('reading');
    expect(normalizeLessonType(null)).toBe('reading');
    expect(normalizeLessonType(undefined)).toBe('reading');
    expect(normalizeLessonType('')).toBe('reading');
  });
});

describe('type groupings', () => {
  it('GATED_LESSON_TYPES requires passing score', () => {
    expect(GATED_LESSON_TYPES).toContain('quiz');
    expect(GATED_LESSON_TYPES).toContain('checkpoint');
    expect(GATED_LESSON_TYPES).toContain('final_exam');
    expect(GATED_LESSON_TYPES).not.toContain('reading');
    expect(GATED_LESSON_TYPES).not.toContain('lab');
  });

  it('EVIDENCE_LESSON_TYPES require evidence submission', () => {
    expect(EVIDENCE_LESSON_TYPES).toContain('lab');
    expect(EVIDENCE_LESSON_TYPES).toContain('practicum');
    expect(EVIDENCE_LESSON_TYPES).toContain('clinical');
    expect(EVIDENCE_LESSON_TYPES).toContain('capstone');
    expect(EVIDENCE_LESSON_TYPES).not.toContain('reading');
    expect(EVIDENCE_LESSON_TYPES).not.toContain('video');
  });

  it('VIDEO_LESSON_TYPES require transcript and runtime', () => {
    expect(VIDEO_LESSON_TYPES).toContain('video');
    expect(VIDEO_LESSON_TYPES).not.toContain('reading');
  });

  it('ASSESSMENT_LESSON_TYPES require quiz_questions', () => {
    expect(ASSESSMENT_LESSON_TYPES).toContain('quiz');
    expect(ASSESSMENT_LESSON_TYPES).toContain('checkpoint');
    expect(ASSESSMENT_LESSON_TYPES).toContain('final_exam');
  });

  it('PRACTICAL_LESSON_TYPES track hours', () => {
    expect(PRACTICAL_LESSON_TYPES).toContain('practicum');
    expect(PRACTICAL_LESSON_TYPES).toContain('externship');
    expect(PRACTICAL_LESSON_TYPES).toContain('clinical');
    expect(PRACTICAL_LESSON_TYPES).toContain('observation');
  });
});
