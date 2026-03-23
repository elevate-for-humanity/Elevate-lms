import { describe, it, expect } from 'vitest';
import { getLessonRenderMode } from '@/lib/lms/get-lesson-render-mode';

describe('getLessonRenderMode', () => {
  it('routes reading lesson to reading mode', () => {
    const config = getLessonRenderMode({ lesson_type: 'reading' });
    expect(config.mode).toBe('reading');
    expect(config.requiresEvidence).toBe(false);
    expect(config.requiresPass).toBe(false);
  });

  it('routes video lesson to video mode', () => {
    const config = getLessonRenderMode({ lesson_type: 'video' });
    expect(config.mode).toBe('video');
    expect(config.requiresEvidence).toBe(false);
    expect(config.requiresPass).toBe(false);
  });

  it('routes quiz to quiz mode with requiresPass=true', () => {
    const config = getLessonRenderMode({ lesson_type: 'quiz' });
    expect(config.mode).toBe('quiz');
    expect(config.requiresPass).toBe(true);
  });

  it('routes checkpoint to checkpoint mode with requiresPass=true', () => {
    const config = getLessonRenderMode({ lesson_type: 'checkpoint' });
    expect(config.mode).toBe('checkpoint');
    expect(config.requiresPass).toBe(true);
  });

  it('routes final_exam to final_exam mode with requiresPass=true', () => {
    const config = getLessonRenderMode({ lesson_type: 'final_exam' });
    expect(config.mode).toBe('final_exam');
    expect(config.requiresPass).toBe(true);
  });

  it('routes lab to lab mode with requiresEvidence=true', () => {
    const config = getLessonRenderMode({ lesson_type: 'lab' });
    expect(config.mode).toBe('lab');
    expect(config.requiresEvidence).toBe(true);
    expect(config.requiresEvaluator).toBe(true);
  });

  it('routes practicum to practicum mode with tracksPractical=true', () => {
    const config = getLessonRenderMode({ lesson_type: 'practicum' });
    expect(config.mode).toBe('practicum');
    expect(config.tracksPractical).toBe(true);
    expect(config.requiresEvidence).toBe(true);
    expect(config.requiresSignoff).toBe(true);
  });

  it('routes clinical to clinical mode with tracksPractical=true', () => {
    const config = getLessonRenderMode({ lesson_type: 'clinical' });
    expect(config.mode).toBe('clinical');
    expect(config.tracksPractical).toBe(true);
  });

  it('routes capstone to capstone mode with requiresEvidence=true', () => {
    const config = getLessonRenderMode({ lesson_type: 'capstone' });
    expect(config.mode).toBe('capstone');
    expect(config.requiresEvidence).toBe(true);
    expect(config.requiresEvaluator).toBe(true);
  });

  it('routes certification to certification mode', () => {
    const config = getLessonRenderMode({ lesson_type: 'certification' });
    expect(config.mode).toBe('certification');
    expect(config.requiresEvidence).toBe(false);
    expect(config.requiresPass).toBe(false);
  });

  it('normalizes legacy lesson type to reading', () => {
    const config = getLessonRenderMode({ lesson_type: 'lesson' });
    expect(config.mode).toBe('reading');
    expect(config.lessonType).toBe('reading');
  });

  it('normalizes legacy exam type to final_exam', () => {
    const config = getLessonRenderMode({ lesson_type: 'exam' });
    expect(config.mode).toBe('final_exam');
    expect(config.lessonType).toBe('final_exam');
  });

  it('routes HVAC legacy lessons to legacy_hvac mode', () => {
    const config = getLessonRenderMode({
      lesson_type: 'reading',
      lesson_source: 'training',
    });
    expect(config.mode).toBe('legacy_hvac');
  });

  it('DB requires_evidence flag overrides default', () => {
    const config = getLessonRenderMode({
      lesson_type: 'reading',
      requires_evidence: true,
    });
    expect(config.requiresEvidence).toBe(true);
  });

  it('video completion threshold comes from content.video config', () => {
    const config = getLessonRenderMode({
      lesson_type: 'video',
      content_structured: {
        version: 1,
        video: { completionThresholdPercent: 75, runtimeSeconds: 300, transcript: 'test' },
      },
    });
    expect(config.videoCompletionThreshold).toBe(75);
  });

  it('defaults video completion threshold to 90 when not set', () => {
    const config = getLessonRenderMode({ lesson_type: 'video' });
    expect(config.videoCompletionThreshold).toBe(90);
  });
});
