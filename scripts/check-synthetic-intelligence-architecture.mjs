import fs from 'node:fs';

const errors = [];
const notes = [];
const exists = (path) => fs.existsSync(path);
const read = (path) => fs.readFileSync(path, 'utf8');
const requireFile = (path) => {
  if (!exists(path)) errors.push(`missing required file: ${path}`);
};
const requireText = (path, token, label = token) => {
  if (!exists(path)) return errors.push(`missing required file: ${path}`);
  if (!read(path).includes(token)) errors.push(`${path} missing ${label}`);
};

for (const path of [
  'lib/ai/ai-service.ts',
  'lib/ai/agent-registry.ts',
  'lib/ai/orchestrator.ts',
  'lib/ai/runtime/command-executor.ts',
  'lib/ai/tools/registry.ts',
  'lib/ai/tools/planner.ts',
  'lib/ai/tools/executor.ts',
  'lib/platform/planner.ts',
  'lib/platform/orchestration/context-service.ts',
  'lib/platform/orchestration/evaluator.ts',
  'lib/workflows/engine.ts',
  'lib/workflows/action-policy.ts',
  'lib/devstudio/os/task-runner.ts',
  'apps/admin/app/api/devstudio/plan/route.ts',
]) requireFile(path);

if (exists('lib/platform/orchestration/agent-planner.ts')) {
  errors.push('duplicate high-level planner authority still exists: lib/platform/orchestration/agent-planner.ts');
}

requireText('lib/ai/tools/registry.ts', 'allowedAgents', 'agent tool permissions');
requireText('lib/ai/tools/registry.ts', 'allowedRoles', 'role tool permissions');
requireText('lib/ai/tools/registry.ts', 'approvalRequired', 'tool approval policy');
requireText('lib/ai/tools/registry.ts', 'idempotent', 'tool idempotency policy');
requireText('lib/ai/tools/registry.ts', 'retryAttempts', 'tool retry policy');
requireText('lib/ai/tools/registry.ts', 'audit', 'tool audit policy');

requireText('lib/platform/planner.ts', "'awaiting_approval'", 'approval-aware plan state');
requireText('lib/platform/planner.ts', 'verification_rule', 'plan verification contract');
requireText('apps/admin/app/api/devstudio/plan/route.ts', 'createAiTask', 'canonical persisted task execution');
requireText('apps/admin/app/api/devstudio/plan/route.ts', 'evaluateExecution', 'independent evaluation');
requireText('apps/admin/app/api/devstudio/plan/route.ts', 'persistPlan', 'plan checkpointing');
requireText('apps/admin/app/api/devstudio/plan/route.ts', 'loadSharedContext', 'shared context loading');
requireText('apps/admin/app/api/devstudio/plan/route.ts', 'runTaskExecution', 'safe retry/resume runtime');

for (const status of ['PASS', 'FAIL_RETRYABLE', 'FAIL_BLOCKING', 'REQUIRES_HUMAN_REVIEW']) {
  requireText('lib/platform/orchestration/evaluator.ts', status, `evaluator status ${status}`);
}

for (const source of ['ai_memory', 'ai_operational_memory', 'workflow_runs', 'workflow_step_logs']) {
  requireText('lib/platform/orchestration/context-service.ts', source, `shared context source ${source}`);
}
requireText('lib/platform/orchestration/context-service.ts', 'getRAGContext', 'RAG retrieval context');

requireText('lib/workflows/action-policy.ts', 'isWorkflowMutationTableAllowed', 'workflow mutation allowlist');
requireText('lib/workflows/action-policy.ts', 'validateWorkflowWebhookUrl', 'workflow webhook allowlist');
requireText('lib/workflows/tool-registry.ts', 'Compatibility facade only', 'compatibility-only workflow registry facade');
requireText('lib/workflows/engine.ts', 'isWorkflowMutationTableAllowed', 'workflow database mutation enforcement');
requireText('lib/workflows/engine.ts', 'validateWorkflowWebhookUrl', 'workflow outbound webhook enforcement');

requireText('lib/devstudio/os/task-runner.ts', "from('ai_tasks')", 'persisted agent tasks');
requireText('lib/devstudio/os/task-runner.ts', "from('ai_task_steps')", 'persisted agent task steps');
requireText('lib/devstudio/os/task-runner.ts', "from('ai_approvals')", 'human approval persistence');
requireText('lib/devstudio/os/task-runner.ts', "from('ai_memory')", 'task-result memory persistence');
requireText('lib/devstudio/os/task-runner.ts', 'writeDevAuditLog', 'agent audit logging');

requireText('.github/workflows/dev-studio-course-builder.yml', 'AI_PROVIDER: cloudflare', 'Cloudflare-first Course Builder preference');
requireText('lib/course-factory/publisher.ts', 'courseModule.orderIndex * 1000 + lesson.order', 'globally unique canonical lesson order');

const inferenceSignals = [
  'services/inference-gpu-worker',
  'lib/ai/providers/elevate.ts',
  'lib/ai/providers/elevate-provider.ts',
].filter(exists);
if (inferenceSignals.length) {
  notes.push(`self-hosted inference signal(s) detected: ${inferenceSignals.join(', ')}`);
} else {
  notes.push('self-hosted inference not yet on main; external inference remains behind canonical AI service while OpenHands work is in progress');
}

if (errors.length) {
  console.error('Synthetic intelligence architecture gate: FAIL');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Synthetic intelligence architecture gate: PASS');
for (const note of notes) console.log(`- ${note}`);
console.log('- canonical agent/tool runtime retained');
console.log('- planner now checkpoints and uses persisted ai_tasks');
console.log('- shared context composes existing memory/workflow/RAG authorities');
console.log('- evaluator and approval-aware plan state present');
console.log('- workflow primitives are governed separately from domain AI tools');
