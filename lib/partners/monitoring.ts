// lib/partners/monitoring.ts
// Monitoring and alerting for partner integrations

import { PartnerType } from './base';

export interface PartnerMetrics {
  partner: PartnerType;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastError?: {
    message: string;
    timestamp: string;
    statusCode?: number;
  };
}

export interface PartnerHealthCheck {
  partner: PartnerType;
  healthy: boolean;
  lastChecked: string;
  responseTime?: number;
  error?: string;
}

class PartnerMonitoring {
  private metrics: Map<PartnerType, PartnerMetrics> = new Map();
  private requestTimes: Map<string, number> = new Map();

  startRequest(partner: PartnerType, requestId: string): void {
    this.requestTimes.set(requestId, Date.now());
  }

  endRequest(
    partner: PartnerType,
    requestId: string,
    success: boolean,
    error?: any
  ): void {
    const startTime = this.requestTimes.get(requestId);
    if (!startTime) return;

    const responseTime = Date.now() - startTime;
    this.requestTimes.delete(requestId);

    const metrics = this.getOrCreateMetrics(partner);
    metrics.totalRequests++;

    if (success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
      if (error) {
        metrics.lastError = {
          message:
            'Operation failed',
          timestamp: new Date().toISOString(),
          statusCode: error.statusCode,
        };
      }
    }

    // Update average response time
    const totalTime =
      metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime;
    metrics.averageResponseTime = totalTime / metrics.totalRequests;
  }

  private getOrCreateMetrics(partner: PartnerType): PartnerMetrics {
    if (!this.metrics.has(partner)) {
      this.metrics.set(partner, {
        partner,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
      });
    }
    return this.metrics.get(partner)!;
  }

  getMetrics(partner: PartnerType): PartnerMetrics | undefined {
    return this.metrics.get(partner);
  }

  getAllMetrics(): PartnerMetrics[] {
    return Array.from(this.metrics.values());
  }

  getErrorRate(partner: PartnerType): number {
    const metrics = this.metrics.get(partner);
    if (!metrics || metrics.totalRequests === 0) return 0;
    return metrics.failedRequests / metrics.totalRequests;
  }

  shouldAlert(partner: PartnerType): boolean {
    const errorRate = this.getErrorRate(partner);
    const metrics = this.metrics.get(partner);

    // Alert if error rate > 50% and at least 10 requests
    if (metrics && metrics.totalRequests >= 10 && errorRate > 0.5) {
      return true;
    }

    // Alert if average response time > 10 seconds
    if (metrics && metrics.averageResponseTime > 10000) {
      return true;
    }

    return false;
  }

  async sendAlert(partner: PartnerType, message: string): Promise<void> {
    // Error logged

    // Send to monitoring service (Sentry, Slack, etc.)
    if (process.env.SENTRY_DSN) {
      // Sentry integration would go here
    }

    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Partner Integration Alert: ${partner}`,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Partner:* ${partner}\n*Message:* ${message}`,
                },
              },
            ],
          }),
        });
      } catch (error) {
        // Error: $1
      }
    }
  }

  reset(partner?: PartnerType): void {
    if (partner) {
      this.metrics.delete(partner);
    } else {
      this.metrics.clear();
    }
  }
}

export const partnerMonitoring = new PartnerMonitoring();

/**
 * Decorator to monitor partner API calls
 */
export function monitorPartnerCall(
  partner: PartnerType,
  operation: string
): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const requestId = `${partner}_${operation}_${Date.now()}`;
      partnerMonitoring.startRequest(partner, requestId);

      try {
        const result = await originalMethod.apply(this, args);
        partnerMonitoring.endRequest(partner, requestId, true);
        return result;
      } catch (error) {
        partnerMonitoring.endRequest(partner, requestId, false, error);

        if (partnerMonitoring.shouldAlert(partner)) {
          await partnerMonitoring.sendAlert(
            partner,
            `High error rate detected for ${operation}`
          );
        }

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Health check for partner API
 */
export async function checkPartnerHealth(
  partner: PartnerType
): Promise<PartnerHealthCheck> {
  const startTime = Date.now();

  try {
    // Attempt a simple API call to check connectivity
    // This would be partner-specific
    const responseTime = Date.now() - startTime;

    return {
      partner,
      healthy: true,
      lastChecked: new Date().toISOString(),
      responseTime,
    };
  } catch (error) { /* Error handled silently */ 
    return {
      partner,
      healthy: false,
      lastChecked: new Date().toISOString(),
      error: 'Operation failed',
    };
  }
}
