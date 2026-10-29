import type { WorkbookAnswers } from './workbook-validation';
import type { WorkbookSection } from './digital-workbooks';

export type WorkbookSlide = {
  title: string;
  text: string;
  narration: string;
  field?: keyof WorkbookAnswers;
  review?: boolean;
};

/** Use the assigned workbook's actual prompts, never invented lesson content. */
export function workbookSlides(section: WorkbookSection): WorkbookSlide[] {
  return [
    {
      title: 'Study and notice',
      text: `Study ${section.title}. Record key ideas, words to define, and questions for your instructor.`,
      narration: `Welcome. I'm PARIS, your workbook guide. This section is ${section.title}. ${section.unit}. Record key ideas, words to define, and questions for your instructor. Pause here to write. Your answers save to your account. Choose Next when you are ready.`,
      field: 'notes',
    },
    ...section.prompts.slice(0, 3).map(
      (prompt, index): WorkbookSlide => ({
        title: `Practice ${index + 1}`,
        text: prompt,
        narration: `Practice ${index + 1}. ${prompt} Take your time and write your response below. For hands-on work, follow your trainer's supervision and site procedures. Choose Next when you are ready.`,
        field: `practice${index + 1}` as keyof WorkbookAnswers,
      }),
    ),
    {
      title: 'Feedback and next goal',
      text: 'Record your trainer’s feedback. What improved, and what will you practice next?',
      narration:
        'Now reflect on your practice. Record your trainer’s feedback. What improved, and what will you practice next? Write a specific goal you can discuss with your trainer.',
      field: 'nextGoal',
    },
    {
      title: 'Review your work',
      text: `Review your responses for ${section.title}. Return to any activity you want to improve, then save your work.`,
      narration: `Let's review ${section.title}. Check your notes and each practice response. Confirm that your next goal is clear. You can go back to improve an answer. Mark your study checklist when you have reviewed your work, and wait for Saved to your account. This checklist does not replace instructor approval or award training hours.`,
      review: true,
    },
  ];
}

/** Narrate every word, including long prompts, within the voice API's request limit. */
export function narrationChunks(text: string, limit = 1800): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const word of words) {
    // A malformed imported word must not cause truncation or an oversized request.
    for (let start = 0; start < word.length; start += limit) {
      const part = word.slice(start, start + limit);
      if (current && current.length + part.length + 1 > limit) {
        chunks.push(current);
        current = '';
      }
      current += `${current ? ' ' : ''}${part}`;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
