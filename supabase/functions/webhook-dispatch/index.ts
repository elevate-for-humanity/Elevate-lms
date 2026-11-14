/**
 * Webhook Dispatch Edge Function
 * Sends webhook notifications to configured endpoints
 *
 * Copyright (c) 2025 Elevate for Humanity
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  orgId: string;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  enabled: boolean;
  org_id: string;
}

function generateSignature(payload: string, secret: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

async function sendWebhook(
  webhook: Webhook,
  payload: WebhookPayload,
): Promise<{
  success: boolean;
  statusCode?: number;
  error?: string;
  responseTime: number;
}> {
  const startTime = Date.now();

  try {
    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(payloadString, webhook.secret);

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp,
        'User-Agent': 'Elevate-Webhooks/1.0',
      },
      body: payloadString,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseTime,
      };
    }

    return {
      success: true,
      statusCode: response.status,
      responseTime,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      error: error.message,
      responseTime,
    };
  }
}

async function logWebhookDelivery(
  webhookId: string,
  payload: WebhookPayload,
  result: {
    success: boolean;
    statusCode?: number;
    error?: string;
    responseTime: number;
  },
) {
  try {
    await supabase.from('webhook_logs').insert({
      webhook_id: webhookId,
      event: payload.event,
      payload: payload.data,
      status: result.success ? 'delivered' : 'failed',
      status_code: result.statusCode,
      error: result.error,
      response_time_ms: result.responseTime,
    });
  } catch (error) {
    console.error(`[webhook-dispatch] Failed to log webhook delivery for ${webhookId}:`, error instanceof Error ? error.message : error);
  }
}

async function dispatchWebhook(event: string, data: any, orgId: string) {
  try {
    // Fetch active webhooks for this org that subscribe to this event
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('org_id', orgId)
      .eq('enabled', true);

    if (error) throw error;

    if (!webhooks || webhooks.length === 0) {
      return { dispatched: 0, message: 'No active webhooks found' };
    }

    // Filter webhooks that subscribe to this event
    const relevantWebhooks = webhooks.filter(
      (webhook: Webhook) => webhook.events.includes(event) || webhook.events.includes('*'),
    );

    if (relevantWebhooks.length === 0) {
      return { dispatched: 0, message: 'No webhooks subscribed to this event' };
    }

    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      orgId,
    };

    // Send to all relevant webhooks in parallel
    const results = await Promise.all(
      relevantWebhooks.map(async (webhook: Webhook) => {
        const result = await sendWebhook(webhook, payload);
        await logWebhookDelivery(webhook.id, payload, result);
        return { webhookId: webhook.id, ...result };
      }),
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      dispatched: relevantWebhooks.length,
      successful,
      failed,
      results,
    };
  } catch (error: any) {
    throw error;
  }
}

async function processWebhookQueue() {
  try {
    // Fetch pending webhooks from queue
    const { data: queuedWebhooks, error } = await supabase
      .from('webhook_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(20);

    if (error) throw error;

    if (!queuedWebhooks || queuedWebhooks.length === 0) {
      return { processed: 0 };
    }

    let processed = 0;
    for (const item of queuedWebhooks) {
      // Mark as processing
      await supabase.from('webhook_queue').update({ status: 'processing' }).eq('id', item.id);

      try {
        // Dispatch webhook
        const result = await dispatchWebhook(item.event, item.data, item.org_id);

        // Update queue status
        await supabase
          .from('webhook_queue')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            result,
          })
          .eq('id', item.id);

        processed++;
      } catch (error: any) {
        // Mark as failed
        await supabase
          .from('webhook_queue')
          .update({
            status: 'failed',
            error: error.message,
            processed_at: new Date().toISOString(),
          })
          .eq('id', item.id);
      }
    }

    return { processed };
  } catch (error: any) {
    throw error;
  }
}

async function retryFailedWebhooks() {
  try {
    // Find failed webhooks that should be retried
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: failedLogs, error } = await supabase
      .from('webhook_logs')
      .select('*, webhook:webhooks(*)')
      .eq('status', 'failed')
      .lt('retry_count', 3)
      .lt('created_at', oneHourAgo)
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) throw error;

    if (!failedLogs || failedLogs.length === 0) {
      return { retried: 0 };
    }

    let retried = 0;
    for (const log of failedLogs) {
      if (!log.webhook || !log.webhook.enabled) continue;

      const payload: WebhookPayload = {
        event: log.event,
        data: log.payload,
        timestamp: new Date().toISOString(),
        orgId: log.webhook.org_id,
      };

      const result = await sendWebhook(log.webhook, payload);

      // Update retry count
      await supabase
        .from('webhook_logs')
        .update({
          retry_count: (log.retry_count || 0) + 1,
          status: result.success ? 'delivered' : 'failed',
          last_retry_at: new Date().toISOString(),
        })
        .eq('id', log.id);

      if (result.success) {
        retried++;
      }
    }

    return { retried };
  } catch (error: any) {
    throw error;
  }
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'dispatch';

    if (action === 'process-queue') {
      // Process queued webhooks (called by cron)
      const result = await processWebhookQueue();
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'retry-failed') {
      // Retry failed webhooks (called by cron)
      const result = await retryFailedWebhooks();
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Direct dispatch
    const { event, data, orgId } = await req.json();

    if (!event || !data || !orgId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: event, data, orgId',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const result = await dispatchWebhook(event, data, orgId);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
