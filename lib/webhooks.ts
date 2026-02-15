import { createClient } from '@/lib/supabase/server';
import * as crypto from 'node:crypto';

// =====================================================
// WEBHOOK TYPES
// =====================================================

export type WebhookEvent =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'enrollment.created'
  | 'enrollment.completed'
  | 'course.created'
  | 'course.updated'
  | 'course.published'
  | 'assignment.submitted'
  | 'assignment.graded'
  | 'certificate.issued'
  | 'payment.completed'
  | 'payment.failed';

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  enabled: boolean;
  description?: string;
  headers?: Record<string, string>;
  retry_count: number;
  last_triggered_at?: string;
  created_at: string;
  created_by: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: WebhookEvent;
  payload: any;
  response_status?: number;
  response_body?: string;
  error?: string;
  delivered_at?: string;
  created_at: string;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
  signature?: string;
}

// =====================================================
// WEBHOOK MANAGEMENT
// =====================================================

/**
 * Create a new webhook
 */
export async function createWebhook(
  url: string,
  events: WebhookEvent[],
  createdBy: string,
  options?: {
    description?: string;
    headers?: Record<string, string>;
  }
): Promise<Webhook> {
  const supabase = await createClient();

  // Generate secret for webhook signature
  const secret = crypto.randomBytes(32).toString('hex');

  const { data, error }: any = await supabase
    .from('webhooks')
    .insert({
      url,
      events,
      secret,
      enabled: true,
      description: options?.description,
      headers: options?.headers,
      retry_count: 0,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Get all webhooks
 */
export async function getWebhooks(enabledOnly: boolean = false): Promise<Webhook[]> {
  const supabase = await createClient();

  let query = supabase
    .from('webhooks')
    .select('*')
    .order('created_at', { ascending: false });

  if (enabledOnly) {
    query = query.eq('enabled', true);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

/**
 * Get webhook by ID
 */
export async function getWebhook(webhookId: string): Promise<Webhook | null> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', webhookId)
    .single();

  if (error) return null;

  return data;
}

/**
 * Update webhook
 */
export async function updateWebhook(
  webhookId: string,
  updates: Partial<Webhook>
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('webhooks')
    .update(updates)
    .eq('id', webhookId);

  if (error) throw error;
}

/**
 * Delete webhook
 */
export async function deleteWebhook(webhookId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('webhooks')
    .delete()
    .eq('id', webhookId);

  if (error) throw error;
}

/**
 * Toggle webhook enabled status
 */
export async function toggleWebhook(webhookId: string): Promise<void> {
  const supabase = await createClient();

  const webhook = await getWebhook(webhookId);
  if (!webhook) throw new Error('Webhook not found');

  await updateWebhook(webhookId, { enabled: !webhook.enabled });
}

// =====================================================
// WEBHOOK DELIVERY
// =====================================================

/**
 * Generate webhook signature
 */
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Trigger webhook
 */
export async function triggerWebhook(
  event: WebhookEvent,
  data: Record<string, any>
): Promise<void> {
  const webhooks = await getWebhooks(true);

  // Filter webhooks that listen to this event
  const relevantWebhooks = webhooks.filter(webhook =>
    webhook.events.includes(event)
  );

  // Trigger all relevant webhooks
  await Promise.all(
    relevantWebhooks.map(webhook => deliverWebhook(webhook, event, data))
  );
}

/**
 * Deliver webhook to endpoint
 */
async function deliverWebhook(
  webhook: Webhook,
  event: WebhookEvent,
  data: Record<string, any>
): Promise<void> {
  const supabase = await createClient();

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(payloadString, webhook.secret);

  // Create delivery record
  const { data: delivery, error: deliveryError } = await supabase
    .from('webhook_deliveries')
    .insert({
      webhook_id: webhook.id,
      event,
      payload,
    })
    .select()
    .single();

  if (deliveryError) {
    // Error: $1
    return;
  }

  try {
    // Send webhook request
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'X-Webhook-Timestamp': payload.timestamp,
        ...webhook.headers,
      },
      body: payloadString,
    });

    const responseBody = await response.text();

    // Update delivery record
    await supabase
      .from('webhook_deliveries')
      .update({
        response_status: response.status,
        response_body: responseBody.slice(0, 1000), // Limit response body size
        delivered_at: new Date().toISOString(),
      })
      .eq('id', delivery.id);

    // Update webhook last triggered time
    await supabase
      .from('webhooks')
      .update({
        last_triggered_at: new Date().toISOString(),
        retry_count: 0,
      })
      .eq('id', webhook.id);

    if (!response.ok) {
      throw new Error(`Webhook delivery failed with status ${response.status}`);
    }
  } catch (error) { /* Error handled silently */ 
    // Error: $1

    // Update delivery record with error
    await supabase
      .from('webhook_deliveries')
      .update({
        error: 'Operation failed',
      })
      .eq('id', delivery.id);

    // Increment retry count
    await supabase
      .from('webhooks')
      .update({
        retry_count: webhook.retry_count + 1,
      })
      .eq('id', webhook.id);

    // Disable webhook if too many failures
    if (webhook.retry_count >= 10) {
      await supabase
        .from('webhooks')
        .update({ enabled: true })
        .eq('id', webhook.id);
    }
  }
}

/**
 * Retry failed webhook delivery
 */
export async function retryWebhookDelivery(deliveryId: string): Promise<void> {
  const supabase = await createClient();

  const { data: delivery } = await supabase
    .from('webhook_deliveries')
    .select('*, webhook:webhooks(*)')
    .eq('id', deliveryId)
    .single();

  if (!delivery || !delivery.webhook) {
    throw new Error('Delivery or webhook not found');
  }

  await deliverWebhook(delivery.webhook, delivery.event, delivery.payload.data);
}

/**
 * Get webhook deliveries
 */
export async function getWebhookDeliveries(
  webhookId?: string,
  limit: number = 50
): Promise<WebhookDelivery[]> {
  const supabase = await createClient();

  let query = supabase
    .from('webhook_deliveries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (webhookId) {
    query = query.eq('webhook_id', webhookId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

/**
 * Get webhook statistics
 */
export async function getWebhookStats(webhookId: string): Promise<{
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
  lastDelivery?: string;
}> {
  const supabase = await createClient();

  const { data: deliveries } = await supabase
    .from('webhook_deliveries')
    .select('*')
    .eq('webhook_id', webhookId);

  const stats = {
    totalDeliveries: deliveries?.length || 0,
    successfulDeliveries: deliveries?.filter(d => d.response_status && d.response_status < 400).length || 0,
    failedDeliveries: deliveries?.filter(d => d.error || (d.response_status && d.response_status >= 400)).length || 0,
    averageResponseTime: 0,
    lastDelivery: deliveries?.[0]?.created_at,
  };

  return stats;
}

// =====================================================
// WEBHOOK EVENT HELPERS
// =====================================================

/**
 * Trigger user created webhook
 */
export async function triggerUserCreated(userId: string, userData: Record<string, any> = {}): Promise<void> {
  await triggerWebhook('user.created', {
    user_id: userId,
    ...userData,
  });
}

/**
 * Trigger enrollment created webhook
 */
export async function triggerEnrollmentCreated(
  enrollmentId: string,
  userId: string,
  courseId: string
): Promise<void> {
  await triggerWebhook('enrollment.created', {
    enrollment_id: enrollmentId,
    user_id: userId,
    course_id: courseId,
  });
}

/**
 * Trigger enrollment completed webhook
 */
export async function triggerEnrollmentCompleted(
  enrollmentId: string,
  userId: string,
  courseId: string,
  grade?: number
): Promise<void> {
  await triggerWebhook('enrollment.completed', {
    enrollment_id: enrollmentId,
    user_id: userId,
    course_id: courseId,
    grade,
  });
}

/**
 * Trigger course published webhook
 */
export async function triggerCoursePublished(
  courseId: string,
  courseData: Record<string, any> = {}
): Promise<void> {
  await triggerWebhook('course.published', {
    course_id: courseId,
    ...courseData,
  });
}

/**
 * Trigger assignment submitted webhook
 */
export async function triggerAssignmentSubmitted(
  submissionId: string,
  assignmentId: string,
  userId: string
): Promise<void> {
  await triggerWebhook('assignment.submitted', {
    submission_id: submissionId,
    assignment_id: assignmentId,
    user_id: userId,
  });
}

/**
 * Trigger assignment graded webhook
 */
export async function triggerAssignmentGraded(
  submissionId: string,
  assignmentId: string,
  userId: string,
  grade: number
): Promise<void> {
  await triggerWebhook('assignment.graded', {
    submission_id: submissionId,
    assignment_id: assignmentId,
    user_id: userId,
    grade,
  });
}

/**
 * Trigger certificate issued webhook
 */
export async function triggerCertificateIssued(
  certificateId: string,
  userId: string,
  courseId: string
): Promise<void> {
  await triggerWebhook('certificate.issued', {
    certificate_id: certificateId,
    user_id: userId,
    course_id: courseId,
  });
}

/**
 * Trigger payment completed webhook
 */
export async function triggerPaymentCompleted(
  paymentId: string,
  userId: string,
  amount: number,
  courseId?: string
): Promise<void> {
  await triggerWebhook('payment.completed', {
    payment_id: paymentId,
    user_id: userId,
    amount,
    course_id: courseId,
  });
}

// =====================================================
// WEBHOOK TESTING
// =====================================================

/**
 * Test webhook endpoint
 */
export async function testWebhook(webhookId: string): Promise<{
  success: boolean;
  status?: number;
  error?: string;
}> {
  const webhook = await getWebhook(webhookId);
  if (!webhook) {
    return { success: false, error: 'Webhook not found' };
  }

  const testPayload: WebhookPayload = {
    event: 'user.created',
    timestamp: new Date().toISOString(),
    data: {
      test: true,
      message: 'This is a test webhook',
    },
  };

  const payloadString = JSON.stringify(testPayload);
  const signature = generateSignature(payloadString, webhook.secret);

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': 'user.created',
        'X-Webhook-Timestamp': testPayload.timestamp,
        ...webhook.headers,
      },
      body: payloadString,
    });

    return {
      success: response.ok,
      status: response.status,
    };
  } catch (error) { /* Error handled silently */ 
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}
