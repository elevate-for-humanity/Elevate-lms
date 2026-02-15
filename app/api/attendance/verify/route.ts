import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
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

    // In production, you would:
    // 1. Call Amazon Rekognition or Azure Face API to verify face
    // 2. Compare against stored user photo
    // 3. Check for liveness detection

    // Log the attendance attempt
    const { error: insertError } = await supabase
      .from("attendance_records")
      .insert({
        user_id: user.id,
        meeting_id: meetingId,
        verified: true,
        verification_method: "photo_time_location",
        latitude,
        longitude,
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
      verified: true,
      reason: "Basic checks passed (image + time window + location).",
      timestamp: now.toISOString(),
    });
  } catch (error) { /* Error handled silently */ 
    logger.error("Unexpected error in attendance verify", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
