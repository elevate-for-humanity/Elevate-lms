/**
 * Autopilot API Endpoint
 *
 * Provides API access to the autopilot worker
 * Can be called from anywhere in the application
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AutopilotWorker = any;

// This will be imported dynamically to avoid build issues
let autopilotWorker: AutopilotWorker | null = null;

async function getAutopilotWorker(): Promise<AutopilotWorker | null> {
  if (!autopilotWorker) {
    try {
      // Try to load the autopilot worker if it exists
      // This is optional and may not be present in all deployments
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const workerModule = require('../../workers/self-healing-autopilot.js');
      autopilotWorker = workerModule.default || workerModule;
    } catch {
      // Module not available - return null
      return null;
    }
  }
  return autopilotWorker;
}

/**
 * GET /api/autopilot/status
 * Get autopilot status
 */
export async function getStatus(_req: unknown, res: { status: (code: number) => { json: (obj: unknown) => unknown }; json: (obj: unknown) => unknown }): Promise<void> {
  try {
    const worker = await getAutopilotWorker();

    if (!worker) {
      res.status(503).json({
        error: 'Autopilot worker not available',
      });
      return;
    }

    res.json({
      status: 'ok',
      running: worker.isRunning,
      config: {
        hasNorthflankAccess: !!worker.config?.NORTHFLANK_API_TOKEN,
        hasSupabaseUrl: !!worker.config?.VITE_SUPABASE_URL,
        hasStripeKey: !!worker.config?.VITE_STRIPE_PUBLISHABLE_KEY,
        siteUrl: worker.config?.VITE_SITE_URL || 'not set',
      },
    });
  } catch {
    res.status(500).json({
      error: 'Failed to get autopilot status',
      message: 'Operation failed',
    });
  }
}

/**
 * POST /api/autopilot/health-check
 * Trigger manual health check
 */
export async function triggerHealthCheck(_req: unknown, res: { status: (code: number) => { json: (obj: unknown) => unknown }; json: (obj: unknown) => unknown }): Promise<void> {
  try {
    const worker = await getAutopilotWorker();

    if (!worker) {
      res.status(503).json({
        error: 'Autopilot worker not available',
      });
      return;
    }

    const health = await worker.checkHealth();

    res.json({
      status: 'ok',
      health,
    });
  } catch {
    res.status(500).json({
      error: 'Health check failed',
      message: 'Operation failed',
    });
  }
}

/**
 * POST /api/autopilot/self-heal
 * Trigger manual self-heal
 */
export async function triggerSelfHeal(_req: unknown, res: { status: (code: number) => { json: (obj: unknown) => unknown }; json: (obj: unknown) => unknown }): Promise<void> {
  try {
    const worker = await getAutopilotWorker();

    if (!worker) {
      res.status(503).json({
        error: 'Autopilot worker not available',
      });
      return;
    }

    const success = await worker.selfHeal();

    res.json({
      status: 'ok',
      healed: success,
      message: success ? 'Self-heal successful' : 'Self-heal failed',
    });
  } catch {
    res.status(500).json({
      error: 'Self-heal failed',
      message: 'Operation failed',
    });
  }
}

/**
 * POST /api/autopilot/sync-secrets
 * Sync secrets to GitHub and deployment platform
 */
export async function syncSecrets(_req: unknown, res: { status: (code: number) => { json: (obj: unknown) => unknown }; json: (obj: unknown) => unknown }): Promise<void> {
  try {
    const worker = await getAutopilotWorker();

    if (!worker) {
      res.status(503).json({
        error: 'Autopilot worker not available',
      });
      return;
    }

    const results = {
      github: await worker.syncToGitHub(),
    };

    res.json({
      status: 'ok',
      synced: results,
      message: 'Secrets synced successfully',
    });
  } catch {
    res.status(500).json({
      error: 'Secret sync failed',
      message: 'Operation failed',
    });
  }
}

/**
 * POST /api/autopilot/start
 * Start the autopilot worker
 */
export async function startWorker(_req: unknown, res: { status: (code: number) => { json: (obj: unknown) => unknown }; json: (obj: unknown) => unknown }): Promise<void> {
  try {
    const worker = await getAutopilotWorker();

    if (!worker) {
      res.status(503).json({
        error: 'Autopilot worker not available',
      });
      return;
    }

    if (worker.isRunning) {
      res.json({
        status: 'ok',
        message: 'Autopilot already running',
      });
      return;
    }

    await worker.start();

    res.json({
      status: 'ok',
      message: 'Autopilot started successfully',
    });
  } catch {
    res.status(500).json({
      error: 'Failed to start autopilot',
      message: 'Operation failed',
    });
  }
}

/**
 * POST /api/autopilot/stop
 * Stop the autopilot worker
 */
export async function stopWorker(_req: unknown, res: { status: (code: number) => { json: (obj: unknown) => unknown }; json: (obj: unknown) => unknown }): Promise<void> {
  try {
    const worker = await getAutopilotWorker();

    if (!worker) {
      res.status(503).json({
        error: 'Autopilot worker not available',
      });
      return;
    }

    worker.stop();

    res.json({
      status: 'ok',
      message: 'Autopilot stopped successfully',
    });
  } catch {
    res.status(500).json({
      error: 'Failed to stop autopilot',
      message: 'Operation failed',
    });
  }
}

// Export all handlers
export default {
  getStatus,
  triggerHealthCheck,
  triggerSelfHeal,
  syncSecrets,
  startWorker,
  stopWorker,
};
