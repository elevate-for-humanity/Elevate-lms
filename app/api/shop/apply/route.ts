// PUBLIC ROUTE: shop application form


import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent, AuditActions } from '@/lib/audit';
import { resend } from '@/lib/resend';
import { hydrateProcessEnv } from '@/lib/secrets';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
  await hydrateProcessEnv();
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const supabase = await createClient();

    const {
      shop_name,
      owner_name,
      email,
      phone,
      address,
      city,
      state,
      zip,
      license_number,
      years_in_business,
      message,
    } = body;

    // Validate required fields
    if (!shop_name || !owner_name || !email || !phone || !license_number) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create or get auth user for shop owner
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });

    const userId = authUser?.user?.id;

    if (!userId) {
      // Error: $1
      return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
    }

    // Create user profile
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: owner_name,
      email,
      phone,
      role: 'shop_owner',
    });

    if (profileError) {
      // Error: $1
    }

    // Create shop record
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .insert({
        name: shop_name,
        owner_id: userId,
        license_number,
        address,
        city,
        state,
        zip,
        phone,
        email,
        years_in_business: parseInt(years_in_business, 10) || 0,
        status: 'pending',
        approved: false,
      })
      .select()
      .single();

    if (shopError) {
      // Error: $1
      return NextResponse.json({ error: 'Shop creation failed' }, { status: 500 });
    }

    // Create shop staff record
    await supabase.from('shop_staff').insert({
      shop_id: shop.id,
      user_id: userId,
      role: 'owner',
    });

    // Create onboarding record
    await supabase.from('shop_onboarding').insert({
      shop_id: shop.id,
      application_submitted: true,
      application_notes: message || null,
    });

    // Send welcome email
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@elevateforhumanity.org',
        to: email,
        subject: 'Shop Partner Application Received - Elevate for Humanity',
        text: `
Hello ${owner_name},

Thank you for applying to become a shop partner with Elevate for Humanity!

We've received your application for ${shop_name} and will review it within 2-3 business days.

What happens next:
• Our team will review your application and credentials
• We'll verify your shop license and location
• You'll receive an email with next steps for onboarding
• Once approved, you can begin the document upload process

If you have any questions, please don't hesitate to reach out.

Welcome to the Elevate for Humanity network!

— Elevate for Humanity Team
        `,
      });
    } catch (emailError) {
        logger.error("Unhandled error", emailError instanceof Error ? emailError : undefined);
    }

    // Log audit event
    await logAuditEvent({
      userId,
      action: AuditActions.USER_CREATED,
      resourceType: 'shop',
      resourceId: shop.id,
      metadata: {
        shop_name,
        license_number,
        city,
        state,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      shop_id: shop.id,
      user_id: userId,
    });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { error: 'Application failed' },
      { status: 500 }
    );
  }
}
