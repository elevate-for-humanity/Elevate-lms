export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { verifyWebhookSignature } from '@/lib/store/stripe';
import { generateLicenseKey, hashLicenseKey } from '@/lib/store/license';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { auditLog } from '@/lib/auditLog';
import { queueFulfillment } from '@/lib/store/fulfillment-queue';

interface ProductRecord {
  id: string;
  title: string;
  repo?: string;
  download_url?: string;
}

/**
 * Check if webhook event has already been processed (idempotency)
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  const db = await getAdminClient();
  const { data } = await db
    .from('processed_webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .single();
  return !!data;
}

/**
 * Mark webhook event as processed
 */
async function markEventProcessed(eventId: string, eventType: string): Promise<void> {
  const db = await getAdminClient();
  await db.from('processed_webhook_events').insert({
    event_id: eventId,
    event_type: eventType,
    processed_at: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return Response.json({ error: 'No signature' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return Response.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature, webhookSecret);

    // Idempotency check - prevent duplicate processing
    if (await isEventProcessed(event.id)) {
      logger.info('Webhook event already processed', { eventId: event.id });
      return Response.json({ received: true, duplicate: true });
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as { 
        id?: string;
        metadata?: { productId?: string }; 
        customer_email?: string;
        amount_total?: number;
        currency?: string;
      };
      const productId = session.metadata?.productId;
      const email = session.customer_email;

      if (!productId || !email) {
        logger.error('Missing productId or email in webhook');
        return Response.json(
          { error: 'Invalid webhook data' },
          { status: 400 }
        );
      }

      const supabase = await createClient();

      // Get product details
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single<ProductRecord>();

      if (!product) {
        logger.error('Product not found:', new Error(`Product ${productId} not found`));
        return Response.json({ error: 'Product not found' }, { status: 404 });
      }

      // Audit log the purchase
      await auditLog({
        action: 'CREATE',
        entity: 'license_purchase' as any,
        entity_id: session.id,
        metadata: {
          email,
          product_id: productId,
          product_title: product.title,
          amount: session.amount_total,
          currency: session.currency,
          stripe_event_id: event.id,
        },
        req,
      });

      // Queue fulfillment for background processing with retries
      const queued = await queueFulfillment({
        eventId: event.id,
        sessionId: session.id || '',
        email,
        productId,
        productTitle: product.title,
        repo: product.repo,
        downloadUrl: product.download_url,
      });

      if (queued) {
        // Mark event as processed
        await markEventProcessed(event.id, event.type);
        logger.info('Fulfillment queued', { eventId: event.id, email, productId });
        return Response.json({ received: true, queued: true });
      }

      // Fallback: process synchronously if queue fails
      logger.warn('Queue unavailable, processing synchronously', { eventId: event.id });

      // Generate license key
      const licenseKey = generateLicenseKey();
      const licenseHash = hashLicenseKey(licenseKey);

      // Store purchase
      const { error: purchaseError } = await db.from('purchases').insert({
        email,
        product_id: productId,
        repo: product.repo,
        stripe_event_id: event.id,
      });

      if (purchaseError) {
        logger.error('Failed to store purchase:', purchaseError);
      }

      // Store license
      const { data: licenseData, error: licenseError } = await db.from('licenses').insert({
        email,
        product_id: productId,
        license_key: licenseHash,
        stripe_event_id: event.id,
      }).select('id').single();

      if (licenseError) {
        logger.error('Failed to store license:', licenseError);
      }

      // Audit log license creation
      await auditLog({
        action: 'CREATE',
        entity: 'license_purchase' as any,
        entity_id: licenseData?.id,
        metadata: {
          email,
          product_id: productId,
          license_generated: true,
          stripe_event_id: event.id,
        },
        req,
      });

      // Provision tenant automatically
      if (licenseData?.id) {
        const { provisionTenant } = await import('@/lib/store/provision-tenant');
        await provisionTenant({
          email,
          productId,
          licenseId: licenseData.id,
          stripeEventId: event.id,
        });
      }

      // Send email with license key
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: `Your ${product.title} License Key`,
            template: 'license-delivery',
            data: {
              productName: product.title,
              licenseKey: licenseKey,
              repo: product.repo,
              downloadUrl:
                product.download_url ||
                `${process.env.NEXT_PUBLIC_SITE_URL}/downloads/${productId}`,
            },
          }),
        });
        logger.info('License email sent', { email });
      } catch (emailError) {
        logger.error('Failed to send license email:', emailError as Error);
      }

      // Mark event as processed
      await markEventProcessed(event.id, event.type);

      return Response.json({ received: true });
    }

    return Response.json({ received: true });
  } catch (error) {
    logger.error(
      'Webhook error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return Response.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
