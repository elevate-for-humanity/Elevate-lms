export type WageMilestone = {
  completedCompetencies: number;
  hourlyRate: number;
};

export type AppendixAStandard = {
  occupationTitle: string;
  programSlugs: readonly string[];
  onetSocCode: string;
  rapidsCode: string;
  approach: 'competency-based';
  competencyCount: number;
  relatedInstructionHours: number;
  apprenticeToMentorRatio: '1:1';
  probationaryHours: number;
  mentorHourlyRate: number;
  startingHourlyRate: number;
  wageMilestones: readonly WageMilestone[];
};

/**
 * U.S. Department of Labor Office of Apprenticeship — approved Local
 * Apprenticeship Standards for 2 Exclusive LLC-S.
 *
 * Registration: 2025-IN-132301
 * Registration date: January 14, 2025
 * Revision date: July 10, 2025
 * Revision occupations: 0030CB, 2089CB, 2090CB
 *
 * Source of truth: approved Appendix A Work Process Schedules and Related
 * Instruction Outlines. Do not replace these values with generic state-hour
 * rules or marketing copy. These occupations are competency-based.
 */
export const APPENDIX_A_REGISTRATION = {
  sponsor: '2 Exclusive LLC-S',
  registrationNumber: '2025-IN-132301',
  registrationDate: '2025-01-14',
  revisionDate: '2025-07-10',
} as const;

export const APPENDIX_A_STANDARDS: Record<string, AppendixAStandard> = {
  barber: {
    occupationTitle: 'Barber',
    programSlugs: ['barber-apprenticeship'],
    onetSocCode: '39-5011.00',
    rapidsCode: '0030CB',
    approach: 'competency-based',
    competencyCount: 14,
    relatedInstructionHours: 260,
    apprenticeToMentorRatio: '1:1',
    probationaryHours: 500,
    mentorHourlyRate: 10,
    startingHourlyRate: 8,
    wageMilestones: [
      { completedCompetencies: 7, hourlyRate: 9 },
      { completedCompetencies: 14, hourlyRate: 9.5 },
    ],
  },
  esthetician: {
    occupationTitle: 'Esthetician',
    programSlugs: ['esthetician-apprenticeship', 'esthetics-apprenticeship'],
    onetSocCode: '39-5094.00',
    rapidsCode: '2089CB',
    approach: 'competency-based',
    competencyCount: 20,
    relatedInstructionHours: 300,
    apprenticeToMentorRatio: '1:1',
    probationaryHours: 500,
    mentorHourlyRate: 9.25,
    startingHourlyRate: 7.5,
    wageMilestones: [
      { completedCompetencies: 10, hourlyRate: 8.5 },
      { completedCompetencies: 20, hourlyRate: 9.25 },
    ],
  },
  manicurist: {
    occupationTitle: 'Manicurist',
    programSlugs: ['nail-tech-apprenticeship', 'nail-technician-apprenticeship', 'manicurist-apprenticeship'],
    onetSocCode: '39-5092.00',
    rapidsCode: '2090CB',
    approach: 'competency-based',
    competencyCount: 19,
    relatedInstructionHours: 210,
    apprenticeToMentorRatio: '1:1',
    probationaryHours: 500,
    mentorHourlyRate: 15,
    startingHourlyRate: 7.5,
    wageMilestones: [
      { completedCompetencies: 4, hourlyRate: 8 },
      { completedCompetencies: 8, hourlyRate: 8.5 },
      { completedCompetencies: 12, hourlyRate: 9 },
      { completedCompetencies: 16, hourlyRate: 10 },
      { completedCompetencies: 19, hourlyRate: 15 },
    ],
  },
};

export function getAppendixAStandard(programSlug: string | null | undefined): AppendixAStandard | null {
  if (!programSlug) return null;
  return (
    Object.values(APPENDIX_A_STANDARDS).find((standard) =>
      standard.programSlugs.includes(programSlug),
    ) ?? null
  );
}
