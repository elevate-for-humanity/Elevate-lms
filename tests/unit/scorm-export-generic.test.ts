import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('scripts/export-scorm.ts', 'utf8');

describe('generic SCORM exporter', () => {
  it('requires a course id and loads course metadata dynamically', () => {
    expect(source).toContain("option('--course-id')");
    expect(source).toContain(".from('training_courses')");
    expect(source).toContain(".eq('id', courseId)");
    expect(source).toContain('course.title || course.course_name');
  });

  it('contains no legacy HVAC course identity', () => {
    expect(source).not.toContain('f0593164-55be-5867-98e7-8a86770a8dd0');
    expect(source).not.toContain('Elevate-HVAC-EPA608');
    expect(source).not.toContain('HVAC Technician Training — EPA 608 Certification');
  });

  it('supports reusable output and asset locations without shell interpolation', () => {
    expect(source).toContain("option('--output-dir')");
    expect(source).toContain("option('--assets-dir')");
    expect(source).toContain("execFileSync('zip'");
    expect(source).not.toContain('execSync');
  });
});
