import { logger } from '@/lib/logger';
/**
 * Cron Job: Check License Status
 * Runs daily to suspend expired licenses and check subscription status
 * 
 * Set up as scheduled cron: "0 6 * * *" (6 AM daily)
 */

import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Verify cron secret (for security)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const results = {
    checked: 0,
    suspended: 0,
    reactivated: 0,
    errors: [] as string[],
  };

  try {
    // 1. Check for expired licenses (one-time purchases)
    const { data: expiredLicenses } = await db
      .from('licenses')
      .select('id, tenant_id, admin_email, company_name')
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())
      .not('expires_at', 'is', null);

    for (const license of expiredLicenses || []) {
      try {
        await db
          .from('licenses')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', license.id);

        await db
          .from('tenants')
          .update({ active: false })
          .eq('id', license.tenant_id);

        // Send expiration notification
        await sendExpirationEmail(license.admin_email, license.company_name);

        results.suspended++;
      } catch (error) {
        results.errors.push(`Failed to expire license ${license.id}: ${error}`);
      }
      results.checked++;
    }

    // 2. Check subscription status for active licenses
    const { data: subscriptionLicenses } = await db
      .from('licenses')
      .select('id, tenant_id, stripe_subscription_id, status')
      .not('stripe_subscription_id', 'is', null);

    for (const license of subscriptionLicenses || []) {
      try {
        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(license.stripe_subscription_id);
        
        const shouldBeActive = ['active', 'trialing'].includes(subscription.status);
        const isActive = license.status === 'active';

        if (shouldBeActive && !isActive) {
          // Reactivate
          await db
            .from('licenses')
            .update({ status: 'active', suspended_at: null, suspended_reason: null })
            .eq('id', license.id);
          await db
            .from('tenants')
            .update({ active: true })
            .eq('id', license.tenant_id);
          results.reactivated++;
        } else if (!shouldBeActive && isActive) {
          // Suspend
          await db
            .from('licenses')
            .update({ 
              status: 'suspended', 
              suspended_at: new Date().toISOString(),
              suspended_reason: `Subscription ${subscription.status}`,
            })
            .eq('id', license.id);
          await db
            .from('tenants')
            .update({ active: false })
            .eq('id', license.tenant_id);
          results.suspended++;
        }

        results.checked++;
      } catch (error) {
        results.errors.push(`Failed to check subscription for license ${license.id}: ${error}`);
      }
    }

    // 3. Send warning emails for licenses expiring soon (7 days)
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expiringLicenses } = await db
      .from('licenses')
      .select('id, admin_email, company_name, expires_at')
      .eq('status', 'active')
      .lt('expires_at', sevenDaysFromNow)
      .gt('expires_at', new Date().toISOString())
      .not('expiry_warning_sent', 'is', true);

    for (const license of expiringLicenses || []) {
      try {
        await sendExpiryWarningEmail(license.admin_email, license.company_name, license.expires_at);
        await db
          .from('licenses')
          .update({ expiry_warning_sent: true })
          .eq('id', license.id);
      } catch (error) {
        results.errors.push(`Failed to send warning for license ${license.id}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('License check cron failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      ...results,
    }, { status: 500 });
  }
}

async function sendExpirationEmail(email: string, companyName: string): Promise<void> {
  try {
    const { sendEmail } = await import('@/lib/email/resend');
    await sendEmail({
      to: email,
      subject: `Your Elevate LMS License Has Expired - ${companyName}`,
      html: `
        <h1>License Expired</h1>
        <p>Your Elevate LMS license for <strong>${companyName}</strong> has expired.</p>
        <p>Your platform access has been suspended. To continue using Elevate LMS:</p>
        <p><a href="https://www.elevateforhumanity.org/store/licenses" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Renew Your License</a></p>
        <p>Your data is preserved and will be available when you renew.</p>
      `,
    });
  } catch (error) {
    logger.error('Failed to send expiration email:', error);
  }
}

async function sendExpiryWarningEmail(email: string, companyName: string, expiresAt: string): Promise<void> {
  try {
    const { sendEmail } = await import('@/lib/email/resend');
    const expiryDate = new Date(expiresAt).toLocaleDateString();
    await sendEmail({
      to: email,
      subject: `⚠️ Your Elevate LMS License Expires Soon - ${companyName}`,
      html: `
        <h1>License Expiring Soon</h1>
        <p>Your Elevate LMS license for <strong>${companyName}</strong> will expire on <strong>${expiryDate}</strong>.</p>
        <p>Renew now to avoid any interruption in service:</p>
        <p><a href="https://www.elevateforhumanity.org/store/licenses" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Renew Your License</a></p>
      `,
    });
  } catch (error) {
    logger.error('Failed to send expiry warning email:', error);
  }
}
