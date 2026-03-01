// Maps HVAC quiz-type lesson IDs to their quiz question banks.
// Used by the API fallback and lesson player to serve quiz content
// when the Supabase migration hasn't been run.

import {
  ORIENTATION_QUIZ,
  HVAC_FUNDAMENTALS_QUIZ,
  ELECTRICAL_BASICS_QUIZ,
  HEATING_SYSTEMS_QUIZ,
  COOLING_SYSTEMS_QUIZ,
  EPA_608_CORE,
  EPA_608_TYPE_I,
  EPA_608_TYPE_II,
  EPA_608_TYPE_III,
  REFRIGERATION_DIAGNOSTICS_QUIZ,
  INSTALLATION_QUIZ,
  TROUBLESHOOTING_QUIZ,
  OSHA_30_QUIZ,
  type QuizQuestion,
} from './hvac-quizzes';

export interface QuizConfig {
  questions: QuizQuestion[];
  passingScore: number; // percentage (0-100)
  timeLimit?: number;   // minutes, optional
}

// Lesson definition ID → quiz config
export const HVAC_QUIZ_MAP: Record<string, QuizConfig> = {
  // Module 1: Orientation
  'hvac-01-04': { questions: ORIENTATION_QUIZ, passingScore: 70 },

  // Module 2: Fundamentals
  'hvac-02-05': { questions: HVAC_FUNDAMENTALS_QUIZ, passingScore: 70 },

  // Module 3: Electrical
  'hvac-03-05': { questions: ELECTRICAL_BASICS_QUIZ, passingScore: 70 },

  // Module 4: Heating
  'hvac-04-06': { questions: HEATING_SYSTEMS_QUIZ, passingScore: 70 },

  // Module 5: Cooling
  'hvac-05-06': { questions: COOLING_SYSTEMS_QUIZ, passingScore: 70 },

  // Module 6: EPA 608 Core section quiz
  'hvac-06-08': { questions: EPA_608_CORE, passingScore: 70, timeLimit: 30 },

  // Module 7: EPA 608 Type I
  'hvac-07-05': { questions: EPA_608_TYPE_I, passingScore: 70, timeLimit: 30 },

  // Module 8: EPA 608 Type II
  'hvac-08-07': { questions: EPA_608_TYPE_II, passingScore: 70, timeLimit: 30 },

  // Module 9: EPA 608 Type III
  'hvac-09-06': { questions: EPA_608_TYPE_III, passingScore: 70, timeLimit: 30 },

  // Module 10: Final exam prep — full-length practice exams
  'hvac-10-03': { questions: EPA_608_CORE, passingScore: 72, timeLimit: 30 },
  'hvac-10-04': { questions: EPA_608_TYPE_I, passingScore: 72, timeLimit: 30 },
  'hvac-10-05': { questions: EPA_608_TYPE_II, passingScore: 72, timeLimit: 30 },
  'hvac-10-06': { questions: EPA_608_TYPE_III, passingScore: 72, timeLimit: 30 },
  // Universal combines all four sections
  'hvac-10-07': {
    questions: [...EPA_608_CORE, ...EPA_608_TYPE_I, ...EPA_608_TYPE_II, ...EPA_608_TYPE_III],
    passingScore: 70,
    timeLimit: 120,
  },

  // Module 11: Refrigeration Diagnostics
  'hvac-11-05': { questions: REFRIGERATION_DIAGNOSTICS_QUIZ, passingScore: 70 },

  // Module 12: Installation
  'hvac-12-06': { questions: INSTALLATION_QUIZ, passingScore: 70 },

  // Module 13: Troubleshooting
  'hvac-13-06': { questions: TROUBLESHOOTING_QUIZ, passingScore: 70 },

  // Module 14: OSHA 30
  'hvac-14-08': { questions: OSHA_30_QUIZ, passingScore: 70, timeLimit: 20 },

  // Module 15: Rise Up — no dedicated quiz bank yet, reuse orientation as placeholder
  'hvac-15-05': { questions: ORIENTATION_QUIZ, passingScore: 70 },
};
