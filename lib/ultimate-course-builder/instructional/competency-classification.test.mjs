import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyCompetency } from './competency-classification.mjs';
test('course-defined practical cosmetology lessons retain demonstration requirements', () => {
  for (const title of ['Haircutting Techniques', 'Shampooing and Conditioning', 'Manicure Services', 'Sanitation and Disinfection Procedures', 'Chemical Texture Services (Perms & Relaxers)']) {
    const result = classifyCompetency(title);
    assert.equal(result.type, 'practical_skill', title);
    assert.equal(result.requiresDemonstration, true, title);
    assert.equal(result.requiresPracticalEvidence, true, title);
  }
});
test('knowledge checkpoints do not create artificial practical requirements', () => {
  for (const title of ['Hair Coloring — Checkpoint', 'Color Theory Fundamentals', 'Indiana Cosmetology License Requirements', 'Nail Anatomy and Disorders'])
    assert.equal(classifyCompetency(title).requiresPracticalEvidence, false, title);
  assert.equal(classifyCompetency('Client Consultation and Needs Assessment').type, 'decision');
  assert.equal(classifyCompetency('Professional Ethics', 'Demonstrate safe haircutting').type, 'knowledge');
});
