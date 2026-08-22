import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = (rel) => path.join(root, rel);
const read = (rel) => fs.readFileSync(file(rel), 'utf8');
const write = (rel, content) => {
  fs.mkdirSync(path.dirname(file(rel)), { recursive: true });
  fs.writeFileSync(file(rel), content);
};
const replaceRequired = (rel, from, to) => {
  const source = read(rel);
  if (!source.includes(from)) throw new Error(`${rel}: required marker not found: ${from}`);
  write(rel, source.replace(from, to));
};
const replaceAllRequired = (rel, from, to) => {
  const source = read(rel);
  if (!source.includes(from)) throw new Error(`${rel}: required marker not found: ${from}`);
  write(rel, source.split(from).join(to));
};

const orchestrator = `/**
 * Canonical Course Builder server orchestration.
 *
 * Application traffic must cross this layer before the private Course Factory
 * execution engine. Studio controls this layer; LMS only consumes published
 * courses and learner state.
 */
import { courseFactory as executeCourseFactory } from '../course-factory/factory';
import type { FactoryInput, FactoryOutput, ProgressCallback } from '../course-factory/types';
import { normalizeGeneratedCourseForGovernance } from '../course-factory/post-generation-governance';
import { queueCourseLessonVideos } from '../course-factory/media-service';
import { runGovernmentProcurementGate } from '../course-factory/procurement-gate';
import { auditCourseTemplate } from './audit';
import type { ProgramBuilderTemplate } from './schema';
import { adaptProgramTemplateToBlueprint } from './publish-adapter';
import { requireAdminClient } from '../supabase/admin';

export async function courseFactory(
  input: FactoryInput,
  progress?: ProgressCallback,
): Promise<FactoryOutput> {
  return executeCourseFactory(input, progress);
}

export async function auditCourseGovernance(template: ProgramBuilderTemplate) {
  const audit = auditCourseTemplate(template);
  const procurement = runGovernmentProcurementGate(template);
  return { ok: audit.ok && procurement.ok, audit, procurement };
}

export async function publishGovernedCourse(
  template: ProgramBuilderTemplate,
  progress?: ProgressCallback,
) {
  const governanceGate = await auditCourseGovernance(template);
  if (!governanceGate.ok) {
    return {
      ok: false,
      error: 'Publication blocked by course governance gate',
      ...governanceGate,
      result: null,
      governance: null,
    };
  }

  const blueprint = adaptProgramTemplateToBlueprint(template);
  const result = await executeCourseFactory(
    {
      programId: template.programId,
      programSlug: template.programId ? undefined : template.slug,
      blueprint,
      mode: 'refresh',
      contentSource: 'ai',
      videoMode: 'queue',
    },
    progress,
  );

  const governance = result.ok && result.courseId
    ? await normalizeGeneratedCourseForGovernance(result.courseId)
    : null;

  return { ...governanceGate, ok: result.ok && governanceGate.ok, result, governance };
}

export async function repairCanonicalCourse(courseId: string, progress?: ProgressCallback) {
  const db = await requireAdminClient();
  const { data: course, error } = await db
    .from('courses')
    .select('id,slug,title,program_id,programs(slug)')
    .eq('id', courseId)
    .maybeSingle();

  if (error) throw error;
  if (!course) throw new Error('Course not found');

  const relatedPrograms = course.programs as unknown as Array<{ slug: string }> | { slug: string } | null;
  const programSlug = Array.isArray(relatedPrograms)
    ? relatedPrograms[0]?.slug ?? null
    : relatedPrograms?.slug ?? null;
  const programId = course.program_id as string | null;

  if (!programId || !programSlug) throw new Error('Course is not linked to a canonical program');

  const result = await executeCourseFactory(
    {
      programId,
      programSlug,
      mode: 'missing-only',
      contentSource: 'ai',
      videoMode: 'queue',
    },
    progress,
  );

  const governance = result.ok && result.courseId
    ? await normalizeGeneratedCourseForGovernance(result.courseId)
    : null;

  return { ...result, governance, repairedCourseId: courseId, programSlug };
}

export async function queueCourseMedia(input: {
  courseId: string;
  onlyMissing?: boolean;
  force?: boolean;
  limit?: number | null;
}) {
  return queueCourseLessonVideos(input);
}

export { normalizeGeneratedCourseForGovernance } from '../course-factory/post-generation-governance';
`;
write('lib/course-builder/orchestrator.ts', orchestrator);

