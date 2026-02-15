
/**
 * Autopilot API Endpoint
 *
 * Provides API access to the autopilot worker
 * Can be called from anywhere in the application
 */

import type { Request, Response } from 'express';

// This will be imported dynamically to avoid build issues
let autopilotWorker: any = null;

async function getAutopilotWorker() {
  if (!autopilotWorker) {
    try {
      // Try to load the autopilot worker if it exists
      // This is optional and may not be present in all deployments
      const module = await import('../../workers/self-healing-autopilot.js');
      autopilotWorker = module.default || module;
    } catch (error) {
      return null;
    }
  }
  return autopilotWorker;
}

/**
 * GET /api/autopilot/status
 * Get autopilot status
 */
export async function getStatus(req: Request, res: Response) {
  try {
    const worker = await getAutopilotWorker();

    if (!worker) {
      return res.status(503).json({
        error: 'Autopilot worker not available',
      });
    }

    res.json({
      status: 'ok',
      running: worker.isRunning,
      config: {
        hasNetlifyToken: !!worker.config.NETLIFY_AUTH_TOKEN,
        hasSupabaseUrl: !!worker.config.VITE_SUPABASE_URL,
        hasStripeKey: !!worker.config.VITE_STRIPE_PUBLISHABLE_KEY,
        siteUrl: worker.config.VITE_SITE_URL || 'not set',
      },
    });
  } catch (error) { /* Error handled silently */ 
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
export async function triggerHealthCheck(req: Request, res: Response) {
  try {
    const worker = await getAutopilotWorker();

    if (!worker) {
      return res.status(503).json({
        error: 'Autopilot worker not available',
      });
    }

    const health = await worker.checkHealth();

    res.json({
      status: 'ok',
      health,
    });
  } catch (error) { /* Error handled silently */ 
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
export async function triggerSelfHeal(req: Request, res: Response) {
  try {
    const worker = await getAutopilotWorker();

    if (!worker) {
      return res.status(503).json({
        error: 'Autopilot worker not available',
      });
    }

    const success = await worker.selfHeal();

    res.json({
      status: 'ok',
      healed: success,
      message: success ? 'Self-heal successful' : 'Self-heal failed',
    });
  } catch (error) { /* Error handled silently */ 
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
export async function syncSecrets(req: Request, res: Response) {
  try {
    const worker = await getAutopilotWorker();

    if (!worker) {
      return res.status(503).json({
        error: 'Autopilot worker not available',
      });
    }

    const results = {
      github: await worker.syncToGitHub(),
      netlify: await worker.syncToNetlify(),
    };

    res.json({
      status: 'ok',
      synced: results,
      message: 'Secrets synced successfully',
    });
  } catch (error) { /* Error handled silently */ 
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
export async function startWorker(req: Request, res: Response) {
  try {
    const worker = await getAutopilotWorker();

    if (!worker) {
      return res.status(503).json({
        error: 'Autopilot worker not available',
      });
    }

    if (worker.isRunning) {
      return res.json({
        status: 'ok',
        message: 'Autopilot already running',
      });
    }

    await worker.start();

    res.json({
      status: 'ok',
      message: 'Autopilot started successfully',
    });
  } catch (error) { /* Error handled silently */ 
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
export async function stopWorker(req: Request, res: Response) {
  try {
    const worker = await getAutopilotWorker();

    if (!worker) {
      return res.status(503).json({
        error: 'Autopilot worker not available',
      });
    }

    worker.stop();

    res.json({
      status: 'ok',
      message: 'Autopilot stopped successfully',
    });
  } catch (error) { /* Error handled silently */ 
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
