/**
 * DEPRECATED: Legacy store webhook handler
 * 
 * This endpoint is maintained for backward compatibility.
 * New integrations should use /api/webhooks/store instead.
 * 
 * This handler focuses on license key generation for platform licenses.
 * Digital product fulfillment is handled by /api/webhooks/store.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { verifyWebhookSignature } from '@/lib/store/stripe';
import { generateLicenseKey, hashLicenseKey } from '@/lib/store/license';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { isEventProcessed, markEventProcessed } from '@/lib/store/idempotency';

interface ProductRecord {
  id: string;
  title: string;
  repo?: string;
  download_url?: string;
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

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // SECTION 2: Idempotency check
    const alreadyProcessed = await isEventProcessed(supabase, event.id);
    if (alreadyProcessed) {
      logger.info('Skipping already processed event', { eventId: event.id, type: event.type });
      return Response.json({ received: true, skipped: true });
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as { metadata?: { productId?: string }; customer_email?: string };
      const productId = session.metadata?.productId;
      const email = session.customer_email;

      if (!productId || !email) {
        logger.error('Missing productId or email in webhook');
        return Response.json(
          { error: 'Invalid webhook data' },
          { status: 400 }
        );
      }

      // Get product details
      const { data: product } = await db
        .from('products')
        .select('*')
        .eq('id', productId)
        .single<ProductRecord>();

      if (!product) {
        logger.error('Product not found:', new Error(`Product ${productId} not found`));
        return Response.json({ error: 'Product not found' }, { status: 404 });
      }

      // Generate license key
      const licenseKey = generateLicenseKey();
      const licenseHash = hashLicenseKey(licenseKey);

      // Store purchase
      const { error: purchaseError } = await db.from('purchases').insert({
        email,
        product_id: productId,
        repo: product.repo,
      });

      if (purchaseError) {
        logger.error('Failed to store purchase:', purchaseError);
      }

      // Store license
      const { error: licenseError } = await db.from('licenses').insert({
        email,
        product_id: productId,
        license_key: licenseHash,
      });

      if (licenseError) {
        logger.error('Failed to store license:', licenseError);
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
      await markEventProcessed(supabase, event.id, event.type, undefined, { productId, email });

      return Response.json({ received: true });
    }

    // Mark non-checkout events as processed too
    await markEventProcessed(supabase, event.id, event.type);

    return Response.json({ received: true });
  } catch (error) {
    logger.error(
      'Webhook error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return Response.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