const studioController = `/** Studio control-plane adapter for the canonical Course Builder. */
export {
  courseFactory,
  auditCourseGovernance,
  publishGovernedCourse,
  repairCanonicalCourse,
  queueCourseMedia,
  normalizeGeneratedCourseForGovernance,
} from '../course-builder/orchestrator';
`;
write('lib/devstudio/course-builder-controller.ts', studioController);

replaceRequired(
  'lib/course-factory/index.ts',
  "export { courseFactory } from './factory';",
  "// Compatibility export: application callers cross the Course Builder orchestration layer.\nexport { courseFactory } from '../course-builder/orchestrator';",
);

replaceAllRequired(
  'apps/admin/app/api/devstudio/chat/route.ts',
  "await import('@/lib/course-factory')",
  "await import('@/lib/devstudio/course-builder-controller')",
);

const rootRoute = 'apps/admin/app/api/admin/course-builder/route.ts';
replaceRequired(
  rootRoute,
  "import { courseFactory, loadAllBlueprints } from '@/lib/course-factory';",
  "import { loadAllBlueprints } from '@/lib/course-factory';\nimport { courseFactory, auditCourseGovernance, publishGovernedCourse, repairCanonicalCourse, queueCourseMedia } from '@/lib/course-builder/orchestrator';",
);
replaceRequired(
  rootRoute,
  "import { queueCourseLessonVideos } from '@/lib/course-factory/media-service';\n",
  '',
);
replaceRequired(
  rootRoute,
  "  | 'queue-media';",
  "  | 'queue-media'\n  | 'audit'\n  | 'validate'\n  | 'publish'\n  | 'repair'\n  | 'generate-missing';",
);
replaceRequired(
  rootRoute,
  '      const result = await queueCourseLessonVideos({',
  '      const result = await queueCourseMedia({',
);

const rootInsertionMarker = "  if (action !== 'generate') {";
const rootSource = read(rootRoute);
if (!rootSource.includes(rootInsertionMarker)) throw new Error('root Course Builder action insertion marker missing');
const newActions = `  if (action === 'audit' || action === 'validate') {
    try {
      const governance = await auditCourseGovernance((body.template ?? body) as any);
      return NextResponse.json(governance, { status: governance.ok ? 200 : 400 });
    } catch (error) {
      logger.error('[course-builder] Governance audit failed', error);
      return NextResponse.json({ ok: false, error: 'Course governance audit failed' }, { status: 400 });
    }
  }

  if (action === 'publish') {
    try {
      const result = await publishGovernedCourse((body.template ?? body) as any);
      return NextResponse.json(result, { status: result.ok ? 200 : 422 });
    } catch (error) {
      logger.error('[course-builder] Governed publish failed', error);
      return NextResponse.json({ ok: false, error: 'Course publication failed' }, { status: 500 });
    }
  }

  if (action === 'repair' || action === 'generate-missing') {
    const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : '';
    if (!courseId) return NextResponse.json({ ok: false, error: 'courseId is required' }, { status: 400 });
    try {
      const result = await repairCanonicalCourse(courseId);
      return NextResponse.json({ ok: result.ok, result }, { status: result.ok ? 200 : 422 });
    } catch (error) {
      logger.error('[course-builder] Course repair failed', error);
      return NextResponse.json({ ok: false, error: 'Course repair failed' }, { status: 500 });
    }
  }

`;
write(rootRoute, rootSource.replace(rootInsertionMarker, newActions + rootInsertionMarker));

const retiredRoute = (name, action, extra = '') => `/** RETIRED compatibility endpoint. ${name} is owned by POST /api/admin/course-builder. */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return NextResponse.json({
    error: 'COURSE_BUILDER_ROOT_REQUIRED',
    message: '${name} moved to the canonical Course Builder orchestration boundary.',
    canonicalEndpoint: '/api/admin/course-builder',
    action: '${action}',
    ${extra}
  }, { status: 410 });
}
`;

