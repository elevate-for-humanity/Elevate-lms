/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/**
 * URL Health Monitoring System
 * Automatically checks all URLs before providing them to users
 * Detects broken links, dead services, and non-functional endpoints
 */

import { logger } from '@/lib/logger';

interface URLCheck {
  url: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  statusCode?: number;
  responseTime?: number;
  lastChecked: Date;
  errorMessage?: string;
}

interface ServiceEndpoint {
  id: string;
  name: string;
  url: string;
  type: 'api' | 'page' | 'service' | 'external';
  critical: boolean;
  checkInterval: number; // milliseconds
  timeout: number; // milliseconds
  expectedStatus?: number[];
  healthCheck?: () => Promise<boolean>;
}

export class URLHealthMonitor {
  private static instance: URLHealthMonitor;
  private endpoints: Map<string, ServiceEndpoint> = new Map();
  private healthStatus: Map<string, URLCheck> = new Map();
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.initializeEndpoints();
  }

  static getInstance(): URLHealthMonitor {
    if (!URLHealthMonitor.instance) {
      URLHealthMonitor.instance = new URLHealthMonitor();
    }
    return URLHealthMonitor.instance;
  }

  private initializeEndpoints(): void {
    // Critical internal services
    this.addEndpoint({
      id: 'api-health',
      name: 'API Health Check',
      url: '/api/health',
      type: 'api',
      critical: true,
      checkInterval: 60000, // 1 minute
      timeout: 5000,
      expectedStatus: [200],
    });

    this.addEndpoint({
      id: 'api-compliance',
      name: 'Compliance API',
      url: '/api/compliance/check',
      type: 'api',
      critical: true,
      checkInterval: 300000, // 5 minutes
      timeout: 10000,
      expectedStatus: [200],
    });

    // External partner services
    this.addEndpoint({
      id: 'sam-gov',
      name: 'SAM.gov API',
      url: 'https://api.sam.gov/entity-information/v3/entities',
      type: 'external',
      critical: false,
      checkInterval: 3600000, // 1 hour
      timeout: 15000,
      expectedStatus: [200, 401], // 401 is ok, means API is up but needs auth
    });

    this.addEndpoint({
      id: 'dol-api',
      name: 'DOL API',
      url: 'https://api.dol.gov/V1/Statistics/OES',
      type: 'external',
      critical: false,
      checkInterval: 3600000,
      timeout: 15000,
      expectedStatus: [200, 401],
    });

    this.addEndpoint({
      id: 'indiana-dwd',
      name: 'Indiana DWD',
      url: 'https://www.in.gov/dwd/',
      type: 'external',
      critical: false,
      checkInterval: 3600000,
      timeout: 10000,
      expectedStatus: [200],
    });

    // Preview/development server
    this.addEndpoint({
      id: 'dev-server',
      name: 'Development Server',
      url: 'https://3000--0199d539-243f-773a-8115-cecbe99de420.us-east-1-01.gitpod.dev',
      type: 'service',
      critical: true,
      checkInterval: 30000, // 30 seconds
      timeout: 5000,
      expectedStatus: [200],
    });

    // Sister sites
    this.addEndpoint({
      id: 'elevate-connects',
      name: 'Elevate for Humanity',
      url: 'https://www.elevateforhumanity.org',
      type: 'external',
      critical: false,
      checkInterval: 3600000,
      timeout: 10000,
      expectedStatus: [200],
    });

    this.addEndpoint({
      id: 'selfish-inc',
      name: 'Selfish Inc Support',
      url: 'https://www.selfishincsupport.org',
      type: 'external',
      critical: false,
      checkInterval: 3600000,
      timeout: 10000,
      expectedStatus: [200],
    });

    this.addEndpoint({
      id: 'rise-forward',
      name: 'Rise Forward Foundation',
      url: 'https://www.riseforwardfoundation.org',
      type: 'external',
      critical: false,
      checkInterval: 3600000,
      timeout: 10000,
      expectedStatus: [200],
    });
  }

  private addEndpoint(endpoint: ServiceEndpoint): void {
    this.endpoints.set(endpoint.id, endpoint);
  }

  /**
   * Check if a URL is healthy before providing it
   */
  async checkURL(url: string): Promise<URLCheck> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ElevateForHumanity-HealthCheck/1.0',
        },
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      const check: URLCheck = {
        url,
        status: response.ok ? 'healthy' : 'degraded',
        statusCode: response.status,
        responseTime,
        lastChecked: new Date(),
      };

      this.healthStatus.set(url, check);
      return check;
    } catch (error) { /* Error handled silently */ 
      const check: URLCheck = {
        url,
        status: 'down',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        errorMessage: 'Operation failed',
      };

      this.healthStatus.set(url, check);
      return check;
    }
  }

  /**
   * Check specific endpoint
   */
  async checkEndpoint(endpointId: string): Promise<URLCheck> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointId} not found`);
    }

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);

      const response = await fetch(endpoint.url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ElevateForHumanity-HealthCheck/1.0',
        },
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      const isExpectedStatus = endpoint.expectedStatus
        ? endpoint.expectedStatus.includes(response.status)
        : response.ok;

      const check: URLCheck = {
        url: endpoint.url,
        status: isExpectedStatus ? 'healthy' : 'degraded',
        statusCode: response.status,
        responseTime,
        lastChecked: new Date(),
      };

      this.healthStatus.set(endpointId, check);
      return check;
    } catch (error) { /* Error handled silently */ 
      const check: URLCheck = {
        url: endpoint.url,
        status: 'down',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        errorMessage: 'Operation failed',
      };

      this.healthStatus.set(endpointId, check);

      // Alert if critical service is down
      if (endpoint.critical) {
        this.alertCriticalServiceDown(endpoint, check);
      }

      return check;
    }
  }

  /**
   * Check all endpoints
   */
  async checkAllEndpoints(): Promise<Map<string, URLCheck>> {
    const checks = new Map<string, URLCheck>();

    for (const [id, endpoint] of this.endpoints) {
      try {
        const check = await this.checkEndpoint(id);
        checks.set(id, check);
      } catch (error) { /* Error handled silently */ 
        logger.error(`Error checking endpoint ${id}`, error as Error, { endpointId: id });
      }
    }

    return checks;
  }

  /**
   * Get safe URL - only returns URL if it's healthy
   */
  async getSafeURL(endpointId: string): Promise<string | null> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      return null;
    }

    // Check if we have recent health data
    const cachedCheck = this.healthStatus.get(endpointId);
    if (cachedCheck && Date.now() - cachedCheck.lastChecked.getTime() < 60000) {
      // Use cached data if less than 1 minute old
      return cachedCheck.status === 'healthy' ? endpoint.url : null;
    }

    // Perform fresh check
    const check = await this.checkEndpoint(endpointId);
    return check.status === 'healthy' ? endpoint.url : null;
  }

  /**
   * Get URL with fallback
   */
  async getURLWithFallback(
    primaryId: string,
    fallbackId: string
  ): Promise<string | null> {
    const primaryURL = await this.getSafeURL(primaryId);
    if (primaryURL) {
      return primaryURL;
    }

    logger.warn(
      `Primary endpoint ${primaryId} is down, using fallback ${fallbackId}`,
      { primaryId, fallbackId }
    );
    return await this.getSafeURL(fallbackId);
  }

  /**
   * Alert when critical service is down
   */
  private alertCriticalServiceDown(
    endpoint: ServiceEndpoint,
    check: URLCheck
  ): void {
    logger.error(`🚨 CRITICAL SERVICE DOWN: ${endpoint.name}`, new Error(check.errorMessage || 'Unknown error'), {
      endpointName: endpoint.name,
      url: endpoint.url,
      statusCode: check.statusCode || 'No response',
      errorMessage: check.errorMessage || 'Unknown error'
    });

    // In production, send alerts via email, Slack, PagerDuty, etc.
    this.sendAlert({
      severity: 'critical',
      service: endpoint.name,
      url: endpoint.url,
      status: check.status,
      error: check.errorMessage,
    });
  }

  /**
   * Send alert (implement with your alerting system)
   */
  private async sendAlert(alert: { type: string; severity: string; endpoint: string; message: string; timestamp: Date; error?: string }): Promise<void> {
    // Implement alerting logic here
    // Examples: Email, Slack, PagerDuty, Discord, etc.
    logger.info('ALERT', alert);
  }

  /**
   * Start monitoring all endpoints
   */
  startMonitoring(): void {
    logger.info('🔍 Starting URL health monitoring');

    for (const [id, endpoint] of this.endpoints) {
      // Initial check
      this.checkEndpoint(id);

      // Schedule periodic checks
      const interval = setInterval(() => {
        this.checkEndpoint(id);
      }, endpoint.checkInterval);

      this.checkIntervals.set(id, interval);
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    for (const [id, interval] of this.checkIntervals) {
      clearInterval(interval);
    }
    this.checkIntervals.clear();
  }

  /**
   * Get health dashboard data
   */
  getHealthDashboard() {
    const endpoints = Array.from(this.endpoints.values());
    const checks = Array.from(this.healthStatus.entries());

    const healthy = checks.filter(([_, c]) => c.status === 'healthy').length;
    const degraded = checks.filter(([_, c]) => c.status === 'degraded').length;
    const down = checks.filter(([_, c]) => c.status === 'down').length;

    return {
      summary: {
        total: endpoints.length,
        healthy,
        degraded,
        down,
        healthRate: (healthy / endpoints.length) * 100,
      },
      endpoints: endpoints.map((e) => ({
        id: e.id,
        name: e.name,
        url: e.url,
        type: e.type,
        critical: e.critical,
        status: this.healthStatus.get(e.id),
      })),
      lastUpdated: new Date(),
    };
  }

  /**
   * Validate URL before displaying to user
   */
  async validateBeforeDisplay(
    url: string
  ): Promise<{ valid: boolean; message?: string }> {
    const check = await this.checkURL(url);

    if (check.status === 'healthy') {
      return { valid: true };
    }

    if (check.status === 'down') {
      return {
        valid: false,
        message: `This service is currently unavailable. Please try again later or contact support.`,
      };
    }

    if (check.status === 'degraded') {
      return {
        valid: true,
        message: `This service may be experiencing issues. Response time: ${check.responseTime}ms`,
      };
    }

    return {
      valid: false,
      message: 'Unable to verify service availability.',
    };
  }

  /**
   * Get all broken links on the site
   */
  async findBrokenLinks(): Promise<string[]> {
    const brokenLinks: string[] = [];

    // Check all links in the document
    const links = document.querySelectorAll('a[href]');

    for (const link of Array.from(links)) {
      const href = link.getAttribute('href');
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')
      ) {
        continue;
      }

      const fullURL = href.startsWith('http')
        ? href
        : new URL(href, window.location.origin).href;
      const check = await this.checkURL(fullURL);

      if (check.status === 'down') {
        brokenLinks.push(fullURL);
      }
    }

    return brokenLinks;
  }

  /**
   * Auto-fix broken links
   */
  async autoFixBrokenLinks(): Promise<void> {
    const brokenLinks = await this.findBrokenLinks();

    for (const brokenURL of brokenLinks) {
      // Find all elements with this URL
      const elements = document.querySelectorAll(`a[href="${brokenURL}"]`);

      elements.forEach((element) => {
        // Add warning indicator
        element.classList.add('broken-link');
        element.setAttribute('title', 'This link may not be working');

        // Optionally disable the link
        element.addEventListener('click', (e) => {
          e.preventDefault();
          alert('This link is currently unavailable. Please try again later.');
        });
      });
    }
  }
}

export default URLHealthMonitor;
