import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

describe('automated course approval architecture', () => {
  it('records versioned machine-verifiable evidence before publishing', () => {
    const service = read('lib/course-builder/persisted-publish-service.ts');
    expect(service).toContain("AUTOMATED_COURSE_GATE_VERSION = 'course-quality-v1'");
    expect(service).toContain("'record_course_automated_approval'");
    expect(service).toContain("review_mode: 'automated_quality_gate'");
  });

  it('automatically publishes a complete course instead of waiting for review', () => {
    const service = read('lib/course-builder/persisted-publish-service.ts');
    expect(service).toContain("state: 'published'");
    expect(service).toContain("state: 'quality_gate_failed'");
    expect(service).not.toContain("state: 'awaiting_human_review'");
  });

  it('does not treat AI authorship as a publication blocker', () => {
    const gate = read('lib/course-factory/procurement-gate.ts');
    expect(gate).not.toContain('AI_REVIEW_REQUIRED');
    expect(gate).not.toContain('AI-generated lessons require human approval');
  });

  it('keeps human sign-off for learner practical competency evidence', () => {
    const service = read('lib/course-builder/persisted-publish-service.ts');
    expect(service).toContain('authorized human sign-off missing for practical competency');
  });
});
