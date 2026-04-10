import type { CourseSeed } from '../types';
import { module1 } from './module-1.seed';
import { module2 } from './module-2.seed';
import { module3 } from './module-3.seed';
import { module4 } from './module-4.seed';
import { module5 } from './module-5.seed';
import { module6 } from './module-6.seed';
import { module7 } from './module-7.seed';
import { module8 } from './module-8.seed';

export const barberCourseSeed: CourseSeed = {
  courseSlug: 'barber-apprenticeship',
  courseTitle: 'Indiana Registered Barber License — Apprenticeship Program',
  modules: [
    module1,
    module2,
    module3,
    module4,
    module5,
    module6,
    module7,
    module8,
  ],
};

// Final exam — program-level, not module-scoped
export const barberFinalExam = {
  slug: 'barber-indiana-state-board-exam',
  title: 'Program Final Exam',
  lessonOrder: 5,
  durationMin: 30,
  objective: 'Demonstrate comprehensive mastery of the barber apprenticeship curriculum.',
  passingScore: 70,
  quiz: {
    passingScore: 70,
    questions: [
      {
        prompt: 'What is the passing score for the Indiana barber written exam?',
        choices: ['60%', '70%', '75%', '80%'],
        answerIndex: 2,
        rationale: 'Indiana requires a 75% passing score on the written state board exam.',
      },
      {
        prompt: 'How many OJT hours are required for the apprenticeship path in Indiana?',
        choices: ['1,000', '1,500', '2,000', '2,500'],
        answerIndex: 2,
        rationale: 'The DOL-registered apprenticeship path requires 2,000 on-the-job training hours.',
      },
      {
        prompt: 'Which layer of the hair contains melanin?',
        choices: ['Cuticle', 'Cortex', 'Medulla', 'Follicle'],
        answerIndex: 1,
        rationale: 'The cortex contains melanin granules that determine hair color.',
      },
      {
        prompt: 'What is required between every client in Indiana?',
        choices: ['Sterilization', 'Sanitation', 'Disinfection', 'Rinsing'],
        answerIndex: 2,
        rationale: 'EPA-registered disinfection of all tools is required between every client.',
      },
      {
        prompt: 'The neckline should be set:',
        choices: ['At the jawline', 'At the Adam\'s apple', 'Two finger-widths above the Adam\'s apple', 'At the occipital bone'],
        answerIndex: 2,
        rationale: 'Two finger-widths above the Adam\'s apple is the standard neckline position.',
      },
      {
        prompt: 'A client has tinea capitis. You should:',
        choices: ['Proceed with gloves', 'Perform a dry cut only', 'Decline service and refer to a physician', 'Use medicated shampoo first'],
        answerIndex: 2,
        rationale: 'Tinea capitis is contagious — no services should be performed.',
      },
      {
        prompt: 'The first pass in a straight razor shave goes:',
        choices: ['Against the grain', 'Across the grain', 'With the grain', 'In circles'],
        answerIndex: 2,
        rationale: 'Always start with the grain to safely remove bulk before closer passes.',
      },
      {
        prompt: 'Indiana barber licenses must be renewed every:',
        choices: ['1 year', '2 years', '3 years', '5 years'],
        answerIndex: 1,
        rationale: 'Indiana requires barber license renewal every two years.',
      },
    ],
  },
};
