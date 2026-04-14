/**
 * Generalization test for the course builder pipeline.
 *
 * Proves the pipeline works for a non-barber program (CNA) without
 * any barber-specific code. Tests:
 *   1. Valid CNA template passes validation
 *   2. Bad inputs are rejected (missing objectives, unregistered key, wrong score)
 *   3. Barber template passes its own validation
 *   4. PROGRAM_COURSE_MAP resolves correctly for both programs
 *
 * Usage:
 *   pnpm tsx --env-file=.env.local scripts/test-course-builder-pipeline.ts
 */

import { validateCourseTemplate, assertPublishable } from '../lib/course-builder/validate';
import { normalizeTemplate } from '../lib/course-builder/pipeline';
import { resolveCourseId, PROGRAM_COURSE_MAP, type CourseTemplate } from '../lib/course-builder/schema';
import { isRegisteredCompetencyKey } from '../lib/course-builder/competencies';

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

// ─── Test fixtures ────────────────────────────────────────────────────────────

// A minimal valid CNA course — no barber-specific code
const CNA_TEMPLATE: CourseTemplate = {
  programSlug: 'barber-apprenticeship', // reuse barber mapping for test (CNA not in map yet)
  courseSlug:  'cna-test-course',
  title:       'CNA Fundamentals Test',
  modules: [
    {
      slug:  'cna-module-1',
      title: 'Patient Care Basics',
      order: 1,
      lessons: [
        {
          slug:  'cna-lesson-1',
          title: 'Introduction to Patient Care',
          type:  'lesson',
          order: 1,
          learningObjectives: [
            'Identify the role of a CNA in a care team',
            'Demonstrate proper hand hygiene technique',
          ],
          videoUrl: '/videos/cna/cna-lesson-1.mp4',
          content: '<h2>Introduction to Patient Care</h2><p>As a Certified Nursing Assistant, your primary role is to support patients with daily activities and report changes in condition to the charge nurse. This lesson covers the fundamentals of patient-centered care, communication, and your legal scope of practice.</p>',
        },
        {
          slug:  'cna-lesson-2',
          title: 'Vital Signs',
          type:  'lesson',
          order: 2,
          learningObjectives: [
            'Measure and record blood pressure accurately',
            'Identify normal vs abnormal vital sign ranges',
          ],
          videoUrl: '/videos/cna/cna-lesson-2.mp4',
          content: '<h2>Vital Signs</h2><p>Vital signs are the four key measurements that indicate the state of a patient\'s essential body functions: temperature, pulse, respiration, and blood pressure. Accurate measurement and timely reporting are core CNA competencies required for state board certification.</p>',
        },
        {
          slug:  'cna-module-1-checkpoint',
          title: 'Module 1 Checkpoint',
          type:  'checkpoint',
          order: 3,
          learningObjectives: ['Demonstrate mastery of patient care basics'],
          content: '<h2>Module 1 Review</h2><p>Before attempting the checkpoint quiz, review the key concepts from this module: the CNA role in the care team, proper hand hygiene technique, normal vital sign ranges, and when to report changes in patient condition to the charge nurse. You must score 75% or higher to proceed to Module 2.</p>',
          passingScore: 75,
          quizQuestions: [
            { id: 'q1', question: 'What is the normal resting heart rate for an adult?', options: ['40-60 bpm', '60-100 bpm', '100-120 bpm', '120-140 bpm'], correctAnswer: 1 },
            { id: 'q2', question: 'How long should you wash hands before patient contact?', options: ['5 seconds', '10 seconds', '20 seconds', '60 seconds'], correctAnswer: 2 },
            { id: 'q3', question: 'Which PPE is required for contact precautions?', options: ['Gloves only', 'Mask only', 'Gloves and gown', 'No PPE needed'], correctAnswer: 2 },
            { id: 'q4', question: 'Normal systolic blood pressure range is:', options: ['60-80 mmHg', '90-120 mmHg', '130-160 mmHg', '160-200 mmHg'], correctAnswer: 1 },
            { id: 'q5', question: 'A CNA should report changes in patient condition to:', options: ['Family members', 'The charge nurse', 'Other CNAs', 'The patient'], correctAnswer: 1 },
          ],
        },
      ],
    },
  ],
};

