
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/admin/applications/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireApiAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, createAuditedAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  // Auth guard: require authenticated admin user
  try {
    await requireApiAuth();
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile?.role || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden — approval requires admin or super_admin' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const adminDb = await createAuditedAdminClient({
    actorUserId: adminUser?.id,
    systemActor: 'admin_application_approval',
  });
  if (!adminDb) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const applicationId = id;
    const body = await req.json().catch(() => ({}));
    const { program_id, funding_type } = body;

    // 1) Load the application
    const { data: app, error: appError } = await adminDb
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();

    if (appError || !app) {
      logger.error("Application not found:", appError);
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // 2) Check if user already exists by email
    const email = app.email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { error: "Application has no email address" },
        { status: 400 }
      );
    }

    const appSource = app.source as string | undefined;

    // ── Program holder applications get a separate approval flow ──
    if (appSource === 'program-holder-application') {
      return approveProgramHolder(adminDb, app, email, applicationId);
    }

    // ── Standard student/employer approval flow ──

    // Find existing user by email
    const { data: listUsers, error: listError } =
      await adminDb.auth.admin.listUsers({
        page: 1,
        perPage: 100,
      });

    if (listError) {
      logger.error("List users error:", listError);
    }

    let user = listUsers?.users?.find(
      (item) => item.email?.toLowerCase() === email
    );

    // 3) If no user, create one with a temp password
    if (!user) {
      const tempPassword = `EFH-${Math.random()
        .toString(36)
        .slice(2, 10)}-Temp!`;

      const { data: newUser, error: createError } =
        await adminDb.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: false,
          user_metadata: {
            first_name: app.first_name,
            last_name: app.last_name,
            phone: app.phone,
            source: app.source || "application",
            role: "student",
          },
        });

      if (createError || !newUser.user) {
        logger.error("Create user error:", createError);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }

      user = newUser.user;

      // Create profile entry
      const { error: profileError } = await adminDb
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          first_name: app.first_name,
          last_name: app.last_name,
          phone: app.phone,
          role: "student",
        });

      if (profileError) {
        logger.error("Profile creation error:", profileError);
      }
    }

    const userId = user.id;

    // 4) Create enrollment if program_id provided
    let enrollmentId: string | null = null;
    if (program_id) {
      const { data: enrollment, error: enrollError } =
        await adminDb
          .from("training_enrollments")
          .insert({
            user_id: userId,
            program_id,
            status: "active",
            funding_source: funding_type || null,
            enrolled_at: new Date().toISOString(),
          })
          .select("*")
          .maybeSingle();

      if (enrollError) {
        logger.error("Enrollment error:", enrollError);
      } else {
        enrollmentId = enrollment?.id || null;
      }
    }

    // 4b) Also create program_enrollments record (used by onboarding/dashboard pages)
    if (program_id) {
      await adminDb
        .from("program_enrollments")
        .upsert({
          user_id: userId,
          program_id,
          email,
          full_name: `${app.first_name || ''} ${app.last_name || ''}`.trim(),
          amount_paid_cents: 0,
          funding_source: funding_type || 'pending',
          status: 'active',
          enrollment_state: 'enrolled',
        }, { onConflict: 'user_id,program_id', ignoreDuplicates: true })
        .then(({ error }) => {
          if (error) logger.error("program_enrollments upsert error:", error);
        });
    }

    // 5) Update application status
    const { error: updateError } = await adminDb
      .from("applications")
      .update({
        status: "converted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateError) {
      logger.error("Update application status error:", updateError);
    }

    // 6) Update profile enrollment_status
    await adminDb
      .from("profiles")
      .update({ enrollment_status: "active" })
      .eq("id", userId);

    // 7) Send approval notification email
    try {
      if (email) {
        const { sendWelcomeEmail } = await import('@/lib/email/resend');
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

        let programName = 'Your Program';
        if (program_id) {
          const { data: program } = await adminDb
            .from('programs')
            .select('name')
            .eq('id', program_id)
            .single();
          if (program?.name) programName = program.name;
        }

        await sendWelcomeEmail({
          email,
          name: `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'Student',
          programName,
          dashboardUrl: `${siteUrl}/lms/dashboard`,
        });
        logger.info('Approval email sent', { userId, email });
      }
    } catch (emailErr) {
      logger.warn('Failed to send approval email (non-critical)', emailErr);
    }

    await logAdminAudit({
      action: AdminAction.APPLICATION_APPROVED,
      actorId: user.id,
      entityType: 'applications',
      entityId: applicationId,
      metadata: { created_user_id: userId, program_id: program_id || null, funding_type: funding_type || null },
      req,
    });

    return NextResponse.json({
      message: program_id
        ? "Application approved, user created, and enrolled"
        : "Application approved and user created (no program assigned)",
      user_id: userId,
      enrollment_id: enrollmentId,
    });
  } catch (err) {
    logger.error("Approve application error:", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}

// ── Program holder application: create user + holder row as PENDING ──
// Does NOT activate — admin must use /admin/program-holders/[id] to
// do the atomic approve+provision flow (enforces minimum 1 program).
async function approveProgramHolder(
  db: SupabaseClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app: Record<string, any>,
  email: string,
  applicationId: string,
) {
  // Find or create auth user
  const { data: listUsers } = await db.auth.admin.listUsers({ page: 1, perPage: 100 });
  let user = listUsers?.users?.find((u) => u.email?.toLowerCase() === email);

  if (!user) {
    const tempPassword = `EFH-${Math.random().toString(36).slice(2, 10)}-Temp!`;
    const { data: newUser, error: createError } = await db.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false,
      user_metadata: {
        first_name: app.first_name,
        last_name: app.last_name,
        phone: app.phone,
        source: 'program-holder-application',
        // role intentionally omitted — set via profiles.role after approval
      },
    });
    if (createError || !newUser.user) {
      logger.error('Create program holder user error:', createError);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
    user = newUser.user;
  }

  const userId = user.id;
  const fullName = `${app.first_name || ''} ${app.last_name || ''}`.trim();

  // Parse organization name from support_notes (stored as "Organization: Foo | ...")
  let orgName = fullName || 'Unknown Organization';
  const notes = (app.support_notes || app.notes || '') as string;
  const orgMatch = notes.match(/Organization:\s*([^|]+)/);
  if (orgMatch) orgName = orgMatch[1].trim();

  // Create holder row as PENDING — activation requires program provisioning
  const { data: holderRow } = await db
    .from('program_holders')
    .upsert({
      user_id: userId,
      organization_name: orgName,
      contact_name: fullName,
      contact_email: email,
      contact_phone: app.phone || null,
      status: 'pending',
      name: orgName,
    }, { onConflict: 'user_id' })
    .select('id')
    .single();

  // Link profile to holder row but keep role as-is until full approval
  await db
    .from('profiles')
    .upsert({
      id: userId,
      email,
      first_name: app.first_name,
      last_name: app.last_name,
      phone: app.phone,
      program_holder_id: holderRow?.id || null,
    }, { onConflict: 'id' });

  // Mark application as pending-review (not converted — holder still needs provisioning)
  await db
    .from('applications')
    .update({ status: 'pending-review', updated_at: new Date().toISOString() })
    .eq('id', applicationId);

  logger.info('[PH Application] Holder row created, pending program provisioning', {
    userId,
    holderId: holderRow?.id,
    org: orgName,
  });

  return NextResponse.json({
    message: 'Program holder application processed. Holder is pending — go to /admin/program-holders to approve and provision a program.',
    user_id: userId,
    holder_id: holderRow?.id || null,
    next_step: `/admin/program-holders/${holderRow?.id}`,
  });
}
export const POST = withApiAudit('/api/admin/applications/[id]/approve', _POST);
