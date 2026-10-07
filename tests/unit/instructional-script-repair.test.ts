import { describe, expect, it } from 'vitest';

import { repairInstructionalScript } from '@/lib/video/instructional-script-repair';

describe('instructional script repair', () => {
  it('repairs an undersized lesson from canonical HTML', () => {
    const result = repairInstructionalScript({
      lessonTitle: 'Client Consultation and Needs Assessment',
      lessonType: 'lesson',
      baseScript: 'Ask the client what service they need.',
      content: {
        html: `<h2>Client consultation</h2>${[
          'Begin by asking the client to describe the result they want and the reason for requesting the service.',
          'Listen without interrupting, then summarize the requested outcome in language the client can understand and confirm.',
          'Record the relevant service history and discuss previous results before selecting products or tools for the appointment.',
          'Ask about the current home maintenance routine and identify which parts of that routine the client can sustain.',
          'Observe the condition relevant to the requested service and document facts separately from assumptions or preferences.',
          'Explain the available service options, their practical differences, and the information still needed to make a decision.',
          'Discuss time, maintenance, and cost expectations so the proposed plan addresses the needs described during the conversation.',
          'Check whether the client has additional questions and answer each question before asking them to confirm the service plan.',
          'Document the agreed outcome and communicate any unresolved concern to the supervisor before proceeding with the appointment.',
          'At the end of the consultation, repeat the agreed plan and confirm that the written record accurately reflects the discussion.',
        ].map(sentence => `<p>${sentence}</p>`).join('')}`,
      },
      contentJson: {},
    });

    expect(result.repaired).toBe(true);
    expect(result.wordCount).toBeGreaterThanOrEqual(180);
    expect(result.script).not.toContain('<h2>');
    expect(result.script).toContain('Client Consultation and Needs Assessment');
  });

  it('does not count repeated source sentences as substantive instructional expansion', () => {
    const result = repairInstructionalScript({ lessonTitle: 'Client Consultation', lessonType: 'lesson',
      baseScript: 'Ask the client about their goals.', contentJson: {},
      content: { html: `<p>${'Confirm the client goals before selecting a service plan. '.repeat(30)}</p>` } });
    expect(result.wordCount).toBeLessThan(result.minimumWordCount);
    expect(result.script.match(/Confirm the client goals/g)).toHaveLength(1);
  });

  it('repairs a checkpoint from governed questions and explanations', () => {
    const result = repairInstructionalScript({
      lessonTitle: 'Skin Care — Checkpoint',
      lessonType: 'checkpoint',
      baseScript: 'Review what you learned before continuing.',
      content: { html: '<p>Complete this checkpoint.</p>' },
      contentJson: {
        experience: {
          knowledgeChecks: Array.from({ length: 7 }, (_, index) => ({
            question: `Which safe skin care practice applies in scenario ${index + 1}?`,
            options: ['Sanitize the station and assess the client', 'Skip consultation'],
            correct: 0,
            explanation: 'Sanitation and client assessment reduce cross-contamination and help identify contraindications before service begins.',
          })),
        },
      },
    });

    expect(result.repaired).toBe(true);
    expect(result.wordCount).toBeGreaterThanOrEqual(120);
    expect(result.script).toContain('The correct response is Sanitize the station');
  });

  it('keeps sentence punctuation while expanding undersized narration', () => {
    const result = repairInstructionalScript({
      lessonTitle: 'Scalp Treatments',
      lessonType: 'lesson',
      baseScript: 'Assess the scalp before service.',
      content: {
        html: Array.from(
          { length: 90 },
          (_, index) =>
            `<p>Step ${index + 1} checks scalp condition, sanitation, client comfort, product choice, and observable service evidence.</p>`,
        ).join(''),
      },
      contentJson: {},
    });

    expect(result.repaired).toBe(true);
    expect(result.wordCount).toBeGreaterThanOrEqual(180);
    expect(result.script).toMatch(/[.!?] Now, connect those steps to the lesson objective/);
    expect(result.script).not.toMatch(/\b(?:condition|sanitation|comfort|choice|evidence) Now, connect/);
    expect(result.script).toContain('Assess the scalp before service.');
  });

  it('removes repeated teaching sentences from otherwise complete narration', () => {
    const repeated = 'Sanitize the workstation before preparing the client for service.';
    const baseScript = `${'topic instruction '.repeat(180)}. ${repeated} ${repeated}`;
    const result = repairInstructionalScript({
      lessonTitle: 'Sanitation Procedure',
      lessonType: 'lesson',
      baseScript,
      content: {},
      contentJson: {},
    });

    expect(result.repaired).toBe(true);
    expect(result.script.match(/Sanitize the workstation/g)).toHaveLength(1);
  });

  it('keeps complete sentence boundaries when long narration is bounded', () => {
    const teaching = Array.from(
      { length: 82 },
      (_, index) =>
        `Step ${index + 1} explains a safe service decision using sanitation, client assessment, correct tools, and observable evidence.`,
    ).join(' ');
    const baseScript = `${teaching} Immediately rinse the product completely using cool water and apply soothing aloe vera gel or chamomile. Finish by documenting the client response and reviewing the home-care plan.`;
    const result = repairInstructionalScript({
      lessonTitle: 'Scalp Treatments',
      lessonType: 'lesson',
      baseScript,
      content: {},
      contentJson: {},
    });

    expect(result.repaired).toBe(true);
    expect(result.script).toMatch(/[.!?] Now, connect those steps to the lesson objective/);
    expect(result.script).not.toMatch(/\b(?:gel|chamomile) Now, connect/);
    expect(result.script).toContain('Finish by documenting the client response');
  });

  it('does not rewrite narration that already satisfies the minimum', () => {
    const baseScript = 'topic '.repeat(190);
    const result = repairInstructionalScript({
      lessonTitle: 'Complete Lesson',
      lessonType: 'lesson',
      baseScript,
      content: {},
      contentJson: {},
    });

    expect(result.repaired).toBe(false);
    expect(result.wordCount).toBe(190);
  });
});
