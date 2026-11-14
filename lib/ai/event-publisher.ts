/**
 * AI Gateway Module - Event Publisher
 *
 * Event publishing system for system events with webhook support
 * and in-memory retention of last 1000 events.
 */

import {
  EventType,
} from './types';

import type {
  EventPayload,
  EventSubscription,
  WebhookConfig,
  WebhookDelivery,
} from './types';

// ============================================================
// Webhook Manager
// ============================================================

interface WebhookRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

// ============================================================
// Event Publisher Implementation
// ============================================================

export class EventPublisher {
  private events: EventPayload[] = [];
  private subscriptions: Map<string, Set<(event: EventPayload) => void>> = new Map();
  private webhooks: Map<string, WebhookConfig> = new Map();
  private webhookDeliveries: Map<string, WebhookDelivery> = new Map();
  
  private readonly maxEvents = 1000;
  private readonly maxWebhookRetries = 3;
  private readonly webhookRetryDelay = 5000;

  constructor() {
    // Initialize subscription map for all event types
    Object.values(EventType).forEach((type) => {
      this.subscriptions.set(type, new Set());
    });
    this.subscriptions.set('*', new Set()); // Wildcard subscriptions
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique delivery ID
   */
  private generateDeliveryId(): string {
    return `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Publish an event
   */
  publish(event: EventPayload): void {
    const enrichedEvent: EventPayload = {
      ...event,
      id: event.id || this.generateEventId(),
      timestamp: event.timestamp || Date.now(),
    };

    // Add to event history
    this.events.push(enrichedEvent);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Notify local subscribers
    this.notifySubscribers(enrichedEvent);

    // Trigger webhooks
    this.triggerWebhooks(enrichedEvent);
  }

  /**
   * Create and publish an event
   */
  publishEvent(
    type: EventType,
    source: string,
    data: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): EventPayload {
    const event: EventPayload = {
      id: this.generateEventId(),
      type,
      timestamp: Date.now(),
      source,
      data,
      metadata,
    };

    this.publish(event);
    return event;
  }

  /**
   * Notify local subscribers of an event
   */
  private notifySubscribers(event: EventPayload): void {
    // Notify type-specific subscribers
    const typeSubscribers = this.subscriptions.get(event.type);
    if (typeSubscribers) {
      typeSubscribers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event subscriber for ${event.type}:`, error);
        }
      });
    }

    // Notify wildcard subscribers
    const wildcardSubscribers = this.subscriptions.get('*');
    if (wildcardSubscribers) {
      wildcardSubscribers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in wildcard event subscriber:', error);
        }
      });
    }
  }

  /**
   * Subscribe to events
   */
  subscribe(
    eventType: string,
    handler: (event: EventPayload) => void
  ): () => void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }

    const wrappedHandler = (event: EventPayload) => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in subscription handler for ${eventType}:`, error);
      }
    };

    this.subscriptions.get(eventType)!.add(wrappedHandler);

    return () => {
      const subs = this.subscriptions.get(eventType);
      if (subs) {
        subs.delete(wrappedHandler);
      }
    };
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(eventType: string): void {
    this.subscriptions.delete(eventType);
  }

  /**
   * Get recent events
   */
  getRecentEvents(type?: EventType, limit?: number): EventPayload[] {
    let filtered = this.events;

    if (type) {
      filtered = filtered.filter((e) => e.type === type);
    }

    if (limit) {
      return filtered.slice(-limit);
    }

    return [...filtered];
  }

  /**
   * Get events by source
   */
  getEventsBySource(source: string, limit?: number): EventPayload[] {
    const filtered = this.events.filter((e) => e.source === source);
    if (limit) {
      return filtered.slice(-limit);
    }
    return filtered;
  }

  /**
   * Get events within a time range
   */
  getEventsByTimeRange(startTime: number, endTime: number): EventPayload[] {
    return this.events.filter((e) => e.timestamp >= startTime && e.timestamp <= endTime);
  }

  /**
   * Get event statistics
   */
  getEventStats(): {
    total: number;
    byType: Record<string, number>;
    bySource: Record<string, number>;
    last24h: number;
    lastHour: number;
  } {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const lastHour = now - 60 * 60 * 1000;

    const stats = {
      total: this.events.length,
      byType: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      last24h: 0,
      lastHour: 0,
    };

    this.events.forEach((event) => {
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
      stats.bySource[event.source] = (stats.bySource[event.source] || 0) + 1;
      if (event.timestamp >= last24h) stats.last24h++;
      if (event.timestamp >= lastHour) stats.lastHour++;
    });

    return stats;
  }

  // ============================================================
  // Webhook Management
  // ============================================================

  /**
   * Register a webhook
   */
  registerWebhook(config: Omit<WebhookConfig, 'id' | 'createdAt'>): string {
    const id = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const webhook: WebhookConfig = {
      ...config,
      id,
      createdAt: Date.now(),
    };

    this.webhooks.set(id, webhook);
    return id;
  }

  /**
   * Get webhook by ID
   */
  getWebhook(id: string): WebhookConfig | null {
    return this.webhooks.get(id) || null;
  }

  /**
   * Update webhook
   */
  updateWebhook(id: string, updates: Partial<WebhookConfig>): boolean {
    const webhook = this.webhooks.get(id);
    if (!webhook) return false;

    this.webhooks.set(id, { ...webhook, ...updates });
    return true;
  }

  /**
   * Delete webhook
   */
  deleteWebhook(id: string): boolean {
    return this.webhooks.delete(id);
  }

  /**
   * Get all webhooks
   */
  getAllWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Get webhooks for an event type
   */
  getWebhooksForEvent(eventType: EventType): WebhookConfig[] {
    return Array.from(this.webhooks.values()).filter(
      (webhook) => webhook.enabled && webhook.eventTypes.includes(eventType)
    );
  }

  /**
   * Trigger webhooks for an event
   */
  private triggerWebhooks(event: EventPayload): void {
    const webhooks = this.getWebhooksForEvent(event.type);

    webhooks.forEach((webhook) => {
      this.deliverWebhook(webhook, event);
    });
  }

  /**
   * Deliver webhook with retries
   */
  private async deliverWebhook(
    webhook: WebhookConfig,
    event: EventPayload,
    attempt = 1
  ): Promise<void> {
    const deliveryId = this.generateDeliveryId();
    
    const delivery: WebhookDelivery = {
      id: deliveryId,
      webhookId: webhook.id,
      event,
      status: 'pending',
      attempts: attempt,
      lastAttempt: Date.now(),
      createdAt: Date.now(),
    };

    this.webhookDeliveries.set(deliveryId, delivery);

    try {
      const request = this.buildWebhookRequest(webhook, event);
      const response = await this.executeWebhookRequest(request);

      if (response.status >= 200 && response.status < 300) {
        delivery.status = 'delivered';
        delivery.response = { status: response.status, body: response.body };
      } else {
        throw new Error(`Webhook returned status ${response.status}`);
      }
    } catch (error) {
      delivery.status = 'failed';
      delivery.response = {
        status: 0,
        body: error instanceof Error ? error.message : 'Unknown error',
      };

      // Retry if attempts remaining
      if (attempt < this.maxWebhookRetries) {
        setTimeout(() => {
          this.deliverWebhook(webhook, event, attempt + 1);
        }, this.webhookRetryDelay * attempt);
      }
    }

    this.webhookDeliveries.set(deliveryId, delivery);
  }

  /**
   * Build webhook request
   */
  private buildWebhookRequest(
    webhook: WebhookConfig,
    event: EventPayload
  ): WebhookRequest {
    const timestamp = Date.now();
    const signature = this.generateSignature(event, webhook.secret, timestamp);

    return {
      url: webhook.url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': timestamp.toString(),
        'X-Event-Type': event.type,
        'X-Event-ID': event.id,
      },
      body: JSON.stringify({
        event,
        deliveredAt: timestamp,
      }),
    };
  }

  /**
   * Generate HMAC signature for webhook
   */
  private generateSignature(event: EventPayload, secret: string, timestamp: number): string {
    const payload = `${timestamp}.${JSON.stringify(event)}`;
    // Simple HMAC-like signature (in production, use crypto module)
    const combined = `${payload}:${secret}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `sha256=${Math.abs(hash).toString(16).padStart(16, '0')}`;
  }

  /**
   * Execute webhook HTTP request
   */
  private async executeWebhookRequest(request: WebhookRequest): Promise<{
    status: number;
    body: string;
  }> {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const body = await response.text();
      return {
        status: response.status,
        body: body.substring(0, 1000), // Truncate response body
      };
    } catch (error) {
      return {
        status: 0,
        body: error instanceof Error ? error.message : 'Request failed',
      };
    }
  }

  /**
   * Get webhook delivery status
   */
  getWebhookDelivery(deliveryId: string): WebhookDelivery | null {
    return this.webhookDeliveries.get(deliveryId) || null;
  }

  /**
   * Get webhook deliveries for a webhook
   */
  getWebhookDeliveries(webhookId: string, limit = 100): WebhookDelivery[] {
    return Array.from(this.webhookDeliveries.values())
      .filter((d) => d.webhookId === webhookId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /**
   * Get webhook statistics
   */
  getWebhookStats(): {
    total: number;
    enabled: number;
    deliveries: {
      pending: number;
      delivered: number;
      failed: number;
    };
  } {
    const webhooks = Array.from(this.webhooks.values());
    const deliveries = Array.from(this.webhookDeliveries.values());

    return {
      total: webhooks.length,
      enabled: webhooks.filter((w) => w.enabled).length,
      deliveries: {
        pending: deliveries.filter((d) => d.status === 'pending').length,
        delivered: deliveries.filter((d) => d.status === 'delivered').length,
        failed: deliveries.filter((d) => d.status === 'failed').length,
      },
    };
  }

  /**
   * Clear old events
   */
  clearEvents(olderThanMs?: number): number {
    const cutoff = olderThanMs ? Date.now() - olderThanMs : 0;
    const initialCount = this.events.length;
    this.events = this.events.filter((e) => e.timestamp >= cutoff);
    return initialCount - this.events.length;
  }
}

// ============================================================
// Predefined Event Factories
// ============================================================

export function createApplicationSubmittedEvent(
  applicationId: string,
  programId: string,
  applicantEmail: string
): Omit<EventPayload, 'id' | 'timestamp' | 'source'> {
  return {
    type: EventType.APPLICATION_SUBMITTED,
    data: {
      applicationId,
      programId,
      applicantEmail,
    },
  };
}

export function createInterviewStartedEvent(
  applicationId: string,
  interviewId: string
): Omit<EventPayload, 'id' | 'timestamp' | 'source'> {
  return {
    type: EventType.INTERVIEW_STARTED,
    data: {
      applicationId,
      interviewId,
    },
  };
}

export function createInterviewCompletedEvent(
  applicationId: string,
  interviewId: string,
  result: 'pass' | 'fail' | 'needs_review'
): Omit<EventPayload, 'id' | 'timestamp' | 'source'> {
  return {
    type: EventType.INTERVIEW_COMPLETED,
    data: {
      applicationId,
      interviewId,
      result,
    },
  };
}

export function createEnrollmentApprovedEvent(
  enrollmentId: string,
  studentId: string,
  programId: string
): Omit<EventPayload, 'id' | 'timestamp' | 'source'> {
  return {
    type: EventType.ENROLLMENT_APPROVED,
    data: {
      enrollmentId,
      studentId,
      programId,
    },
  };
}

export function createEnrollmentRejectedEvent(
  enrollmentId: string,
  studentId: string,
  reason: string
): Omit<EventPayload, 'id' | 'timestamp' | 'source'> {
  return {
    type: EventType.ENROLLMENT_REJECTED,
    data: {
      enrollmentId,
      studentId,
      reason,
    },
  };
}

export function createCourseCompletedEvent(
  studentId: string,
  courseId: string,
  score: number
): Omit<EventPayload, 'id' | 'timestamp' | 'source'> {
  return {
    type: EventType.COURSE_COMPLETED,
    data: {
      studentId,
      courseId,
      score,
    },
  };
}

export function createCertificateIssuedEvent(
  studentId: string,
  certificateId: string,
  programId: string
): Omit<EventPayload, 'id' | 'timestamp' | 'source'> {
  return {
    type: EventType.CERTIFICATE_ISSUED,
    data: {
      studentId,
      certificateId,
      programId,
    },
  };
}

export function createJobPlacedEvent(
  studentId: string,
  employerId: string,
  jobTitle: string
): Omit<EventPayload, 'id' | 'timestamp' | 'source'> {
  return {
    type: EventType.JOB_PLACED,
    data: {
      studentId,
      employerId,
      jobTitle,
    },
  };
}

export function createComplianceAlertEvent(
  alertType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  description: string,
  affectedEntity?: { type: string; id: string }
): Omit<EventPayload, 'id' | 'timestamp' | 'source'> {
  return {
    type: EventType.COMPLIANCE_ALERT,
    data: {
      alertType,
      severity,
      description,
      affectedEntity,
    },
    metadata: { severity },
  };
}

// ============================================================
// Singleton Instance
// ============================================================

let eventPublisherInstance: EventPublisher | null = null;

export function getEventPublisher(): EventPublisher {
  if (!eventPublisherInstance) {
    eventPublisherInstance = new EventPublisher();
  }
  return eventPublisherInstance;
}

export function resetEventPublisher(): void {
  eventPublisherInstance = null;
}

export { EventType };
export type { EventPayload };
