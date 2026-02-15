import { logger } from '@/lib/logger';
/**
 * Advanced Autopilot - Environment Sync Orchestrator
 * Instructs the deployment worker to sync all environment variables
 */

export interface AutopilotInstruction {
  action: 'sync-env' | 'verify-env' | 'update-env';
  target: 'netlify';
  priority: 'high' | 'medium' | 'low';
  params?: Record<string, any>;
}

export interface AutopilotResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
}

/**
 * Instruct deployment worker to sync all environment variables
 */
export async function instructEnvSync(): Promise<AutopilotResult> {
  try {
    const autopilotSecret = process.env.AUTOPILOT_SECRET;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (!autopilotSecret) {
      return {
        success: false,
        error: 'AUTOPILOT_SECRET not configured',
        message: 'Cannot instruct worker without autopilot secret',
        timestamp: new Date().toISOString(),
      };
    }

    // Instruct the deployment worker
    const response = await fetch(`${siteUrl}/api/autopilot/sync-env`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${autopilotSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instruction: 'sync-all-env-vars',
        source: 'netlify-api',
        target: 'local-env',
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Worker responded with ${response.status}`,
        message: 'Failed to instruct worker',
        timestamp: new Date().toISOString(),
      };
    }

    const result = await response.json();

    return {
      success: true,
      message: 'Worker successfully synced environment variables',
      data: result,
      timestamp: new Date().toISOString(),
    };

  } catch (error) { /* Error handled silently */ 
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to communicate with worker',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Verify environment variables are synced
 */
export async function verifyEnvSync(): Promise<AutopilotResult> {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const response = await fetch(`${siteUrl}/api/autopilot/sync-env`, {
      method: 'GET',
    });

    if (!response.ok) {
      return {
        success: false,
        error: 'Worker not responding',
        message: 'Cannot verify worker status',
        timestamp: new Date().toISOString(),
      };
    }

    const status = await response.json();

    return {
      success: true,
      message: 'Worker is active and ready',
      data: status,
      timestamp: new Date().toISOString(),
    };

  } catch (error) { /* Error handled silently */ 
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to verify worker',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Download synced environment variables
 */
export async function downloadEnvFile(autopilotSecret: string): Promise<string | null> {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const response = await fetch(`${siteUrl}/api/autopilot/sync-env`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${autopilotSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.envContent || null;

  } catch (error) { /* Error handled silently */ 
    logger.error('Failed to download env file:', error);
    return null;
  }
}
