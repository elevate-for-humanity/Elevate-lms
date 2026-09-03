import { describe, expect, it } from 'vitest';

import { repairInstructionalScript } from '@/lib/video/instructional-script-repair';

describe('instructional script repair', () => {
  it('repairs an undersized lesson from canonical HTML', () => {
    const result = repairInstructionalScript({
      lessonTitle: 'Client Consultation and Needs Assessment',
      lessonType: 'lesson',
      baseScript: 'Ask the client what service they need.',
      content: {
        html: `<h2>Client consultation</h2><p>${'Assess hair history, service goals, contraindications, maintenance needs, and informed consent before selecting a safe service plan. '.repeat(24)}</p>`,
      },
      contentJson: {},
    });

    expect(result.repaired).toBe(true);
    expect(result.wordCount).toBeGreaterThanOrEqual(180);
    expect(result.script).not.toContain('<h2>');
    expect(result.script).toContain('Client Consultation and Needs Assessment');
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
