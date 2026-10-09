import { describe, expect, it } from 'vitest';
import { consolidateSourceSections, sourceTeaching } from '@/lib/ultimate-course-builder/instructional/source-teaching';
import { repeatedTeachingSegments } from '@/lib/video/instructional-quality-gate';
describe('authored source consolidation', () => {
  it('speaks shared paragraphs once while retaining each distinct lesson objective', () => {
    const shared = 'Explain each required element before performing the procedure.';
    const first = 'Compare booth rental and commission business models.';
    const second = 'Apply professional and ethical standards in the barbershop.';
    const teaching = sourceTeaching([
      {id:'first', text:'Authorized content: Overview '+shared+' '+first},
      {id:'second', text:'Authorized content: Overview '+shared+' '+second},
    ], 'Supervise service workers');
    expect(teaching.stageText.concept_explanation).toBe(shared+' '+first+' '+second);
    expect(repeatedTeachingSegments(teaching.stageText.concept_explanation)).toBe(0);
  });
  it('retains different technical instructions and requires substantive source content', () => {
    expect(consolidateSourceSections([
      'Do not connect equipment before isolation.',
      'Do not disconnect equipment before isolation.',
    ])).toBe('Do not connect equipment before isolation. Do not disconnect equipment before isolation.');
    expect(() => sourceTeaching([], 'Empty')).toThrow('ULTIMATE_SUBSTANTIVE_AUTHORED_TEACHING_REQUIRED');
  });
});
