import fs from 'node:fs';

const requiredFiles = [
  'lib/ultimate-course-builder/core/production-handlers.ts',
  'lib/ultimate-course-builder/core/runtime-factory.ts',
  'lib/ultimate-course-builder/core/full-course-runner.ts',
  'lib/ultimate-course-builder/core/build-runner.ts',
  'lib/ultimate-course-builder/worker/job-queue.ts',
  'lib/ultimate-course-builder/worker/process-job.ts',
  'lib/ultimate-course-builder/adapters/platform-media.ts',
  'lib/ultimate-course-builder/adapters/platform-narration.ts',
  'lib/ultimate-course-builder/adapters/platform-renderer.ts',
  'lib/ultimate-course-builder/adapters/platform-learner-runtime.ts',
  'lib/ultimate-course-builder/release/release-service.ts',
  'lib/devstudio/ultimate-course-control.ts',
];
const failures = [];
const read = (file) => {
  if (!fs.existsSync(file)) { failures.push('missing ' + file); return ''; }
  return fs.readFileSync(file, 'utf8');
};
const sources = Object.fromEntries(requiredFiles.map((file) => [file, read(file)]));
const handlers = sources['lib/ultimate-course-builder/core/production-handlers.ts'];
const requiredSteps = [
  'standards_lock','learning_objectives','prerequisites','teaching_sequence','instructor_script',
  'storyboard','visual_assignment','scene_construction','natural_narration','synchronization',
  'active_teaching','mistakes_and_corrections','assessment_alignment','lesson_film_render',
  'finished_media_qa','instructional_qa','narration_qa','learner_runthrough','selective_repair',
  'credential_release',
];
for (const step of requiredSteps) if (!handlers.includes(step + ':')) failures.push('production handler missing ' + step);
for (const token of ['generation_required','render_required','inspection_required',"status:'planned'","status:'observed'",'HANDLER_NOT_IMPLEMENTED']) {
  for (const [file, src] of Object.entries(sources)) if (src.includes(token)) failures.push(file + ' contains forbidden placeholder ' + token);
}
const mustContain = [
  ['lib/ultimate-course-builder/worker/process-job.ts','result.completed'],
  ['lib/ultimate-course-builder/worker/process-job.ts','requeueForRepair'],
  ['lib/ultimate-course-builder/worker/job-queue.ts','requeueForRepair'],
  ['lib/ultimate-course-builder/adapters/platform-media.ts','storedLicensedMediaMetadata'],
  ['lib/ultimate-course-builder/adapters/platform-media.ts','retrievableWorkspaceAsset'],
  ['lib/ultimate-course-builder/adapters/platform-renderer.ts','requireResolvedVisualEvidence'],
  ['lib/ultimate-course-builder/adapters/platform-learner-runtime.ts','ULTIMATE_LEARNER_RUNTHROUGH_URL'],
  ['lib/ultimate-course-builder/adapters/platform-learner-runtime.ts','timingSafeEqual'],
  ['lib/ultimate-course-builder/release/release-service.ts','assertCompleteLesson'],
  ['lib/ultimate-course-builder/release/release-service.ts','ULTIMATE_CANONICAL_PUBLICATION_READBACK_FAILED'],
  ['lib/ultimate-course-builder/release/release-service.ts','ultimate_release_versions'],
  ['lib/devstudio/ultimate-course-control.ts','UltimateReleaseService'],
];
for (const [file, token] of mustContain) if (!sources[file]?.includes(token)) failures.push(file + ' missing certification invariant ' + token);
if (sources['lib/devstudio/ultimate-course-control.ts']?.includes('UltimateLmsPublisher')) failures.push('Dev Studio still uses legacy publisher');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('Ultimate production certification guard: PASS — 20 stages plus queue, repair, licensed media, render evidence, authenticated learner runthrough, and canonical release invariants present.');
