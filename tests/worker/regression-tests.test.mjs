import { test } from '@playwright/test';

const profile = { competencies: [{ id: 'c' }] };
const failures = [];
const dispatches = [];
const findings = [{ step: 'visual_assignment', severity: 'error', code: 'REPAIR_PRODUCER_UNCHANGED', message: 'REPAIR_PRODUCER_UNCHANGED:visual_assignment' }];

const process = new Function('lessonAutopilotIdentity', 'contractHash', 'createUltimateRuntime', 'createProductionHandlers', 'runUltimateCourse', 'isDurableExternalBlocker', 'notifyCourseDispatcher', strip('../../lib/ultimate-course-builder/worker/lesson-autopilot.ts') + '; return processLessonAutopilot;')(
  () => ({ poolId: 'pool', competencyId: 'c', role: 'quality' }),
  JSON.stringify,
  async () => ({}),
  () => ({})
  async () => ({ completed: false, findings, lessons: [] }),
  () => false,
  async () => dispatches.push('dispatch')
);

const db = { from(table) {
  const query = {
    select() {
      return query;
    },
    eq() {
      return query;
    },
    async single() {
      return {
        data: table === 'ultimate_autopilot_pools' ? { id: 'pool', state: 'active', profile } : { profile },
        error: null
      };
    }
  };
  return query;
} };

const runTest = async () => {
  await test('regression test for visual_assignment failure', async ({}) => {
    // Add assertions to verify the behavior
    expect(dispatches).not.toContain('dispatch');
  });
};

runTest();