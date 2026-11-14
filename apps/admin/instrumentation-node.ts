import 'server-only';

import { startAgenticExecutor } from '../../lib/agentic/executor';
import { startAdminVideoWorker } from '../../lib/video/background-worker';

export function startAdminAgenticExecutor(): void {
  // Northflank's canonical service configurator historically exposed
  // SERVICE_ROLE. Normalize it before entering the shared executor so there
  // is one runtime authority while older deployments roll forward safely.
  process.env.ELEVATE_SERVICE = 'admin';
  startAgenticExecutor();
  startAdminVideoWorker();
  process.env.ELEVATE_AGENTIC_EXECUTOR_STARTED = 'true';
}