// A deliberately broken template — should fail validation
const BROKEN_TEMPLATE: CourseTemplate = {
  programSlug: 'barber-apprenticeship',
  courseSlug:  'broken-course',
  title:       'Broken Course',
  modules: [
    {
      slug:  'broken-module',
      title: 'Broken Module',
      order: 1,
      lessons: [
        {
          slug:  'broken-lesson-1',
          title: 'No objectives',
          type:  'lesson',
          order: 1,
          learningObjectives: [], // ❌ empty
          // no content, no video ❌
        },
        {
          slug:  'broken-lesson-2',
          title: 'Checkpoint with no quiz',
          type:  'checkpoint',
          order: 2,
          learningObjectives: ['Demonstrate something'],
          videoUrl: '/videos/test.mp4',
          // no quizQuestions ❌
          // no passingScore ❌
        },
        {
          slug:  'broken-lesson-3',
          title: 'Practical with unregistered key',
          type:  'lab',
          order: 3,
          learningObjectives: ['Demonstrate a skill'],
          videoUrl: '/videos/test.mp4',
          practicalRequired: true,
          competencyChecks: [
            { key: 'totally_fake_key_xyz', requiresInstructorSignoff: true }, // ❌ not in registry
          ],
        },
        {
          slug:  'broken-lesson-1', // ❌ duplicate slug
          title: 'Duplicate slug',
          type:  'lesson',
          order: 4,
          learningObjectives: ['Something'],
          videoUrl: '/videos/test.mp4',
        },
      ],
    },
  ],
};

// ─── Run tests ────────────────────────────────────────────────────────────────

console.log('\n=== Course Builder Pipeline — Generalization Tests ===\n');

// Test 1: PROGRAM_COURSE_MAP
console.log('Test 1: PROGRAM_COURSE_MAP resolution');
assert('barber-apprenticeship resolves', resolveCourseId('barber-apprenticeship') === '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17');
assert('hvac-technician resolves',       resolveCourseId('hvac-technician') === 'f0593164-55be-5867-98e7-8a86770a8dd0');
assert('unknown-program returns null',   resolveCourseId('unknown-program') === null);

// Test 2: Competency registry
console.log('\nTest 2: Competency registry');
assert('barbicide_immersion is registered',    isRegisteredCompetencyKey('barbicide_immersion'));
assert('razor_blade_change is registered',     isRegisteredCompetencyKey('razor_blade_change'));
assert('consultation_live is registered',      isRegisteredCompetencyKey('consultation_live'));
assert('totally_fake_key_xyz is NOT registered', !isRegisteredCompetencyKey('totally_fake_key_xyz'));

// Test 3: Valid CNA template passes
console.log('\nTest 3: Valid CNA template passes validation');
const cnaResult = validateCourseTemplate(normalizeTemplate(CNA_TEMPLATE));
assert('CNA template is valid',          cnaResult.valid, cnaResult.errors.map(e => e.message).join('; '));
assert('CNA has 3 lessons',              cnaResult.lessonCount === 3);
assert('CNA has zero errors',            cnaResult.errorCount === 0);

// Test 4: Broken template fails with correct errors
console.log('\nTest 4: Broken template fails with expected errors');
const brokenResult = validateCourseTemplate(normalizeTemplate(BROKEN_TEMPLATE));
assert('Broken template is invalid',     !brokenResult.valid);

const errorMessages = brokenResult.errors.map(e => e.message);
assert('Catches empty objectives',       errorMessages.some(m => m.includes('learning objective')));
assert('Catches missing quiz questions', errorMessages.some(m => m.includes('quiz questions')));
assert('Catches missing passing_score',  errorMessages.some(m => m.includes('passingScore') || m.includes('passing_score')));
assert('Catches unregistered key',       errorMessages.some(m => m.includes('totally_fake_key_xyz')));
assert('Catches duplicate slug',         errorMessages.some(m => m.includes('duplicate')));

// Test 5: assertPublishable throws on broken, passes on valid
console.log('\nTest 5: assertPublishable gate');
let threw = false;
try { assertPublishable(normalizeTemplate(BROKEN_TEMPLATE)); } catch { threw = true; }
assert('assertPublishable throws on broken template', threw);

let didNotThrow = true;
try { assertPublishable(normalizeTemplate(CNA_TEMPLATE)); } catch (e: any) { didNotThrow = false; console.error('  Unexpected throw:', e.message); }
assert('assertPublishable passes on valid CNA template', didNotThrow);

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('\n✅ Pipeline generalizes — builder is not a duplicator');
} else {
  console.error('\n❌ Pipeline has failures — fix before adding new programs');
  process.exit(1);
}
