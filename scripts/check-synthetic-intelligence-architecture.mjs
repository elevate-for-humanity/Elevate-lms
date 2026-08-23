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
  'lib/ai/providers/elevate.ts',
  'lib/ai/providers/cloudflare.ts',
  'lib/ai/providers/structured-output.ts',
  'lib/platform/planner.ts',
  'lib/platform/orchestration/context-service.ts',
  'lib/platform/orchestration/evaluator.ts',
  'lib/workflows/engine.ts',
  'lib/workflows/action-policy.ts',
  'lib/devstudio/os/task-runner.ts',
  'lib/devstudio/openhands/client.ts',
  'lib/devstudio/openhands/runtime.ts',
  'lib/devstudio/openhands/github-verifier.ts',
  'apps/admin/app/api/devstudio/openhands/chat/route.ts',
  'apps/admin/app/api/devstudio/openhands/agent/route.ts',
  'apps/admin/app/api/devstudio/plan/route.ts',
  'services/llm-gpu-worker/Dockerfile',
  'services/llm-gpu-worker/entrypoint.sh',
  'scripts/northflank/provision-llm-worker.ts',
]) requireFile(path);

if (exists('lib/platform/orchestration/agent-planner.ts')) {
  errors.push('duplicate high-level planner authority still exists: lib/platform/orchestration/agent-planner.ts');
}

requireText('lib/ai/ai-service.ts', "elevate: () => new ElevateProvider()", 'self-hosted Elevate provider registration');
requireText('lib/ai/ai-service.ts', "['elevate', 'cloudflare', 'groq', 'gemini', 'google', 'anthropic', 'azure', 'openai']", 'self-hosted/free-first provider order');
requireText('lib/ai/ai-service.ts', 'AI_PROVIDER_ORDER', 'configurable provider ordering');
requireText('lib/ai/providers/elevate.ts', 'ELEVATE_LLM_URL', 'self-hosted inference endpoint configuration');
requireText('lib/ai/providers/elevate.ts', 'ELEVATE_LLM_SECRET', 'self-hosted inference bearer secret');
requireText('lib/ai/providers/elevate.ts', '/v1/chat/completions', 'OpenAI-compatible self-hosted inference API');
requireText('lib/ai/providers/elevate.ts', 'normalizeStructuredOutput', 'self-hosted structured output normalization');
requireText('lib/ai/providers/cloudflare.ts', 'normalizeStructuredOutput', 'Cloudflare structured output normalization');
requireText('lib/ai/providers/structured-output.ts', 'extractBalancedJson', 'structured JSON extraction');
requireText('lib/ai/providers/structured-output.ts', 'escapeLiteralControlsInStrings', 'structured JSON control-character repair');
requireText('services/llm-gpu-worker/entrypoint.sh', 'vllm', 'vLLM runtime');
requireText('scripts/northflank/provision-llm-worker.ts', 'ELEVATE_LLM_URL', 'Northflank LLM URL wiring');
requireText('scripts/northflank/provision-llm-worker.ts', 'ELEVATE_LLM_SECRET', 'Northflank LLM secret wiring');

requireText('lib/ai/tools/registry.ts', 'allowedAgents', 'agent tool permissions');
requireText('lib/ai/tools/registry.ts', 'allowedRoles', 'role tool permissions');
requireText('lib/ai/tools/registry.ts', 'approvalRequired', 'tool approval policy');
requireText('lib/ai/tools/registry.ts', 'idempotent', 'tool idempotency policy');
requireText('lib/ai/tools/registry.ts', 'retryAttempts', 'tool retry policy');
requireText('lib/ai/tools/registry.ts', 'audit', 'tool audit policy');
requireText('lib/ai/tools/registry.ts', "name: 'openhands.execute'", 'governed OpenHands execution tool');
requireText('lib/ai/tools/registry.ts', "name: 'openhands.status'", 'governed OpenHands status tool');
requireText('lib/ai/tools/registry.ts', 'CONFIRM OPENHANDS EXECUTION', 'OpenHands human approval boundary');
requireText('lib/ai/tools/planner.ts', "name: 'openhands.execute'", 'engineering delegation to OpenHands');
requireText('lib/ai/tools/planner.ts', "name: 'courses.generate'", 'Course Builder remains outside OpenHands');
requireText('lib/ai/tools/executor.ts', "status: 'accepted'", 'asynchronous governed tool status');
requireText('lib/ai/runtime/command-executor.ts', "status: 'running'", 'async command lifecycle');

