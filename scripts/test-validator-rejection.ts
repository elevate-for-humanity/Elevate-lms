/**
 * Rejection test suite for validateCourseOutline.
 *
 * Feeds intentionally broken payloads directly to the validator.
 * Every invalid payload must be rejected with the correct error.
 * Every valid payload must pass.
 *
 * Run: pnpm tsx scripts/test-validator-rejection.ts
 */

import { validateCourseOutline } from '../lib/ai/course-outline-schema';

// ── Baseline valid payload ────────────────────────────────────────────────────
function validPayload(): Record<string, unknown> {
  const lessons: Record<string, unknown>[] = [];
  let order = 1;
  for (let mod = 1; mod <= 5; mod++) {
    for (let l = 1; l <= 4; l++) {
      lessons.push({
        order_index: order++, module_index: mod,
        slug: `mod${mod}-lesson${l}`,
        title: `Module ${mod} Lesson ${l}`,
        step_type: 'lesson',
        learning_points: [
          'Identify the correct handwashing technique per WHO 5-moment guidelines',
          'Demonstrate proper donning and doffing of PPE in isolation settings',
          'Recognize signs of healthcare-associated infections and report to charge nurse',
        ],
        scenario: 'A patient in room 204 has not eaten breakfast and is showing signs of dehydration. You must assess the situation and report findings to the charge nurse immediately.',
        assessment_question: {
          question: 'What is the first action a CNA should take when a patient refuses to eat their meal?',
          choices: { a: 'Force the patient to eat the meal', b: 'Document the refusal and notify the charge nurse', c: 'Leave the room without documenting', d: 'Call the family immediately' },
          correct: 'b',
          rationale: 'CNAs must document all refusals and notify the charge nurse per Indiana NATCEP scope of practice requirements.',
        },
      });
    }
    if ([2, 3, 4].includes(mod)) {
      lessons.push({
        order_index: order++, module_index: mod,
        slug: `mod${mod}-checkpoint`,
        title: `Module ${mod} Checkpoint`,
        step_type: 'checkpoint',
        learning_points: [], scenario: '',
        assessment_question: { question: '', choices: { a: '', b: '', c: '', d: '' }, correct: 'a', rationale: '' },
      });
    }
  }
  lessons.push({
    order_index: order++, module_index: 5,
    slug: 'cna-final-exam',
    title: 'CNA Foundations Final Exam',
    step_type: 'exam',
    learning_points: [], scenario: '',
    assessment_question: { question: '', choices: { a: '', b: '', c: '', d: '' }, correct: 'a', rationale: '' },
  });

  return {
    course: {
      title: 'CNA Foundations', slug: 'cna-foundations',
      description: 'Indiana NATCEP-aligned CNA training program',
      total_hours: 75, state: 'Indiana', credential: 'CNA',
      pass_threshold_checkpoints: 75, pass_threshold_final_exam: 70,
      exam_eligibility_criteria: [
        'Complete all 75 required training hours (minimum 16 clinical)',
        'Pass all 3 module checkpoints with score ≥75%',
        'Instructor sign-off on clinical skills competency checklist',
      ],
      compliance_status: 'draft_for_human_review',
    },
    modules: [1, 2, 3, 4, 5].map(i => ({
      module_index: i, slug: `module-${i}`,
      title: `Module ${i}`, description: `Module ${i} description`,
    })),
    lessons,
    checkpoints: [
      { after_module_index: 2, slug: 'cp-mod2', title: 'Module 2 Checkpoint', pass_threshold: 75, competencies_tested: ['patient care', 'ADLs'] },
      { after_module_index: 3, slug: 'cp-mod3', title: 'Module 3 Checkpoint', pass_threshold: 75, competencies_tested: ['infection control', 'PPE'] },
      { after_module_index: 4, slug: 'cp-mod4', title: 'Module 4 Checkpoint', pass_threshold: 75, competencies_tested: ['safety', 'emergency procedures'] },
    ],
    exams: [{
      slug: 'cna-final-exam-blueprint', title: 'CNA Foundations Final Exam',
      question_count: 70, pass_threshold: 70,
      domain_blueprint: [
        { domain: 'patient_care', question_count: 20, competencies: ['ADLs', 'nutrition', 'elimination'] },
        { domain: 'safety', question_count: 20, competencies: ['fall prevention', 'restraints', 'emergency response'] },
        { domain: 'infection_control', question_count: 15, competencies: ['handwashing', 'PPE', 'isolation'] },
        { domain: 'communication', question_count: 15, competencies: ['reporting', 'documentation', 'HIPAA'] },
      ],
    }],
  };
}

