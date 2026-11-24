/**
 * Private, self-contained owner-review companion. No publication or LMS writes.
 * Usage: node scripts/course-builder/build-manufacturing-practice.mjs CONTENT_DIR OUTPUT_HTML
 * Course source files and the generated companion remain private review artifacts.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../..');
const contentDir = resolve(process.argv[2] ?? '../course-build/content');
const output = resolve(process.argv[3] ?? '../course-build/output/Interactive_Practice.html');
if (output.startsWith(resolve(repoRoot, 'public') + '/')) {
  throw new Error('This review companion must not be written into a public website directory.');
}
const [forkliftText, manufacturingText, engineText, template] = await Promise.all([
  readFile(resolve(contentDir, 'forklift.json'), 'utf8'),
  readFile(resolve(contentDir, 'manufacturing.json'), 'utf8'),
  readFile(resolve(repoRoot, 'lib/lms/manufacturing-simulation.ts'), 'utf8'),
  readFile(resolve(scriptDir, 'manufacturing-practice.template.html'), 'utf8'),
]);
const forklift = JSON.parse(forkliftText);
const manufacturing = JSON.parse(manufacturingText);
const compiledEngine = ts.transpileModule(engineText, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const engineExports = {};
new Function('exports', compiledEngine)(engineExports);
const lessons = [...forklift.lessons, ...manufacturing.lessons].map((lesson) => ({
  id: lesson.id,
  title: lesson.title,
  section: lesson.id.startsWith('ASM-') ? 'Assembly and production' :
    lesson.id.startsWith('QLT-') ? 'Quality inspection' : 'Forklift foundations',
  estimatedMinutes: lesson.estimatedMinutes,
  objectives: lesson.objectives,
  bodyMarkdown: lesson.bodyMarkdown,
  workedExample: lesson.workedExample,
  workbook: {
    brief: lesson.workbook.brief,
    inputs: lesson.workbook.inputs,
    prompts: [
      lesson.workbook.questions[0] ?? 'Describe the task and the evidence needed.',
      lesson.workbook.questions[1] ?? 'Show your calculations and decisions.',
      lesson.workbook.questions.slice(2).join('\n\n') ||
        'Explain your conclusion, unresolved questions, and next action.',
    ],
    submissionRequirements: lesson.workbook.submissionRequirements,
  },
  practiceQuestions: lesson.practiceQuestions,
  sourceUrls: lesson.sourceUrls ?? [],
  activitySchedule: lesson.activitySchedule ?? null,
}));
if (lessons.length !== 24 || new Set(lessons.map((lesson) => lesson.id)).size !== 24 ||
    lessons.reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0) !== 48 * 60 ||
    lessons.some((lesson) => lesson.estimatedMinutes !== 120)) {
  throw new Error('The companion requires the complete 24-lesson, 48-hour authored plan.');
}
const simulations = [
  ...forklift.simulationSpecs,
  ...(manufacturing.simulations ?? manufacturing.simulationSpecs ?? []),
].map((wrapper) => {
  const spec = engineExports.parseManufacturingSimulation(wrapper.experience.manufacturingSimulation);
  if (!spec) throw new Error('Invalid authored simulation for ' + wrapper.lessonId);
  const lessonId = spec.id === 'forklift-hazard-route-v1' ? 'forklift-01' : wrapper.lessonId;
  if (!lessons.some((lesson) => lesson.id === lessonId))
    throw new Error('Simulation has no matching lesson: ' + lessonId);
  const key = Object.fromEntries(spec.tasks.map((task) => [task.id, task.expected]));
  const result = engineExports.evaluateManufacturingSimulation(spec, key);
  if (!result?.completed || result.score !== 100)
    throw new Error('Authored simulation answer key failed: ' + spec.id);
  return { lessonId, spec };
});
if (simulations.length !== 10 || new Set(simulations.map((item) => item.lessonId)).size !== 10)
  throw new Error('Expected 10 simulations assigned to 10 distinct lessons.');
const data = {
  format: 'elevate-manufacturing-practice',
  schemaVersion: 1,
  courseId: 'forklift-manufacturing-operations-48h',
  title: 'Forklift and Manufacturing Operations',
  contentHash: createHash('sha256').update(forkliftText).update(manufacturingText).digest('hex'),
  generatedAt: new Date().toISOString(),
  lessons,
  simulations,
};
const safeJson = JSON.stringify(data).replaceAll('<', '\\u003c')
  .replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
const engine = 'const SimulationEngine = (() => { const exports = {};\n' +
  compiledEngine + '\nreturn exports; })();';
const html = template.replace('__COURSE_DATA_JSON__', safeJson)
  .replace('/*__SIMULATION_ENGINE__*/', engine);
if (html.includes('__COURSE_DATA_JSON__') || html.includes('/*__SIMULATION_ENGINE__*/'))
  throw new Error('Companion template was not fully assembled.');
await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
console.log(JSON.stringify({
  output, lessons: lessons.length, plannedHours: 48, simulations: simulations.length,
  tasks: simulations.reduce((sum, item) => sum + item.spec.tasks.length, 0),
  bytes: Buffer.byteLength(html), contentHash: data.contentHash,
}, null, 2));
