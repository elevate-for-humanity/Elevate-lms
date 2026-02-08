import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from "@/lib/supabase/server";
import { logger } from '@/lib/logger';
import { toError, toErrorMessage } from '@/lib/safe';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is partner
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, tenant_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "partner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get attendance records for this partner's enrollments
  const { data: records, error } = await supabase
    .from("attendance_records")
    .select(`
      *,
      enrollments!inner(
        id,
        user_id,
        course_id,
        courses(title),
        profiles(full_name, email)
      )
    `)
    .eq("enrollments.tenant_id", profile.tenant_id)
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is partner
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, tenant_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "partner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { enrollmentId, date, hours, notes } = await request.json();

  if (!enrollmentId || !date || hours === null || hours === undefined) {
    return NextResponse.json(
      { error: "enrollmentId, date, and hours are required" },
      { status: 400 }
    );
  }

  // Verify enrollment belongs to this partner's tenant
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, tenant_id")
    .eq("id", enrollmentId)
    .single();

  if (!enrollment) {
    return NextResponse.json(
      { error: "Enrollment not found" },
      { status: 404 }
    );
  }

  if (enrollment.tenant_id !== profile.tenant_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Create attendance record
  const { data: record, error } = await supabase
    .from("attendance_records")
    .insert({
      enrollment_id: enrollmentId,
      date,
      hours: Number(hours),
      source: "partner",
      recorded_by: user.id,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  // Update total hours on enrollment
  const { error: updateError } = await supabase.rpc("increment_hours_trained", {
    enrollment_id: enrollmentId,
    hours_to_add: Number(hours),
  });

  if (updateError) {
    logger.error("Failed to update hours_trained:", updateError);
  }

  // Log the attendance record
  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email,
    action: "partner_recorded_attendance",
    resource_type: "attendance_record",
    resource_id: record.id,
    metadata: {
      enrollmentId,
      date,
      hours: Number(hours),
    },
  });

  return NextResponse.json({ record });
}
