import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      logger.error("Authentication error in attendance verify", authError);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      logger.error("Failed to parse request body", parseError as Error);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { imageBase64, latitude, longitude, scheduledStart, meetingId } = body;

    // Validate image presence
    if (!imageBase64) {
      return NextResponse.json(
        { verified: false, reason: "Missing image" },
        { status: 400 }
      );
    }

    // Time window validation (within 30 minutes of scheduled start)
    const scheduled = scheduledStart ? new Date(scheduledStart) : null;
    const now = new Date();

    if (scheduled) {
      if (isNaN(scheduled.getTime())) {
        return NextResponse.json(
          { verified: false, reason: "Invalid scheduled start time" },
          { status: 400 }
        );
      }

      const diffMinutes = Math.abs(
        (now.getTime() - scheduled.getTime()) / 60000
      );
      if (diffMinutes > 30) {
        return NextResponse.json({
          verified: false,
          reason: "Outside allowed check-in window (±30 minutes)",
        });
      }
    }

    // Geofencing validation (if coordinates provided)
    if (latitude !== undefined && longitude !== undefined) {
      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return NextResponse.json(
          { verified: false, reason: "Invalid coordinates" },
          { status: 400 }
        );
      }
    }

    // Verify the meeting exists and the user is enrolled in its cohort
    if (!meetingId) {
      return NextResponse.json(
        { verified: false, reason: "Missing meetingId" },
        { status: 400 }
      );
    }

    const { data: meeting, error: meetingError } = await supabase
      .from("cohort_sessions")
      .select("id, cohort_id")
      .eq("id", meetingId)
      .maybeSingle();

    if (meetingError || !meeting) {
      return NextResponse.json(
        { verified: false, reason: "Meeting not found" },
        { status: 404 }
      );
    }

    // Verify the user is enrolled in this cohort
    const { data: enrollment } = await supabase
      .from("training_enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("cohort_id", meeting.cohort_id)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json(
        { verified: false, reason: "Not enrolled in this session" },
        { status: 403 }
      );
    }

    // Prevent duplicate check-in for the same meeting
    const { data: existing } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("user_id", user.id)
      .eq("meeting_id", meetingId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        verified: true,
        reason: "Already checked in",
        timestamp: now.toISOString(),
      });
    }

    // Record attendance — verified=false until face verification is implemented
    const { error: insertError } = await supabase
      .from("attendance_records")
      .insert({
        user_id: user.id,
        meeting_id: meetingId,
        verified: false,
        verification_method: "photo_time_location_pending",
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        checked_in_at: now.toISOString(),
      });

    if (insertError) {
      logger.error("Failed to insert attendance record", insertError as Error, {
        userId: user.id,
        meetingId,
      });
      return NextResponse.json(
        { error: "Failed to record attendance" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      verified: false,
      reason: "Check-in recorded. Pending instructor verification.",
      timestamp: now.toISOString(),
    });
  } catch (error) { 
    logger.error("Unexpected error in attendance verify", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/attendance/verify', _POST);
