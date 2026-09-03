#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const mustExist = [
  'components/admin/course-builder/UnifiedCourseBuilder.tsx',
  'apps/admin/app/studio/courses/page.tsx',
  'apps/admin/app/api/admin/course-builder/route.ts',
  'lib/course-builder/orchestrator.ts',
  'lib/course-builder/edit-service.ts',
  'lib/course-builder/persisted-publish-service.ts',
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
  'apps/lms/app/api/courses/[courseId]/tutor/route.ts',
  'components/lms/CourseTutor.tsx',
  'apps/lms/app/lms/courses/[courseId]/lessons/[lessonId]/layout.tsx',
  'supabase/migrations/20260819212000_harden_nha_self_paced_rls.sql',
  'supabase/migrations/20260819213000_complete_self_paced_learner_rls.sql',
];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message) => failures.push(message);

for (const file of mustExist) if (!fs.existsSync(path.join(root, file))) fail(`missing required procurement component: ${file}`);

if (failures.length === 0) {
  const studioCourses = read('apps/admin/app/studio/courses/page.tsx');
  if (!studioCourses.includes('UnifiedCourseBuilder')) fail('/studio/courses is not mounted to UnifiedCourseBuilder');

  const rootRoute = read('apps/admin/app/api/admin/course-builder/route.ts');
  for (const invariant of [
    "from '@/lib/course-builder/orchestrator'",
    "from '@/lib/course-builder/persisted-publish-service'",
    "action === 'publish'",
    "action === 'publish-persisted'",
    "action === 'repair'",
    "action === 'audit'",
    'moduleCount must be between 1 and 40',
  ]) if (!rootRoute.includes(invariant)) fail(`canonical Course Builder root missing invariant: ${invariant}`);

  const orchestrator = read('lib/course-builder/orchestrator.ts');
  for (const invariant of ['auditCourseTemplate', 'runGovernmentProcurementGate', 'publishGovernedCourse', "from '../course-factory/factory'"]) {
    if (!orchestrator.includes(invariant)) fail(`Course Builder orchestrator missing: ${invariant}`);
  }

  const persistedPublish = read('lib/course-builder/persisted-publish-service.ts');
  for (const invariant of [
    'review_status',
    'governing_standard_version',
    'AUTOMATED_COURSE_GATE_VERSION',
    'rationale missing',
    'standards/competency mapping missing',
    'canonical interactive lesson experience missing',
    'mastery remediation plan missing',
    'record_course_automated_approval',
    'automated_quality_gate',
    'automated_approval_id',
    'module_completion_rules',
    'publishCourse',
  ]) if (!persistedPublish.includes(invariant)) fail(`persisted Course Builder publish gate missing: ${invariant}`);

  for (const retiredPath of [
    'apps/admin/app/api/admin/course-builder/publish/route.ts',
    'apps/admin/app/api/admin/lms/courses/[courseId]/publish/route.ts',
    'apps/admin/app/api/admin/courses/generate/publish/route.ts',
  ]) {
    const retired = read(retiredPath);
    if (!/(RETIRED|LEGACY_COURSE_PUBLISHER_RETIRED|COURSE_BUILDER_ROOT_REQUIRED)/.test(retired)) fail(`retired publisher still appears active: ${retiredPath}`);
    for (const forbidden of [".from('courses').insert", ".from('course_modules').insert", ".from('course_lessons').insert", 'publishCourse(']) {
      if (retired.includes(forbidden)) fail(`retired publisher still owns write/publish behavior (${retiredPath}): ${forbidden}`);
    }
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
  for (const invariant of ['competency_checks', 'competencyKeys', "source: 'course_factory'", 'update.approved = false']) {
    if (!governance.includes(invariant)) fail(`post-generation governance missing: ${invariant}`);
  }

  const tutor = read('apps/lms/app/api/courses/[courseId]/tutor/route.ts');
  for (const invariant of ['Course access required', 'Never change grades', 'approved course context', 'canModifyGrades: false', 'canApproveCompetencies: false']) {
    if (!tutor.includes(invariant)) fail(`grounded learner tutor missing: ${invariant}`);
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
console.log('Verified: Studio-controlled root authority, governed template and persisted publication, deterministic automated approval evidence, standards traceability, mastery/remediation services, spaced review, readiness reporting, grounded AI tutoring, practical sign-off controls, and hardened RLS.');
