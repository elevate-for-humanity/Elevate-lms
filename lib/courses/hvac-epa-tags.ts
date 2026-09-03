/**
 * EPA 608 section tags per lesson.
 *
 * Maps lesson definition ID → array of EPA 608 section labels that the
 * lesson covers. Used by the lesson page to surface which exam sections
 * a lesson prepares the student for.
 *
 * Sections: 'Core' | 'Type I' | 'Type II' | 'Type III' | 'Universal'
 */

export type Epa608Section = 'Core' | 'Type I' | 'Type II' | 'Type III' | 'Universal';

export const EPA_608_LESSON_TAGS: Record<string, Epa608Section[]> = {
  // Module 1 — Orientation (no EPA content)
  'hvac-01-01': [],
  'hvac-01-02': [],
  'hvac-01-03': [],
  'hvac-01-04': [],

  // Module 2 — HVAC Fundamentals & Safety
  'hvac-02-01': ['Core'],
  'hvac-02-02': ['Core'],
  'hvac-02-03': ['Core'],
  'hvac-02-04': ['Core'],
  'hvac-02-05': ['Core'],

  // Module 3 — Electrical Fundamentals
  'hvac-03-01': ['Core'],
  'hvac-03-02': ['Core'],
  'hvac-03-03': ['Core'],
  'hvac-03-04': ['Core'],
  'hvac-03-05': ['Core'],

  // Module 4 — Heating Systems
  'hvac-04-01': ['Core'],
  'hvac-04-02': ['Core'],
  'hvac-04-03': ['Core'],
  'hvac-04-04': ['Core'],
  'hvac-04-05': ['Core'],

  // Module 5 — Cooling Systems
  'hvac-05-01': ['Core', 'Type II'],
  'hvac-05-02': ['Core', 'Type II'],
  'hvac-05-03': ['Core', 'Type II'],
  'hvac-05-04': ['Core', 'Type II'],
  'hvac-05-05': ['Core', 'Type II'],

  // Module 6 — Refrigeration Fundamentals
  'hvac-06-01': ['Core', 'Type I', 'Type II'],
  'hvac-06-02': ['Core', 'Type I', 'Type II'],
  'hvac-06-03': ['Core', 'Type I', 'Type II'],
  'hvac-06-04': ['Core', 'Type I', 'Type II'],
  'hvac-06-05': ['Core', 'Type I', 'Type II'],

  // Module 7 — EPA 608 Core
  'hvac-07-01': ['Core'],
  'hvac-07-02': ['Core'],
  'hvac-07-03': ['Core'],
  'hvac-07-04': ['Core'],
  'hvac-07-05': ['Core'],

  // Module 8 — EPA 608 Type I (Small Appliances)
  'hvac-08-01': ['Type I'],
  'hvac-08-02': ['Type I'],
  'hvac-08-03': ['Type I'],
  'hvac-08-04': ['Type I'],
  'hvac-08-05': ['Type I'],

  // Module 9 — EPA 608 Type II (High-Pressure)
  'hvac-09-01': ['Type II'],
  'hvac-09-02': ['Type II'],
  'hvac-09-03': ['Type II'],
  'hvac-09-04': ['Type II'],
  'hvac-09-05': ['Type II'],

  // Module 10 — EPA 608 Type III (Low-Pressure)
  'hvac-10-01': ['Type III'],
  'hvac-10-02': ['Type III'],
  'hvac-10-03': ['Type III'],
  'hvac-10-04': ['Type III'],
  'hvac-10-05': ['Type III'],

  // Module 11 — Installation & Commissioning
  'hvac-11-01': ['Universal'],
  'hvac-11-02': ['Universal'],
  'hvac-11-03': ['Universal'],
  'hvac-11-04': ['Universal'],
  'hvac-11-05': ['Universal'],

  // Module 12 — Troubleshooting & Diagnostics
  'hvac-12-01': ['Universal'],
  'hvac-12-02': ['Universal'],
  'hvac-12-03': ['Universal'],
  'hvac-12-04': ['Universal'],
  'hvac-12-05': ['Universal'],

  // Module 13 — Advanced Systems
  'hvac-13-01': ['Universal'],
  'hvac-13-02': ['Universal'],
  'hvac-13-03': ['Universal'],
  'hvac-13-04': ['Universal'],
  'hvac-13-05': ['Universal'],

  // Module 14 — OSHA & Safety
  'hvac-14-01': [],
  'hvac-14-02': [],
  'hvac-14-03': [],
  'hvac-14-04': [],
  'hvac-14-05': [],

  // Module 15 — Business & Career
  'hvac-15-01': [],
  'hvac-15-02': [],
  'hvac-15-03': [],
  'hvac-15-04': [],
  'hvac-15-05': [],

  // Module 16 — Final Exam Prep
  'hvac-16-01': ['Universal'],
  'hvac-16-02': ['Universal'],
  'hvac-16-03': ['Universal'],
  'hvac-16-04': ['Universal'],
  'hvac-16-05': ['Universal'],
};