// ── Test cases ────────────────────────────────────────────────────────────────
interface TestCase {
  name: string;
  payload: unknown;
  expectValid: boolean;
  expectError?: string; // substring that must appear in errors when expectValid=false
}

const CASES: TestCase[] = [
  // ── Valid baseline ──────────────────────────────────────────────────────────
  { name: 'Valid baseline', payload: validPayload(), expectValid: true },

  // ── Missing top-level keys ──────────────────────────────────────────────────
  { name: 'Missing "lessons" key', payload: (() => { const p = validPayload(); delete (p as any).lessons; return p; })(), expectValid: false, expectError: 'lessons' },
  { name: 'Missing "checkpoints" key', payload: (() => { const p = validPayload(); delete (p as any).checkpoints; return p; })(), expectValid: false, expectError: 'checkpoints' },
  { name: 'Missing "exams" key', payload: (() => { const p = validPayload(); delete (p as any).exams; return p; })(), expectValid: false, expectError: 'exams' },
  { name: 'Missing "modules" key', payload: (() => { const p = validPayload(); delete (p as any).modules; return p; })(), expectValid: false, expectError: 'modules' },
  { name: 'Null payload', payload: null, expectValid: false, expectError: 'not an object' },
  { name: 'Array payload', payload: [], expectValid: false, expectError: 'not an object' },

  // ── Module count ────────────────────────────────────────────────────────────
  { name: 'Only 3 modules', payload: (() => { const p = validPayload(); (p as any).modules = (p as any).modules.slice(0, 3); return p; })(), expectValid: false, expectError: '3' },
  { name: '6 modules', payload: (() => { const p = validPayload(); (p as any).modules.push({ module_index: 6, slug: 'module-6', title: 'Module 6', description: 'extra' }); return p; })(), expectValid: false, expectError: '6' },

  // ── Lesson count per module ─────────────────────────────────────────────────
  {
    name: 'Module 2 has only 3 lessons',
    payload: (() => {
      const p = validPayload() as any;
      p.lessons = p.lessons.filter((l: any) => !(l.module_index === 2 && l.step_type === 'lesson' && l.slug === 'mod2-lesson4'));
      p.lessons.forEach((l: any, i: number) => { l.order_index = i + 1; });
      return p;
    })(),
    expectValid: false, expectError: 'Module 2',
  },

  // ── order_index integrity ───────────────────────────────────────────────────
  {
    name: 'Duplicate order_index',
    payload: (() => { const p = validPayload() as any; p.lessons[5].order_index = p.lessons[4].order_index; return p; })(),
    expectValid: false, expectError: 'Duplicate',
  },
  {
    name: 'Gap in order_index (3 → 5)',
    payload: (() => { const p = validPayload() as any; p.lessons[3].order_index = 99; return p; })(),
    expectValid: false, expectError: 'Gap',
  },
  {
    name: 'order_index starts at 0 not 1',
    payload: (() => { const p = validPayload() as any; p.lessons.forEach((l: any, i: number) => { l.order_index = i; }); return p; })(),
    expectValid: false, expectError: 'start at 1',
  },

  // ── Slug integrity ──────────────────────────────────────────────────────────
  {
    name: 'Duplicate slug',
    payload: (() => { const p = validPayload() as any; p.lessons[1].slug = p.lessons[0].slug; return p; })(),
    expectValid: false, expectError: 'duplicate slug',
  },
  {
    name: 'Slug with underscore',
    payload: (() => { const p = validPayload() as any; p.lessons[0].slug = 'mod1_lesson1'; return p; })(),
    expectValid: false, expectError: 'slug',
  },
  {
    name: 'Slug with uppercase',
    payload: (() => { const p = validPayload() as any; p.lessons[0].slug = 'Mod1-Lesson1'; return p; })(),
    expectValid: false, expectError: 'slug',
  },
  {
    name: 'Slug with spaces',
    payload: (() => { const p = validPayload() as any; p.lessons[0].slug = 'mod 1 lesson 1'; return p; })(),
    expectValid: false, expectError: 'slug',
  },

  // ── step_type ───────────────────────────────────────────────────────────────
  {
    name: 'Invalid step_type "lecture"',
    payload: (() => { const p = validPayload() as any; p.lessons[0].step_type = 'lecture'; return p; })(),
    expectValid: false, expectError: 'step_type',
  },
  {
    name: 'Invalid step_type "video"',
    payload: (() => { const p = validPayload() as any; p.lessons[0].step_type = 'video'; return p; })(),
    expectValid: false, expectError: 'step_type',
  },

  // ── Content quality ─────────────────────────────────────────────────────────
  {
    name: 'Empty learning_points array',
    payload: (() => { const p = validPayload() as any; p.lessons[0].learning_points = []; return p; })(),
    expectValid: false, expectError: 'learning_points',
  },
  {
    name: 'Only 2 learning_points (need ≥3)',
    payload: (() => { const p = validPayload() as any; p.lessons[0].learning_points = ['Point one is long enough to pass', 'Point two is also long enough']; return p; })(),
    expectValid: false, expectError: 'learning_points',
  },
  {
    name: 'Learning point too short (stub)',
    payload: (() => { const p = validPayload() as any; p.lessons[0].learning_points = ['OK', 'Also fine here', 'Third point']; return p; })(),
    expectValid: false, expectError: 'learning_point too short',
  },
  {
    name: 'Scenario too short (stub)',
    payload: (() => { const p = validPayload() as any; p.lessons[0].scenario = 'A fire alarm goes off.'; return p; })(),
    expectValid: false, expectError: 'scenario too short',
  },
  {
    name: 'Missing assessment_question',
    payload: (() => { const p = validPayload() as any; delete p.lessons[0].assessment_question; return p; })(),
    expectValid: false, expectError: 'assessment_question',
  },
  {
    name: 'assessment_question.correct = "e" (invalid)',
    payload: (() => { const p = validPayload() as any; p.lessons[0].assessment_question.correct = 'e'; return p; })(),
    expectValid: false, expectError: 'correct',
  },
  {
    name: 'assessment_question.question too short',
    payload: (() => { const p = validPayload() as any; p.lessons[0].assessment_question.question = 'What?'; return p; })(),
    expectValid: false, expectError: 'question too short',
  },
  {
    name: 'assessment_question.rationale too short',
    payload: (() => { const p = validPayload() as any; p.lessons[0].assessment_question.rationale = 'Correct.'; return p; })(),
    expectValid: false, expectError: 'rationale too short',
  },

  // ── Exam ────────────────────────────────────────────────────────────────────
  {
    name: 'Exam question_count = 10 (below 25)',
    payload: (() => { const p = validPayload() as any; p.exams[0].question_count = 10; return p; })(),
    expectValid: false, expectError: '25',
  },
  {
    name: 'Exam domain_blueprint empty',
    payload: (() => { const p = validPayload() as any; p.exams[0].domain_blueprint = []; return p; })(),
    expectValid: false, expectError: 'domain_blueprint',
  },
  {
    name: 'No exams array',
    payload: (() => { const p = validPayload() as any; p.exams = []; return p; })(),
    expectValid: false, expectError: 'exams',
  },

  // ── Checkpoints ─────────────────────────────────────────────────────────────
  {
    name: 'Checkpoints after modules 1,2,3 (not 2,3,4)',
    payload: (() => { const p = validPayload() as any; p.checkpoints[0].after_module_index = 1; return p; })(),
    expectValid: false, expectError: 'Checkpoints placed',
  },
  {
    name: 'Only 2 checkpoints',
    payload: (() => { const p = validPayload() as any; p.checkpoints = p.checkpoints.slice(0, 2); return p; })(),
    expectValid: false, expectError: '2',
  },
  {
    name: 'Checkpoint row in module 5 (not allowed)',
    payload: (() => {
      const p = validPayload() as any;
      p.lessons.push({ order_index: 999, module_index: 5, slug: 'bad-cp-mod5', title: 'Bad', step_type: 'checkpoint', learning_points: [], scenario: '', assessment_question: { question: '', choices: { a: '', b: '', c: '', d: '' }, correct: 'a', rationale: '' } });
      return p;
    })(),
    expectValid: false, expectError: 'wrong modules',
  },

  // ── Course fields ───────────────────────────────────────────────────────────
  {
    name: 'compliance_status missing',
    payload: (() => { const p = validPayload() as any; delete p.course.compliance_status; return p; })(),
    expectValid: false, expectError: 'compliance_status',
  },
  {
    name: 'compliance_status = "verified" (not allowed from AI)',
    payload: (() => { const p = validPayload() as any; p.course.compliance_status = 'verified'; return p; })(),
    expectValid: false, expectError: 'compliance_status',
  },
  {
    name: 'Empty exam_eligibility_criteria',
    payload: (() => { const p = validPayload() as any; p.course.exam_eligibility_criteria = []; return p; })(),
    expectValid: false, expectError: 'exam_eligibility_criteria',
  },
  {
    name: 'Missing pass_threshold_checkpoints',
    payload: (() => { const p = validPayload() as any; delete p.course.pass_threshold_checkpoints; return p; })(),
    expectValid: false, expectError: 'pass_threshold_checkpoints',
  },
];

