export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import { Resend } from 'resend';
import { generateLicenseWelcomeEmail } from '@/lib/email-templates/license-welcome';
import { logger } from '@/lib/logger';
import { isEventProcessed, markEventProcessed } from '@/lib/store/idempotency';
import { logProvisioningStep } from '@/lib/store/audit';
import { provisionLicense } from '@/lib/store/provisioning';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const resend = new Resend(process.env.RESEND_API_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const db = await getAdminClient();

    // SECTION 2: Idempotency check - CRITICAL
    const alreadyProcessed = await isEventProcessed(supabase, event.id);
    if (alreadyProcessed) {
      logger.info('Skipping already processed license event', { eventId: event.id, type: event.type });
      return NextResponse.json({ received: true, skipped: true });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const correlationId = paymentIntent.id;

        // Log payment received
        await logProvisioningStep(adminSupabase, {
          paymentIntentId: correlationId,
          correlationId,
          step: 'payment_received',
          status: 'completed',
        });

        // Update license purchase status
        const { data: purchase } = await supabase
          .from('license_purchases')
          .update({ status: 'paid' })
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .select()
          .single();

        if (purchase) {
          // SECTION 3: Use transactional provisioning - all or nothing
          const result = await provisionLicense(adminSupabase, {
            purchaseId: purchase.id,
            paymentIntentId: paymentIntent.id,
            organizationName: purchase.organization_name,
            contactName: purchase.contact_name,
            contactEmail: purchase.contact_email,
            licenseType: purchase.license_type as 'single' | 'school' | 'enterprise',
            productSlug: purchase.product_slug,
          });

          if (result.success && result.licenseKey && result.tenantId) {
            // SECTION 4: Send welcome email with admin access
            await logProvisioningStep(adminSupabase, {
              tenantId: result.tenantId,
              correlationId,
              paymentIntentId: paymentIntent.id,
              step: 'email_sent',
              status: 'started',
            });

            try {
              // Generate magic link for admin login
              const { data: magicLink } = await db.auth.admin.generateLink({
                type: 'magiclink',
                email: purchase.contact_email,
                options: {
                  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/setup?tenant=${result.tenantId}`,
                },
              });

              const validUntil = new Date();
              validUntil.setFullYear(validUntil.getFullYear() + 1);

              const features = getFeatures(purchase.license_type);
              const maxUsers = getMaxUsers(purchase.license_type);
              const maxDeployments = getMaxDeployments(purchase.license_type);

              const emailData = {
                organizationName: purchase.organization_name,
                contactName: purchase.contact_name,
                email: purchase.contact_email,
                licenseKey: result.licenseKey,
                licenseType: purchase.license_type as 'single' | 'school' | 'enterprise',
                tier: mapLicenseTypeToTier(purchase.license_type),
                expiresAt: validUntil.toISOString(),
                features,
                repoUrl: getRepoUrl(purchase.license_type),
                maxDeployments,
                maxUsers,
                loginUrl: magicLink?.properties?.action_link || `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
              };

              const { subject, html, text } = generateLicenseWelcomeEmail(emailData);

              await resend.emails.send({
                from: 'Elevate for Humanity <licenses@elevateforhumanity.org>',
                to: purchase.contact_email,
                subject,
                html,
                text,
              });

              await logProvisioningStep(adminSupabase, {
                tenantId: result.tenantId,
                correlationId,
                paymentIntentId: paymentIntent.id,
                step: 'email_sent',
                status: 'completed',
              });

              logger.info('License provisioning complete', {
                email: purchase.contact_email,
                licenseType: purchase.license_type,
                tenantId: result.tenantId,
              });
            } catch (emailError) {
              await logProvisioningStep(adminSupabase, {
                tenantId: result.tenantId,
                correlationId,
                paymentIntentId: paymentIntent.id,
                step: 'email_sent',
                status: 'failed',
                error: emailError instanceof Error ? emailError.message : String(emailError),
              });
              logger.error('Failed to send license welcome email', emailError as Error);
            }
          } else {
            logger.error('Provisioning failed', { error: result.error, paymentIntentId: paymentIntent.id });
          }
        }

        // Mark event as processed
        await markEventProcessed(supabase, event.id, event.type, paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        await supabase
          .from('license_purchases')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        await markEventProcessed(supabase, event.id, event.type, paymentIntent.id);
        break;
      }

      // SECTION 6: Handle disputes and refunds
      case 'charge.refunded':
      case 'charge.dispute.created': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === 'string' 
          ? charge.payment_intent 
          : charge.payment_intent?.id;

        if (paymentIntentId) {
          // Find and suspend the license
          const { data: purchase } = await supabase
            .from('license_purchases')
            .select('tenant_id')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .single();

          if (purchase?.tenant_id) {
            await adminSupabase
              .from('licenses')
              .update({ status: 'suspended' })
              .eq('tenant_id', purchase.tenant_id);

            logger.warn('License suspended due to dispute/refund', {
              tenantId: purchase.tenant_id,
              eventType: event.type,
            });
          }
        }

        await markEventProcessed(supabase, event.id, event.type, paymentIntentId);
        break;
      }

      default:
        // Mark unhandled events as processed too
        await markEventProcessed(supabase, event.id, event.type);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    logger.error('Webhook handler failed', err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json(
      { error: (err instanceof Error ? err.message : String(err)) || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Helper functions
function mapLicenseTypeToTier(licenseType: string): string {
  switch (licenseType) {
    case 'single': return 'basic';
    case 'school': return 'pro';
    case 'enterprise': return 'enterprise';
    default: return 'basic';
  }
}

function getMaxUsers(licenseType: string): number {
  switch (licenseType) {
    case 'single': return 100;
    case 'school': return 1000;
    case 'enterprise': return 999999;
    default: return 100;
  }
}

function getMaxDeployments(licenseType: string): number {
  switch (licenseType) {
    case 'single': return 1;
    case 'school': return 3;
    case 'enterprise': return 999;
    default: return 1;
  }
}

function getFeatures(licenseType: string): string[] {
  const baseFeatures = ['lms', 'enrollment', 'admin', 'payments', 'mobile-app'];

  switch (licenseType) {
    case 'single':
      return baseFeatures;
    case 'school':
      return [...baseFeatures, 'partner-dashboard', 'case-management', 'compliance', 'white-label'];
    case 'enterprise':
      return [...baseFeatures, 'partner-dashboard', 'case-management', 'employer-portal', 'compliance', 'white-label', 'ai-tutor', 'api-access'];
    default:
      return baseFeatures;
  }
}

function getRepoUrl(licenseType: string): string {
  const repos: Record<string, string> = {
    single: 'https://github.com/elevateforhumanity/elevate-starter',
    school: 'https://github.com/elevateforhumanity/elevate-professional',
    enterprise: 'https://github.com/elevateforhumanity/elevate-enterprise',
  };
  return repos[licenseType] || repos.single;
}
