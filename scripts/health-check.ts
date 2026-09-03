import axios from 'axios';
/**
 * Automated Health Check Script
 * Monitors Open LMS and all services
 * Runs every 5 minutes via cron
 */

import { createClient } from '@supabase/supabase-js';

interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  message: string;
  timestamp: Date;
}

class HealthCheckService {
  private openLms: any; // OpenLMSService;
  private supabase: any;
  private slackWebhook: string;

  constructor() {
    // this.openLms = new OpenLMSService({
    //   url: process.env.OPEN_LMS_URL || '',
    //   token: process.env.OPEN_LMS_TOKEN || '',
    // });

    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    );

    this.slackWebhook = process.env.SLACK_WEBHOOK || '';
  }

  /**
   * Check Open LMS health
   */
  async checkOpenLMS(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const siteInfo = await this.openLms.getSiteInfo();
      const responseTime = Date.now() - startTime;

      // Check response time
      if (responseTime > 5000) {
        return {
          service: 'Open LMS',
          status: 'degraded',
          responseTime,
          message: `Slow response time: ${responseTime}ms`,
          timestamp: new Date(),
        };
      }

      return {
        service: 'Open LMS',
        status: 'healthy',
        responseTime,
        message: `Connected to ${siteInfo.sitename}`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        service: 'Open LMS',
        status: 'down',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check Supabase health
   */
  async checkSupabase(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      // Simple query to check database connectivity
      const { data, error } = await this.supabase
        .from('health_check')
        .select('*')
        .limit(1);

      if (error) throw error;

      const responseTime = Date.now() - startTime;

      return {
        service: 'Supabase',
        status: 'healthy',
        responseTime,
        message: 'Database connection successful',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        service: 'Supabase',
        status: 'down',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check frontend health
   */
  async checkFrontend(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const response = await axios.get('https://www.elevateforhumanity.org', {
        timeout: 10000,
      });

      const responseTime = Date.now() - startTime;

      if (response.status !== 200) {
        return {
          service: 'Frontend',
          status: 'degraded',
          responseTime,
          message: `HTTP ${response.status}`,
          timestamp: new Date(),
        };
      }

      return {
        service: 'Frontend',
        status: 'healthy',
        responseTime,
        message: 'Site is accessible',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        service: 'Frontend',
        status: 'down',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check API health
   */
  async checkAPI(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const response = await axios.get(
        'https://api.www.elevateforhumanity.org/health',
        {
          timeout: 5000,
        }
      );

      const responseTime = Date.now() - startTime;

      return {
        service: 'API',
        status: 'healthy',
        responseTime,
        message: 'API is responding',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        service: 'API',
        status: 'down',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send alert to Slack
   */
  async sendAlert(status: HealthStatus): Promise<void> {
    if (!this.slackWebhook) {
      return;
    }

    const emoji =
      status.status === 'healthy'
        ? '✅'
        : status.status === 'degraded'
          ? '⚠️'
          : '🚨';
    const color =
      status.status === 'healthy'
        ? 'good'
        : status.status === 'degraded'
          ? 'warning'
          : 'danger';

    try {
      await axios.post(this.slackWebhook, {
        text: `${emoji} ${status.service} Health Check`,
        attachments: [
          {
            color,
            fields: [
              {
                title: 'Status',
                value: status.status.toUpperCase(),
                short: true,
              },
              {
                title: 'Response Time',
                value: `${status.responseTime}ms`,
                short: true,
              },
              {
                title: 'Message',
                value: status.message,
                short: false,
              },
              {
                title: 'Timestamp',
                value: status.timestamp.toISOString(),
                short: false,
              },
            ],
          },
        ],
      });
    } catch (error) {
    }
  }

  /**
   * Log health status to database
   */
  async logStatus(status: HealthStatus): Promise<void> {
    try {
      await this.supabase.from('health_logs').insert({
        service: status.service,
        status: status.status,
        response_time: status.responseTime,
        message: status.message,
        timestamp: status.timestamp.toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Run all health checks
   */
  async runAllChecks(): Promise<void> {

    const checks = [
      this.checkOpenLMS(),
      this.checkSupabase(),
      this.checkFrontend(),
      this.checkAPI(),
    ];

    const results = await Promise.all(checks);

    // Display results
    results.forEach((status) => {
      const emoji =
        status.status === 'healthy'
          ? '✅'
          : status.status === 'degraded'
            ? '⚠️'
            : '❌';
        console.log(
          `${emoji} ${status.service}: ${status.status} (${status.responseTime}ms)`
        );
    });

    // Send alerts for unhealthy services
    const unhealthyServices = results.filter((s) => s.status !== 'healthy');

    if (unhealthyServices.length > 0) {

      for (const status of unhealthyServices) {
        await this.sendAlert(status);
        await this.logStatus(status);
      }
    } else {
    }

    // Calculate overall health
    const overallHealth = results.every((s) => s.status === 'healthy')
      ? 'healthy'
      : results.some((s) => s.status === 'down')
        ? 'critical'
        : 'degraded';


    // Exit with error code if critical
    if (overallHealth === 'critical') {
      process.exit(1);
    }
  }
}

// Run health checks
const healthCheck = new HealthCheckService();
healthCheck.runAllChecks().catch((error) => {
  process.exit(1);
});