write(
  'apps/admin/app/api/admin/lms/courses/generate/route.ts',
  retiredRoute('Complete course generation', 'generate'),
);
write(
  'apps/admin/app/api/admin/course-builder/publish/route.ts',
  retiredRoute('Course publication', 'publish'),
);
write(
  'apps/admin/app/api/admin/courses/[courseId]/generate-missing/route.ts',
  retiredRoute('Course repair and missing-content generation', 'repair', "courseIdField: 'courseId',"),
);

replaceAllRequired(
  'apps/admin/app/api/admin/courses/ai-builder/route.ts',
  '/api/admin/lms/courses/generate',
  '/api/admin/course-builder',
);

replaceAllRequired(
  'scripts/check-studio-architecture.mjs',
  "await import('@/lib/course-factory')",
  "await import('@/lib/devstudio/course-builder-controller')",
);
replaceRequired(
  'scripts/check-studio-architecture.mjs',
  "if (!adminAiChat.includes('normalizeGeneratedCourseForGovernance')) fail('Admin AI course creation does not run post-generation governance');",
  "if (!adminAiChat.includes('normalizeGeneratedCourseForGovernance')) fail('Admin AI course creation does not run post-generation governance');\nif (adminAiChat.includes(\"await import('@/lib/course-factory')\")) fail('Studio bypasses Course Builder orchestration and imports Course Factory directly');",
);

