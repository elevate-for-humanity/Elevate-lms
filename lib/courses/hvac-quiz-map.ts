// Maps HVAC quiz-type lesson IDs to their quiz question banks.
// Used by the API fallback and lesson player to serve quiz content
// when the Supabase migration hasn't been run.
//
// Real EPA 608 exam format: 25 Core + 25 Type-specific = 50 questions per section.
// Time limit: ~60 min per 50-question section (not federally mandated, but standard practice).
// Passing score: 70% on each section.

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
  EPA_608_EXAM_TYPE_I,
  EPA_608_EXAM_TYPE_II,
  EPA_608_EXAM_TYPE_III,
  HVAC_MOCK_EXAM,
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

  // Module 6: EPA 608 Core — 25 Core questions, 30 min
  'hvac-06-08': { questions: EPA_608_CORE.slice(0, 25), passingScore: 70, timeLimit: 30 },

  // Module 7: EPA 608 Type I — real exam format: 25 Core + 25 Type I = 50q, 60 min
  'hvac-07-05': { questions: EPA_608_EXAM_TYPE_I, passingScore: 70, timeLimit: 60 },

  // Module 8: EPA 608 Type II — real exam format: 25 Core + 25 Type II = 50q, 60 min
  'hvac-08-07': { questions: EPA_608_EXAM_TYPE_II, passingScore: 70, timeLimit: 60 },

  // Module 9: EPA 608 Type III — real exam format: 25 Core + 25 Type III = 50q, 60 min
  'hvac-09-06': { questions: EPA_608_EXAM_TYPE_III, passingScore: 70, timeLimit: 60 },

  // Module 10: Final exam prep — 72% passing threshold (above real exam to build margin)
  // Uses questions 26–50 from each bank — different from module quizzes
  'hvac-10-03': { questions: EPA_608_CORE.slice(25, 50), passingScore: 72, timeLimit: 30 },
  'hvac-10-04': { questions: [...EPA_608_CORE.slice(25, 50), ...EPA_608_TYPE_I.slice(25, 50)], passingScore: 72, timeLimit: 60 },
  'hvac-10-05': { questions: [...EPA_608_CORE.slice(25, 50), ...EPA_608_TYPE_II.slice(25, 50)], passingScore: 72, timeLimit: 60 },
  'hvac-10-06': { questions: [...EPA_608_CORE.slice(25, 50), ...EPA_608_TYPE_III.slice(25, 50)], passingScore: 72, timeLimit: 60 },
  // Universal mock — 100 questions, 120 min, matches real EPA 608 Universal format
  'hvac-10-07': { questions: HVAC_MOCK_EXAM, passingScore: 70, timeLimit: 120 },

  // Module 11: Refrigeration Diagnostics
  'hvac-11-05': { questions: REFRIGERATION_DIAGNOSTICS_QUIZ, passingScore: 70 },

  // Module 12: Installation
  'hvac-12-06': { questions: INSTALLATION_QUIZ, passingScore: 70 },

  // Module 13: Troubleshooting
  'hvac-13-06': { questions: TROUBLESHOOTING_QUIZ, passingScore: 70 },

  // Module 14: OSHA 30
  'hvac-14-08': { questions: OSHA_30_QUIZ, passingScore: 70, timeLimit: 20 },

  // Module 15: Rise Up
  'hvac-15-05': { questions: ORIENTATION_QUIZ, passingScore: 70 },
};
