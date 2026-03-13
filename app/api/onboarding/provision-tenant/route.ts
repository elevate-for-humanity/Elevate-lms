export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resend } from '@/lib/resend';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';


/**
 * AUTOMATED TENANT PROVISIONING
 *
 * Called after successful payment to:
 * 1. Create tenant
 * 2. Create admin user
 * 3. Set up initial data
 * 4. Send welcome email with credentials
 * 5. Return access info
 */

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    // Must be called server-side after a verified Stripe payment — require CRON_SECRET or admin session
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const isInternalCall = cronSecret && authHeader === `Bearer ${cronSecret}`;
    if (!isInternalCall) {
      const { apiRequireAdmin } = await import('@/lib/authGuards');
      const auth = await apiRequireAdmin();
      if (auth.error) return auth.error;
    }

    const body = await parseBody<Record<string, any>>(request);
    const {
      organizationName,
      contactName,
      contactEmail,
      licenseType,
      paymentIntentId,
    } = body;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // 1. Create tenant
    const slug = generateSlug(organizationName);
    const { data: tenant, error: tenantError } = await db
      .from('tenants')
      .insert({
        name: organizationName,
        slug: slug,
        status: 'active',
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      throw new Error('Failed to create tenant');
    }

    // 2. Create license
    const licenseConfig = getLicenseConfig(licenseType);
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    await db.from('licenses').insert({
      tenant_id: tenant.id,
      tier: licenseConfig.tier,
      status: 'active',
      max_users: licenseConfig.maxUsers,
      max_programs: licenseConfig.maxPrograms,
      features: licenseConfig.features,
      valid_from: new Date().toISOString(),
      valid_until: validUntil.toISOString(),
    });

    // 3. Generate admin credentials
    const tempPassword = generateSecurePassword();

    // Create admin user in Supabase Auth
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: contactEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: contactName,
          organization: organizationName,
          tenant_id: tenant.id,
        },
      });

    if (authError || !authUser) {
      throw new Error('Failed to create admin user');
    }

    // 4. Create profile
    await db.from('profiles').insert({
      id: authUser.user.id,
      email: contactEmail,
      full_name: contactName,
      role: 'admin',
      tenant_id: tenant.id,
    });

    // 5. Create tenant branding (default)
    await db.from('tenant_branding').insert({
      tenant_id: tenant.id,
      logo_url: '/default-logo.png',
      primary_color: '#16a34a',
      secondary_color: '#ea580c',
    });

    // 6. Send welcome email
    const loginUrl = `https://${slug}.www.elevateforhumanity.org/login`;
    const adminUrl = `https://${slug}.www.elevateforhumanity.org/admin`;

    await resend.emails.send({
      from: 'Elevate for Humanity <onboarding@elevateforhumanity.org>',
      to: contactEmail,
      subject: '🎉 Your Platform is Ready!',
      html: generateWelcomeEmail({
        organizationName,
        contactName,
        slug,
        loginUrl,
        adminUrl,
        email: contactEmail,
        tempPassword,
        licenseType,
      }),
    });

    // 7. Send setup guide email (5 minutes later)
    setTimeout(
      async () => {
        await resend.emails.send({
          from: 'Elevate for Humanity <onboarding@elevateforhumanity.org>',
          to: contactEmail,
          subject: '📚 Quick Start Guide - Set Up Your Platform',
          html: generateSetupGuideEmail({
            organizationName,
            contactName,
            adminUrl,
          }),
        });
      },
      5 * 60 * 1000
    ); // 5 minutes

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        loginUrl,
        adminUrl,
      },
      credentials: {
        email: contactEmail,
        tempPassword, // Only returned once
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        err:
          'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Helper functions
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function getLicenseConfig(licenseType: string) {
  switch (licenseType) {
    case 'single':
      return {
        tier: 'basic',
        maxUsers: 100,
        maxPrograms: 10,
        features: ['lms', 'enrollment', 'admin', 'payments', 'mobile-app'],
      };
    case 'school':
      return {
        tier: 'pro',
        maxUsers: 1000,
        maxPrograms: 50,
        features: [
          'lms',
          'enrollment',
          'admin',
          'payments',
          'mobile-app',
          'partner-dashboard',
          'case-management',
          'compliance',
          'white-label',
        ],
      };
    case 'enterprise':
      return {
        tier: 'enterprise',
        maxUsers: 999999,
        maxPrograms: 999999,
        features: [
          'lms',
          'enrollment',
          'admin',
          'payments',
          'mobile-app',
          'partner-dashboard',
          'case-management',
          'employer-portal',
          'compliance',
          'white-label',
          'ai-tutor',
          'api-access',
        ],
      };
    default:
      return {
        tier: 'basic',
        maxUsers: 100,
        maxPrograms: 10,
        features: ['lms', 'enrollment', 'admin', 'payments', 'mobile-app'],
      };
  }
}

function generateWelcomeEmail(data: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
    .credentials { background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #16a34a; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to Your Platform!</h1>
      <p>Your workforce training platform is ready to use</p>
    </div>

    <div class="content">
      <p>Hi ${data.contactName},</p>

      <p><strong>Congratulations!</strong> Your ${data.organizationName} training platform is now live and ready to use.</p>

      <div class="credentials">
        <h3>🔐 Your Login Credentials</h3>
        <p><strong>Platform URL:</strong> <a href="${data.loginUrl}">${data.loginUrl}</a></p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Temporary Password:</strong> <code>${data.tempPassword}</code></p>
        <p style="color: #ea580c; font-size: 14px;">⚠️ Please change your password after first login</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.adminUrl}" class="button">Access Admin Dashboard →</a>
      </div>

      <h3>✅ What's Already Set Up:</h3>
      <ul>
        <li>✅ Your admin account</li>
        <li>✅ Platform branding (customize in settings)</li>
        <li>✅ Database and security</li>
        <li>✅ Payment processing</li>
        <li>✅ Mobile app access</li>
      </ul>

      <h3>🚀 Next Steps:</h3>
      <ol>
        <li><strong>Log in</strong> and change your password</li>
        <li><strong>Customize branding</strong> (logo, colors)</li>
        <li><strong>Create your first program</strong></li>
        <li><strong>Invite instructors</strong></li>
        <li><strong>Start enrolling students</strong></li>
      </ol>

      <p>You'll receive a detailed setup guide in 5 minutes with step-by-step instructions.</p>

      <h3>📞 Need Help?</h3>
      <p>
        • <strong>Documentation:</strong> <a href="https://www.elevateforhumanity.org/docs">docs.www.elevateforhumanity.org</a><br>
        • <strong>Support:</strong> support@elevateforhumanity.org<br>
        • <strong>Live Chat:</strong> Available in your admin dashboard
      </p>

      <p>Welcome to the Elevate for Humanity family! 🎓</p>

      <p>
        Best regards,<br>
        <strong>The Elevate Team</strong>
      </p>
    </div>

    <div class="footer">
      <p>Elevate for Humanity | Workforce Training Platform</p>
      <p>Questions? Reply to this email or visit our <a href="https://www.elevateforhumanity.org/support">support center</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateSetupGuideEmail(data: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .step { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #16a34a; }
    .button { display: inline-block; background: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 Quick Start Guide</h1>
      <p>Get your platform up and running in 30 minutes</p>
    </div>

    <div class="content">
      <p>Hi ${data.contactName},</p>

      <p>Here's your step-by-step guide to launching ${data.organizationName}'s training platform:</p>

      <div class="step">
        <h3>Step 1: Customize Your Branding (5 min)</h3>
        <p>Go to <strong>Settings → Branding</strong></p>
        <ul>
          <li>Upload your logo</li>
          <li>Set your brand colors</li>
          <li>Add your organization info</li>
        </ul>
        <a href="${data.adminUrl}/settings/branding" class="button">Customize Branding →</a>
      </div>

      <div class="step">
        <h3>Step 2: Create Your First Program (10 min)</h3>
        <p>Go to <strong>Programs → Add New</strong></p>
        <ul>
          <li>Enter program name and description</li>
          <li>Set duration and requirements</li>
          <li>Add courses and lessons</li>
        </ul>
        <a href="${data.adminUrl}/programs/new" class="button">Create Program →</a>
      </div>

      <div class="step">
        <h3>Step 3: Invite Your Team (5 min)</h3>
        <p>Go to <strong>Users → Invite</strong></p>
        <ul>
          <li>Add instructors</li>
          <li>Add staff members</li>
          <li>Set roles and permissions</li>
        </ul>
        <a href="${data.adminUrl}/users/invite" class="button">Invite Team →</a>
      </div>

      <div class="step">
        <h3>Step 4: Enroll Students (10 min)</h3>
        <p>Go to <strong>Students → Enroll</strong></p>
        <ul>
          <li>Add students manually or import CSV</li>
          <li>Assign to programs</li>
          <li>Send welcome emails</li>
        </ul>
        <a href="${data.adminUrl}/students/enroll" class="button">Enroll Students →</a>
      </div>

      <h3>🎥 Video Tutorials</h3>
      <p>Watch our quick video guides:</p>
      <ul>
        <li><a href="https://www.elevateforhumanity.org/tutorials/branding">Platform Setup (5 min)</a></li>
        <li><a href="https://www.elevateforhumanity.org/tutorials/programs">Creating Programs (8 min)</a></li>
        <li><a href="https://www.elevateforhumanity.org/tutorials/enrollment">Student Enrollment (6 min)</a></li>
      </ul>

      <h3>📞 Need Help?</h3>
      <p>We're here for you:</p>
      <ul>
        <li><strong>Live Chat:</strong> Click the chat icon in your dashboard</li>
        <li><strong>Email:</strong> support@elevateforhumanity.org</li>
        <li><strong>Phone:</strong> (555) 123-4567</li>
        <li><strong>Schedule Call:</strong> <a href="https://www.elevateforhumanity.org/book">Book a setup call</a></li>
      </ul>

      <p>You've got this! 💪</p>

      <p>
        Best,<br>
        <strong>The Elevate Team</strong>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
export const POST = withApiAudit('/api/onboarding/provision-tenant', _POST);
