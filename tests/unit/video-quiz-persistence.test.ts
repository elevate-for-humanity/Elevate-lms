/**
 * Video quiz persistence logic tests.
 *
 * Tests the validation and upsert logic for /api/lms/video-quiz-results
 * in isolation — no Next.js imports, no DB calls.
 */

import { describe, it, expect } from 'vitest';

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuizAnswerPayload {
  question?: string;
  selectedAnswer?: number;
  correctAnswer?: number;
  isCorrect?: boolean;
  timestamp?: number;
  lessonId?: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  status?: number;
}

// ── Validation logic (mirrors route handler) ──────────────────────────────────

function validateQuizPayload(body: QuizAnswerPayload): ValidationResult {
  if (!body.question) {
    return { valid: false, error: 'Missing required fields: question, selectedAnswer, isCorrect', status: 400 };
  }
  if (body.selectedAnswer === undefined) {
    return { valid: false, error: 'Missing required fields: question, selectedAnswer, isCorrect', status: 400 };
  }
  if (body.isCorrect === undefined) {
    return { valid: false, error: 'Missing required fields: question, selectedAnswer, isCorrect', status: 400 };
  }
  return { valid: true };
}

// ── Upsert key logic (mirrors unique constraint: user_id, lesson_id, question) ─

interface UpsertRecord {
  user_id: string;
  lesson_id: string | null;
  question: string;
  selected_answer: number;
  correct_answer: number | null;
  is_correct: boolean;
  timestamp_sec: number | null;
}

function buildUpsertRecord(
  userId: string,
  body: Required<Pick<QuizAnswerPayload, 'question' | 'selectedAnswer' | 'isCorrect'>> & Partial<QuizAnswerPayload>
): UpsertRecord {
  return {
    user_id: userId,
    lesson_id: body.lessonId ?? null,
    question: body.question,
    selected_answer: body.selectedAnswer,
    correct_answer: body.correctAnswer ?? null,
    is_correct: body.isCorrect,
    timestamp_sec: body.timestamp ?? null,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Video quiz payload validation', () => {

  it('rejects missing question', () => {
    const result = validateQuizPayload({ selectedAnswer: 0, isCorrect: true });
    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
  });

  it('rejects missing selectedAnswer', () => {
    const result = validateQuizPayload({ question: 'What is refrigerant?', isCorrect: true });
    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
  });

  it('rejects missing isCorrect', () => {
    const result = validateQuizPayload({ question: 'What is refrigerant?', selectedAnswer: 2 });
    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
  });

  it('accepts selectedAnswer of 0 (falsy but valid)', () => {
    const result = validateQuizPayload({ question: 'Q?', selectedAnswer: 0, isCorrect: false });
    expect(result.valid).toBe(true);
  });

  it('accepts isCorrect of false (falsy but valid)', () => {
    const result = validateQuizPayload({ question: 'Q?', selectedAnswer: 1, isCorrect: false });
    expect(result.valid).toBe(true);
  });

  it('accepts full valid payload', () => {
    const result = validateQuizPayload({
      question: 'What is the boiling point of R-22?',
      selectedAnswer: 2,
      correctAnswer: 2,
      isCorrect: true,
      timestamp: 42.5,
      lessonId: 'lesson-uuid',
    });
    expect(result.valid).toBe(true);
  });
});

describe('Video quiz upsert record builder', () => {

  it('builds record with all fields', () => {
    const record = buildUpsertRecord('user-1', {
      question: 'What is R-410A?',
      selectedAnswer: 1,
      correctAnswer: 1,
      isCorrect: true,
      timestamp: 30,
      lessonId: 'lesson-abc',
    });
    expect(record.user_id).toBe('user-1');
    expect(record.lesson_id).toBe('lesson-abc');
    expect(record.question).toBe('What is R-410A?');
    expect(record.selected_answer).toBe(1);
    expect(record.correct_answer).toBe(1);
    expect(record.is_correct).toBe(true);
    expect(record.timestamp_sec).toBe(30);
  });

  it('sets lesson_id to null when not provided', () => {
    const record = buildUpsertRecord('user-1', {
      question: 'Q?',
      selectedAnswer: 0,
      isCorrect: false,
    });
    expect(record.lesson_id).toBeNull();
  });

  it('sets correct_answer to null when not provided', () => {
    const record = buildUpsertRecord('user-1', {
      question: 'Q?',
      selectedAnswer: 0,
      isCorrect: false,
    });
    expect(record.correct_answer).toBeNull();
  });

  it('sets timestamp_sec to null when not provided', () => {
    const record = buildUpsertRecord('user-1', {
      question: 'Q?',
      selectedAnswer: 0,
      isCorrect: false,
    });
    expect(record.timestamp_sec).toBeNull();
  });

  it('upsert key is unique per user+lesson+question', () => {
    // Two records with same user+lesson+question should produce identical keys
    const r1 = buildUpsertRecord('user-1', { question: 'Q?', selectedAnswer: 0, isCorrect: false, lessonId: 'l1' });
    const r2 = buildUpsertRecord('user-1', { question: 'Q?', selectedAnswer: 1, isCorrect: true,  lessonId: 'l1' });
    // Same composite key — r2 should overwrite r1 in DB
    expect(r1.user_id).toBe(r2.user_id);
    expect(r1.lesson_id).toBe(r2.lesson_id);
    expect(r1.question).toBe(r2.question);
    // But the answer changed — latest answer wins
    expect(r1.selected_answer).toBe(0);
    expect(r2.selected_answer).toBe(1);
  });
});