// ── Runner ────────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

console.log('VALIDATOR REJECTION TEST SUITE');
console.log('─'.repeat(70));

for (const tc of CASES) {
  const result = validateCourseOutline(tc.payload);

  if (tc.expectValid) {
    if (result.valid) {
      console.log(`✅ PASS  "${tc.name}"`);
      passed++;
    } else {
      console.log(`❌ FAIL  "${tc.name}" → expected valid but got errors: ${result.errors.slice(0, 2).join(' | ')}`);
      failed++;
    }
  } else {
    if (!result.valid) {
      const matched = result.errors.some(e => e.toLowerCase().includes((tc.expectError ?? '').toLowerCase()));
      if (matched) {
        const matchedError = result.errors.find(e => e.toLowerCase().includes((tc.expectError ?? '').toLowerCase()))!;
        console.log(`✅ PASS  "${tc.name}"\n         → rejected: "${matchedError}"`);
        passed++;
      } else {
        console.log(`⚠️  WRONG REASON  "${tc.name}" → rejected but expected "${tc.expectError}" not in errors`);
        console.log(`         Actual: ${result.errors.slice(0, 3).join(' | ')}`);
        failed++;
      }
    } else {
      console.log(`❌ FAIL  "${tc.name}" → expected rejection but validator passed it`);
      failed++;
    }
  }
}

console.log('\n' + '─'.repeat(70));
console.log(`RESULT: ${passed}/${CASES.length} passed, ${failed}/${CASES.length} failed`);
if (failed === 0) {
  console.log('✅ ALL REJECTION TESTS PASSED — validator rejects every invalid payload');
} else {
  console.log('❌ SOME TESTS FAILED — validator has gaps');
  process.exit(1);
}