const authority = `import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const read = (rel) => {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) { failures.push(\`Missing required file: \${rel}\`); return ''; }
  return fs.readFileSync(abs, 'utf8');
};
const walk = (dir, out = []) => {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (['node_modules','.next','dist','build','archive'].includes(entry.name)) continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else if (/\\.(?:ts|tsx|js|mjs|cjs)$/.test(entry.name)) out.push(rel.split(path.sep).join('/'));
  }
  return out;
};

const rootRoute = 'apps/admin/app/api/admin/course-builder/route.ts';
const rootText = read(rootRoute);
for (const required of [
  "from '@/lib/course-builder/orchestrator'",
  "action === 'generate-from-blueprint'",
  "action === 'queue-media'",
  "action === 'publish'",
  "action === 'repair'",
  "action === 'audit'",
]) if (!rootText.includes(required)) failures.push(\`\${rootRoute}: missing canonical action/authority \${required}\`);

const studioChat = read('apps/admin/app/api/devstudio/chat/route.ts');
if (!studioChat.includes("await import('@/lib/devstudio/course-builder-controller')")) failures.push('Studio does not control course generation through its Course Builder controller');
if (studioChat.includes("await import('@/lib/course-factory')")) failures.push('Studio directly imports Course Factory');

const controller = read('lib/devstudio/course-builder-controller.ts');
if (!controller.includes("from '../course-builder/orchestrator'")) failures.push('Studio Course Builder controller is not backed by canonical orchestrator');
const orchestrator = read('lib/course-builder/orchestrator.ts');
if (!orchestrator.includes("from '../course-factory/factory'")) failures.push('Course Builder orchestrator does not own private Course Factory execution');

for (const rel of [
  'apps/admin/app/api/admin/lms/courses/generate/route.ts',
  'apps/admin/app/api/admin/course-builder/publish/route.ts',
  'apps/admin/app/api/admin/courses/[courseId]/generate-missing/route.ts',
  'apps/lms/app/api/ai/generate-and-publish-course/route.ts',
  'apps/admin/app/api/admin/courses/generate/publish/route.ts',
  'supabase/functions/ai-course-create/index.ts',
]) {
  const text = read(rel);
  if (!/(RETIRED|COURSE_FACTORY_REQUIRED|COURSE_BUILDER_ROOT_REQUIRED)/.test(text)) failures.push(\`\${rel}: historical complete-course endpoint is not explicitly retired\`);
  if (/\\bcourseFactory\\s*\\(/.test(text)) failures.push(\`\${rel}: retired endpoint still invokes course generation\`);
}

const specializedPackageWriters = new Set([
  'apps/admin/app/api/admin/courses/[courseId]/clone/route.ts',
  'apps/admin/app/api/admin/programs/[programId]/clone/route.ts',
  'lib/course-factory/versioning.ts',
  'lib/course-factory/post-generation-governance.ts',
  'lib/db/courses.ts',
  'lib/lms/course-service.ts',
  'lib/studio/tools.ts',
  'scripts/e2e-test.ts',
  'scripts/run-pipeline-e2e.ts',
  'scripts/seed/apprenticeship-courses.mjs',
  'scripts/smoke-test-pipeline.ts',
]);
for (const rel of [...walk('apps'), ...walk('lib'), ...walk('scripts'), ...walk('supabase/functions')]) {
  if (rel === 'lib/course-factory/publisher.ts' || specializedPackageWriters.has(rel)) continue;
  const text = read(rel);
  const writes = (table) => new RegExp(\`\\\\.from\\\\(['\\\"]\${table}['\\\"]\\\\)[\\\\s\\\\S]{0,240}\\\\.(?:insert|upsert|update|delete)\\\\(\`).test(text);
  if (writes('courses') && writes('course_modules') && writes('course_lessons')) failures.push(\`\${rel}: parallel complete course-package writer detected\`);
}

for (const rel of walk('apps')) {
  if (rel === rootRoute) continue;
  const text = read(rel);
  if (text.includes("@/lib/course-factory/factory")) failures.push(\`\${rel}: runtime route imports private Course Factory engine\`);
  if (/\\bcourseFactory\\s*\\(/.test(text) && rel.includes('/api/')) failures.push(\`\${rel}: independent HTTP complete-course caller detected; use \${rootRoute}\`);
}

const forbiddenEndpointRefs = [
  '/api/admin/lms/courses/generate',
  '/api/admin/course-builder/publish',
  '/api/admin/courses/generate/publish',
  '/api/ai/generate-and-publish-course',
];
for (const rel of [...walk('apps'), ...walk('components'), ...walk('lib')]) {
  const text = read(rel);
  for (const endpoint of forbiddenEndpointRefs) if (text.includes(endpoint)) failures.push(\`\${rel}: retired endpoint referenced: \${endpoint}\`);
}

if (failures.length) {
  console.error('\\nCOURSE BUILDER AUTHORITY GATE FAILED\\n');
  failures.forEach((failure) => console.error(\`- \${failure}\`));
  process.exit(1);
}
console.log('Course Builder authority gate passed: Studio control plane -> Course Builder orchestrator -> private Course Factory -> canonical persistence/media/publish -> LMS.');
`;
write('scripts/check-course-factory-authority.mjs', authority);

const canonicalDoc = `# Canonical Studio / Course Builder Architecture

Authoritative as of 2026-08-22.

Studio is the control plane. Studio course commands pass through \`lib/devstudio/course-builder-controller.ts\`, which delegates to \`lib/course-builder/orchestrator.ts\`. The orchestrator is the only application service allowed to invoke the private Course Factory engine in \`lib/course-factory/factory.ts\`. The single application HTTP boundary is \`POST /api/admin/course-builder\`.

Canonical flow:

\`Studio -> Course Builder orchestrator -> Course Factory -> canonical courses/course_modules/course_lessons -> media/governance/publish -> LMS\`.

The LMS consumes published courses and learner state. It does not own an independent complete-course generator. Historical complete-course endpoints are retired compatibility surfaces and must not write or invoke Course Factory.

Publication actions must pass course audit and government procurement gates before a governed Course Factory build can be accepted. Repair uses missing-only generation so human edits are not overwritten.

CI authority gates are \`scripts/check-course-factory-authority.mjs\` and \`scripts/check-studio-architecture.mjs\`. Historical architecture documents are evidence only when they conflict with this document.
`;
write('docs/COURSE-BUILDER-CANONICAL-ARCHITECTURE.md', canonicalDoc);

console.log('One-time Studio/Course Builder consolidation applied.');
