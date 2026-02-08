
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/admin/applications/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClients";
import { withAuth } from '@/lib/with-auth';
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (!program_id) {
      return NextResponse.json(
        { error: "program_id is required" },
        { status: 400 }
      );
    }

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

    // 4) Create enrollment for this program
    const { data: enrollment, error: enrollError } =
      await supabaseAdmin
        .from("enrollments")
        .insert({
          user_id: userId,
          program_id,
          status: "active",
          funding_type: funding_type || null,
          source: source || app.source || "application",
          started_at: new Date().toISOString(),
        })
        .select("*")
        .maybeSingle();

    if (enrollError || !enrollment) {
      logger.error("Enrollment error:", enrollError);
      return NextResponse.json(
        { error: "Failed to create enrollment" },
        { status: 500 }
      );
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
      // Don't fail the whole thing just for this, but log it
    }

    return NextResponse.json({
      message: "Application approved and enrolled",
      user_id: userId,
      enrollment_id: enrollment.id,
    });
  } catch (err) {
    logger.error("Approve application error:", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