requireText('lib/devstudio/openhands/client.ts', '/api/v1/app-conversations', 'current OpenHands Cloud V1 API');
requireText('lib/devstudio/openhands/client.ts', 'start-tasks?ids=', 'OpenHands startup polling');
requireText('lib/devstudio/openhands/client.ts', 'execution_status', 'OpenHands execution polling');
requireText('lib/devstudio/openhands/client.ts', '/send-message', 'OpenHands V1 conversation continuation');
requireText('lib/devstudio/openhands/client.ts', "'X-Access-Token'", 'OpenHands V1 access-token authentication');
requireText('lib/devstudio/openhands/client.ts', 'llm_model', 'OpenHands configured model selection');
requireText('lib/devstudio/openhands/client.ts', 'OPENHANDS_API_KEY', 'server-side OpenHands API key');
requireText('lib/devstudio/openhands/client.ts', 'configured allowlist', 'OpenHands repository allowlist');
requireText('lib/devstudio/openhands/runtime.ts', "from('ai_tasks')", 'OpenHands canonical ai_tasks persistence');
requireText('lib/devstudio/openhands/runtime.ts', "from('ai_task_steps')", 'OpenHands canonical task steps');
requireText('lib/devstudio/openhands/runtime.ts', "from('ai_memory')", 'OpenHands validated memory persistence');
requireText('lib/devstudio/openhands/runtime.ts', 'verifyOpenHandsGitHubOutcome', 'independent GitHub verification');
requireText('lib/devstudio/openhands/runtime.ts', 'REQUIRES_HUMAN_REVIEW', 'OpenHands verification approval fallback');
requireText('lib/devstudio/openhands/github-verifier.ts', '/pulls/', 'OpenHands PR verification');
requireText('lib/devstudio/openhands/github-verifier.ts', '/check-runs', 'OpenHands CI verification');
requireText('apps/admin/app/api/devstudio/openhands/chat/route.ts', 'sendOpenHandsMessage', 'thin V1 chat continuation route');
requireText('apps/admin/app/api/devstudio/openhands/chat/route.ts', 'continuationSupported: true', 'OpenHands V1 continuation capability');
requireText('apps/admin/app/api/devstudio/openhands/agent/route.ts', 'dispatchOpenHandsTask', 'thin governed OpenHands execution route');
requireText('apps/admin/app/api/devstudio/openhands/agent/route.ts', 'refreshOpenHandsTask', 'OpenHands status lifecycle route');

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
requireText('lib/devstudio/os/task-runner.ts', "result.status === 'running'", 'async task preservation');

requireText('lib/course-factory/publisher.ts', 'courseModule.orderIndex * 1000 + lesson.order', 'globally unique canonical lesson order');

if (errors.length) {
  console.error('Synthetic intelligence architecture gate: FAIL');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Synthetic intelligence architecture gate: PASS');
console.log('- self-hosted Elevate/vLLM inference is present and registered first');
console.log('- external providers remain fallback paths behind the canonical AI service');
console.log('- structured JSON output is normalized for Cloudflare and Elevate open-model paths');
console.log('- canonical agent/tool runtime retained');
console.log('- planner checkpoints and uses persisted ai_tasks');
console.log('- shared context composes existing memory/workflow/RAG authorities');
console.log('- evaluator and approval-aware plan state present');
console.log('- OpenHands uses current Cloud V1 API, follow-up messaging, and configured model selection through one canonical server client');
console.log('- OpenHands engineering runs are governed, persisted, asynchronous, and independently verified through GitHub');
console.log('- Course Builder remains on the normal inference path, not the OpenHands engineering path');
console.log('- workflow primitives are governed separately from domain AI tools');
