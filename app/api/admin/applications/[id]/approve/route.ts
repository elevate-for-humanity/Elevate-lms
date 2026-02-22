
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/admin/applications/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClients";
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireApiAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
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
    if (!profile?.role || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const applicationId = id;
    const body = await req.json().catch(() => ({}));
    const { program_id, funding_type, source } = body;

    // program_id is optional — if missing, user is created but not enrolled in a specific course

    // 1) Load the application
    const { data: app, error: appError } = await supabaseAdmin
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

    // 🔐 Supabase Auth admin: find existing user by email
    const { data: listUsers, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({
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
        await supabaseAdmin.auth.admin.createUser({
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
      const { error: profileError } = await supabaseAdmin
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
        // Don't fail the whole operation for this
      }

      // Welcome email can be sent via /api/email/send-welcome endpoint
    }

    const userId = user.id;

    // 4) Create enrollment if program_id provided
    let enrollmentId: string | null = null;
    if (program_id) {
      const { data: enrollment, error: enrollError } =
        await supabaseAdmin
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
        // Don't fail — user was created, enrollment can be added later
      } else {
        enrollmentId = enrollment?.id || null;
      }
    }

    // 5) Update application status
    const { error: updateError } = await supabaseAdmin
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
    await supabaseAdmin
      .from("profiles")
      .update({ enrollment_status: "active" })
      .eq("id", userId);

    // 7) Send approval notification email
    try {
      if (email) {
        const { sendWelcomeEmail } = await import('@/lib/email/resend');
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

        // Get program name if enrolled
        let programName = 'Your Program';
        if (program_id) {
          const { data: program } = await supabaseAdmin
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
          dashboardUrl: `${siteUrl}/learner/dashboard`,
        });
        logger.info('Approval email sent', { userId, email });
      }
    } catch (emailErr) {
      logger.warn('Failed to send approval email (non-critical)', emailErr);
    }

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
