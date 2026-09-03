import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('scripts/export-scorm.ts', 'utf8');

describe('SCORM export runtime contract', () => {
  it('keeps SCORM 1.2 and 2004 status and session-time models separate', () => {
    expect(source).toContain('cmi.core.lesson_status');
    expect(source).toContain('cmi.completion_status');
    expect(source).toContain('cmi.success_status');
    expect(source).toContain('cmi.core.session_time');
    expect(source).toContain('cmi.session_time');
    expect(source).toContain('"PT" + totalSeconds + "S"');
  });

  it('records assessment interactions with numeric indexes', () => {
    expect(source).toContain('"cmi.interactions." + index');
    expect(source).toContain('.learner_response');
    expect(source).toContain('.student_response');
    expect(source).toContain('scormRecordInteraction(currentQ');
  });

  it('escapes database and generated content before HTML or inline-script insertion', () => {
    expect(source).toContain('escapeHtml(lesson.title)');
    expect(source).toContain('escapeHtml(lesson.video_url)');
    expect(source).toContain('serializeForInlineScript(captions)');
    expect(source).toContain('serializeForInlineScript(quiz)');
    expect(source).toContain('escapeMarkup(q.question)');
    expect(source).toContain('escapeMarkup(q.explanation');
  });

  it('declares the shared runtime as a file of every SCO resource', () => {
    expect(source.match(/<file href="shared\/scorm-api\.js"\/>/g)).toHaveLength(3);
  });
});
