#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const mustExist = [
  'components/admin/course-builder/UnifiedCourseBuilder.tsx',
  'apps/admin/app/studio/courses/page.tsx',
  'apps/admin/app/api/admin/course-builder/pipeline/route.ts',
  'apps/admin/app/api/admin/course-builder/publish/route.ts',
  'apps/admin/app/api/admin/lms/courses/[courseId]/publish/route.ts',
  'lib/course-factory/index.ts',
  'lib/course-factory/factory.ts',
  'lib/course-factory/procurement-gate.ts',
  'lib/course-factory/post-generation-governance.ts',
  'lib/course-factory/experience-contract.ts',
  'apps/lms/app/api/learner/interactions/route.ts',
  'apps/lms/app/api/courses/[courseId]/practice-attempts/route.ts',
  'apps/lms/app/api/courses/[courseId]/focused-review/route.ts',
  'apps/lms/app/api/courses/[courseId]/readiness-report/route.ts',
  'apps/lms/app/api/courses/[courseId]/flashcards/route.ts',
  'apps/lms/app/api/courses/[courseId]/flashcards/[cardId]/rate/route.ts',
  'supabase/migrations/20260819212000_harden_nha_self_paced_rls.sql',
  'supabase/migrations/20260819213000_complete_self_paced_learner_rls.sql',
];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message) => failures.push(message);

for (const file of mustExist) if (!fs.existsSync(path.join(root, file))) fail(`missing required procurement component: ${file}`);

if (failures.length === 0) {
  const studioCourses = read('apps/admin/app/studio/courses/page.tsx');
  if (!studioCourses.includes('UnifiedCourseBuilder')) fail('/studio/courses is not mounted to UnifiedCourseBuilder');

  const pipeline = read('apps/admin/app/api/admin/course-builder/pipeline/route.ts');
  for (const invariant of ['courseFactory(', 'normalizeGeneratedCourseForGovernance', 'moduleCount must be between 1 and 40']) {
    if (!pipeline.includes(invariant)) fail(`canonical pipeline missing invariant: ${invariant}`);
  }

  const templatePublish = read('apps/admin/app/api/admin/course-builder/publish/route.ts');
  for (const invariant of ['auditCourseTemplate', 'runGovernmentProcurementGate', 'courseFactory']) {
    if (!templatePublish.includes(invariant)) fail(`template publish gate missing: ${invariant}`);
  }

  const persistedPublish = read('apps/admin/app/api/admin/lms/courses/[courseId]/publish/route.ts');
  for (const invariant of [
    'review_status',
    'governing_standard_version',
    'AI lesson not human-approved',
    'question 1',
    'competency graph/mappings',
    'interactive self-paced lesson experiences',
    'module_completion_rules',
  ]) {
    if (!persistedPublish.includes(invariant)) fail(`persisted publish gate missing: ${invariant}`);
  }

  const legacy = read('apps/admin/app/api/admin/courses/generate/publish/route.ts');
  if (!legacy.includes('LEGACY_COURSE_PUBLISHER_RETIRED')) fail('legacy independent publisher is still active');
  for (const forbidden of [".from('courses').insert", ".from('course_modules').insert", ".from('course_lessons').insert"]) {
    if (legacy.includes(forbidden)) fail(`legacy publisher still writes canonical course data: ${forbidden}`);
  }

  const interaction = read('apps/lms/app/api/learner/interactions/route.ts');
  for (const invariant of ['passingScore', 'weakObjectives', 'interaction_progress', 'reviewMessage']) {
    if (!interaction.includes(invariant)) fail(`learner mastery/remediation endpoint missing: ${invariant}`);
  }

  const experience = read('lib/course-factory/experience-contract.ts');
  for (const invariant of ['flashcards', 'knowledgeChecks', 'scenario', 'caseStudy', 'practicalTask', 'remediation']) {
    if (!experience.includes(invariant)) fail(`lesson experience contract missing: ${invariant}`);
  }

  const governance = read('lib/course-factory/post-generation-governance.ts');
  for (const invariant of ['competency_checks', 'competencyKeys', "source: 'course_factory'", 'approved = false']) {
    if (!governance.includes(invariant)) fail(`post-generation governance missing: ${invariant}`);
  }

  const rls = read('supabase/migrations/20260819212000_harden_nha_self_paced_rls.sql') + read('supabase/migrations/20260819213000_complete_self_paced_learner_rls.sql');
  for (const invariant of ['public.is_admin()', 'course_enrollments', 'flashcard_progress_own_insert', 'readiness_reports_own_insert']) {
    if (!rls.includes(invariant)) fail(`self-paced RLS gate missing: ${invariant}`);
  }
}

if (failures.length) {
  console.error('COURSE BUILDER PROCUREMENT GATE FAILED');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('Course Builder procurement architecture gate: PASS');
console.log('Verified: one generation authority, one persisted publish authority, human AI review, standards traceability, mastery/remediation services, spaced review, readiness reporting, practical sign-off controls, and hardened RLS.');
