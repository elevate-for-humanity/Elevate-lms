
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { logger } from '@/lib/logger';
import {
  createWebhook,
  getWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  toggleWebhook,
  testWebhook,
  getWebhookDeliveries,
  getWebhookStats,
  retryWebhookDelivery,
  type WebhookEvent,
} from '@/lib/webhooks';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function _GET(request: NextRequest) {
  try {
    const authResult = await apiRequireAdmin();

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const webhookId = searchParams.get('webhookId');

    switch (action) {
      case 'list':
        const enabledOnly = searchParams.get('enabledOnly') === 'true';
        const webhooks = await getWebhooks(enabledOnly);
        return NextResponse.json({ webhooks });

      case 'get':
        if (!webhookId) {
          return NextResponse.json(
            { error: 'webhookId required' },
            { status: 400 }
          );
        }
        const webhook = await getWebhook(webhookId);
        return NextResponse.json({ webhook });

      case 'deliveries':
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const deliveries = await getWebhookDeliveries(
          webhookId || undefined,
          limit
        );
        return NextResponse.json({ deliveries });

      case 'stats':
        if (!webhookId) {
          return NextResponse.json(
            { error: 'webhookId required' },
            { status: 400 }
          );
        }
        const stats = await getWebhookStats(webhookId);
        return NextResponse.json({ stats });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) { 
    logger.error('Webhooks GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook data' },
      { status: 500 }
    );
  }
}

async function _POST(request: NextRequest) {
  try {
    const authResult = await apiRequireAdmin();

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const body = await parseBody<Record<string, any>>(request);
    const { action } = body;

    switch (action) {
      case 'create':
        const { url, events, description, headers } = body;
        if (!url || !events || !Array.isArray(events)) {
          return NextResponse.json(
            { error: 'url and events array required' },
            { status: 400 }
          );
        }
        const webhook = await createWebhook(
          url,
          events as WebhookEvent[],
          user.id,
          {
            description,
            headers,
          }
        );
        return NextResponse.json({ success: true, webhook });

      case 'update':
        const { webhookId, updates } = body;
        if (!webhookId || !updates) {
          return NextResponse.json(
            { error: 'webhookId and updates required' },
            { status: 400 }
          );
        }
        await updateWebhook(webhookId, updates);
        return NextResponse.json({ success: true });

      case 'delete':
        const { webhookId: deleteId } = body;
        if (!deleteId) {
          return NextResponse.json(
            { error: 'webhookId required' },
            { status: 400 }
          );
        }
        await deleteWebhook(deleteId);
        return NextResponse.json({ success: true });

      case 'toggle':
        const { webhookId: toggleId } = body;
        if (!toggleId) {
          return NextResponse.json(
            { error: 'webhookId required' },
            { status: 400 }
          );
        }
        await toggleWebhook(toggleId);
        return NextResponse.json({ success: true });

      case 'test':
        const { webhookId: testId } = body;
        if (!testId) {
          return NextResponse.json(
            { error: 'webhookId required' },
            { status: 400 }
          );
        }
        const testResult = await testWebhook(testId);
        return NextResponse.json({ result: testResult });

      case 'retry':
        const { deliveryId } = body;
        if (!deliveryId) {
          return NextResponse.json(
            { error: 'deliveryId required' },
            { status: 400 }
          );
        }
        await retryWebhookDelivery(deliveryId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) { 
    logger.error('Webhooks POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook action' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/webhooks', _GET, { actor_type: 'webhook', skip_body: true });
export const POST = withApiAudit('/api/webhooks', _POST, { actor_type: 'webhook', skip_body: true });
