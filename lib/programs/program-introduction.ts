import type { ProgramSchema } from './program-schema';

/** Shared by the recording script and the page; changed copy never reuses stale audio. */
export function buildProgramIntroduction(program: ProgramSchema): string {
  const skills = program.curriculum
    .slice(0, 3)
    .map((module) => module.title)
    .join(', ');
  return `Explore ${program.title} with Elevate for Humanity. ${skills ? `Preview training in ${skills}. ` : ''}Review the current program details, required training, credentials, tuition, and enrollment steps on this page. ${program.programType === 'apprenticeship' ? 'Apprenticeship training combines related instruction with supervised workplace learning. Confirm your approved Host Site, schedule, and self-pay tuition before training begins.' : 'Ask admissions about the schedule, payment options, and any program-specific funding requirements before enrollment.'} Start with an application and let our team help you plan your next step.`;
}
