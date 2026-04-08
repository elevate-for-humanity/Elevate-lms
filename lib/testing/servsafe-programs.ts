/**
 * ServSafe and AHLEI hospitality certification program catalog.
 *
 * Strategy:
 *   Entry funnel:  Food Handler ($29) — volume, low friction
 *   Required cert: Manager ($199)     — upsell from Food Handler
 *   Workforce:     START / GSG ($89)  — hospitality workforce programs
 *   Pathway:       ServSuccess ($129+$79) — career advancement
 *
 * Lead with Food Handler. Upsell Manager. Keep separate from healthcare/HVAC.
 */

import type { ServsafeProgram } from '@/types/servsafe';

export const SERVSAFE_PROGRAMS: ServsafeProgram[] = [

  // ── ServSafe (NRA) ──────────────────────────────────────────────────────────

  {
    key:              'food_handler',
    label:            'ServSafe Food Handler',
    category:         'servsafe',
    shortDescription: 'Basic food safety training required for all food service workers. Fast, online, and nationally recognized.',
    featured:         true,
    products: [
      {
        key:         'bundle',
        label:       'Online Course + Certificate',
        vendorBase:  13.50,
        type:        'course_exam_bundle',
        // formula: $29 ✅ — no override needed
        description: 'Online course with certificate upon completion.',
      },
    ],
  },

  {
    key:              'servsafe_manager',
    label:            'ServSafe Manager',
    category:         'servsafe',
    shortDescription: 'Required certification for food service managers and supervisors. Covers HACCP, food safety law, and manager responsibilities.',
    featured:         true,
    products: [
      {
        key:            'bundle',
        label:          'Course + Proctored Exam',
        vendorBase:     137.66,
        type:           'course_exam_bundle',
        retailOverride: 199, // formula produces $209 — target is $199
        description:    'Full course with proctored certification exam.',
      },
    ],
  },

  // ── AHLEI (American Hotel & Lodging Educational Institute) ──────────────────

  {
    key:              'guest_service_gold',
    label:            'Guest Service Gold',
    category:         'ahlei',
    shortDescription: 'Customer service excellence certification for hospitality and tourism workers.',
    featured:         false,
    products: [
      {
        key:         'bundle_online',
        label:       'Online Course + Exam',
        vendorBase:  54,
        type:        'course_exam_bundle',
        // formula: $89 ✅
        description: 'Online course with certification exam.',
      },
      {
        key:         'bundle_workbook',
        label:       'Workbook + Exam',
        vendorBase:  54,
        type:        'course_exam_bundle',
        description: 'Printed workbook with certification exam.',
      },
      {
        key:         'retake',
        label:       'Exam Retake',
        vendorBase:  44,
        type:        'retake',
        // formula: $79 ✅
        description: 'Retake fee for failed exam attempt.',
      },
      {
        key:         'instructor_kit',
        label:       'Instructor Kit',
        vendorBase:  197.96,
        type:        'instructor_material',
        // formula: $299 ✅
        description: 'Full instructor materials for classroom delivery.',
      },
    ],
  },

  {
    key:              'start_program',
    label:            'START Hospitality Training',
    category:         'ahlei',
    shortDescription: 'Entry-level hospitality workforce training covering front desk, housekeeping, food & beverage, and more.',
    featured:         false,
    products: [
      {
        key:         'bundle_online',
        label:       'Online Course + Exam',
        vendorBase:  54,
        type:        'course_exam_bundle',
        // formula: $89 ✅
        description: 'Online course with certification exam.',
      },
      {
        key:         'bundle_workbook',
        label:       'Workbook + Exam',
        vendorBase:  54,
        type:        'course_exam_bundle',
        description: 'Printed workbook with certification exam.',
      },
      {
        key:         'retake',
        label:       'Exam Retake',
        vendorBase:  44,
        type:        'retake',
        description: 'Retake fee for failed exam attempt.',
      },
      {
        key:            'instructor_guide',
        label:          'Instructor Guide',
        vendorBase:     134.96,
        type:           'instructor_material',
        retailOverride: 199, // formula produces $209 — target is $199
        description:    'Instructor guide for classroom delivery.',
      },
    ],
  },

  {
    key:              'servsuccess',
    label:            'ServSuccess Restaurant Professional',
    category:         'ahlei',
    shortDescription: 'Career advancement certification for restaurant professionals. Five-course learning suite plus certification exam.',
    featured:         false,
    products: [
      {
        key:         'learning_suite',
        label:       'Learning Suite (5 courses)',
        vendorBase:  81,
        type:        'learning_suite',
        // formula: $129 ✅
        description: 'Five self-paced online courses covering restaurant operations.',
      },
      {
        key:         'exam',
        label:       'Certification Exam',
        vendorBase:  45,
        type:        'exam_only',
        // formula: $79 ✅
        description: 'Proctored certification exam.',
      },
    ],
  },

];

/** Featured programs — shown first on public pages */
export const SERVSAFE_FEATURED = SERVSAFE_PROGRAMS.filter(p => p.featured);

/** All programs by key for lookup */
export const SERVSAFE_BY_KEY = Object.fromEntries(
  SERVSAFE_PROGRAMS.map(p => [p.key, p])
);
