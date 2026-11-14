import { describe, expect, it } from 'vitest';
import { consolidateSourceSections, sourceTeaching } from '@/lib/ultimate-course-builder/instructional/source-teaching';
import { repeatedTeachingSegments } from '@/lib/video/instructional-quality-gate';
import { UltimatePlatformInstructionalGenerator } from '@/lib/ultimate-course-builder/adapters/platform-instructional-generator';
import { UltimateAppendixAStandardsSource } from '@/lib/ultimate-course-builder/credential/appendix-a-source';
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
  it('retains authored study cards and concrete practice with source-specific feedback', () => {
    const teaching = sourceTeaching([{id:'source-a',text:'Authorized course content: '+JSON.stringify({
      html:'<p>Measure the system temperature before recording the result.</p>',
      experience:{glossary:[{term:'Superheat',definition:'Vapor temperature above its saturation temperature.'}],
        flashcards:[{front:'Superheat',back:'Vapor temperature above its saturation temperature.'}],
        exercises:[{title:'Record readings',instructions:['Measure the vapor line temperature.','Record the reading with units.'],expectedArtifact:'A temperature reading with units.'}]},
    })}], 'Record operating temperatures');
    expect(teaching.flashcards).toEqual([{front:'Superheat',back:'Vapor temperature above its saturation temperature.'}]);
    expect(teaching.practice).toContain('Measure the vapor line temperature.');
    expect(teaching.practiceFeedback).toContain('A temperature reading with units.');
  });
  it('delivers sourced practice and study cards through the generated instructor artifact', async () => {
    const profile = await new UltimateAppendixAStandardsSource().load({programSlug:'barber-apprenticeship'});
    const competency = profile.competencies[0];
    const source = {id:competency.id,text:'Authorized course content: '+JSON.stringify({
      html:'<p>Verify equipment condition before recording the inspection.</p>',
      experience:{glossary:[{term:'Inspection',definition:'A check of equipment condition.'}],
        knowledgeChecks:[{question:'What should the inspection record include?',options:['Observed condition','Only the date','Only the tool name'],correct:0,explanation:'Record the observed equipment condition.'}],
        exercises:[{title:'Record an inspection',instructions:['Inspect the equipment and record the condition.'],expectedArtifact:'An equipment inspection record.'}]},
    })};
    const artifact = await new UltimatePlatformInstructionalGenerator().instructorScript({
      profile:{...profile,instructionalSources:[source]},competency,
    });
    expect(artifact.activities.find(a=>a.type==='guided_practice')?.prompt).toContain('Inspect the equipment and record the condition.');
    expect(artifact.activities.find(a=>a.type==='independent_practice')?.feedback).toBe('An equipment inspection record.');
    expect(artifact.flashcards).toEqual([{front:'Inspection',back:'A check of equipment condition.'}]);
    expect(artifact.activities.find(a=>a.type==='knowledge_check')).toMatchObject({
      prompt:'What should the inspection record include?', feedback:'Record the observed equipment condition.',
    });
  });
});
