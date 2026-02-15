import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TransitionRequest {
  application_type: string;
  application_id: string;
  new_state: string;
  reason?: string;
}

const tableMap: Record<string, string> = {
  student: "student_applications",
  partner: "partner_applications",
  employer: "employer_applications",
};

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    // Verify admin role
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: TransitionRequest = await request.json();
    const { application_type, application_id, new_state, reason } = body;

    if (!application_type || !application_id || !new_state) {
      return NextResponse.json(
        { error: "Missing required fields: application_type, application_id, new_state" },
        { status: 400 }
      );
    }

    const tableName = tableMap[application_type];
    if (!tableName) {
      return NextResponse.json(
        { error: `Unknown application type: ${application_type}` },
        { status: 400 }
      );
    }

    // Get current state
    const { data: currentApp, error: fetchError } = await supabase
      .from(tableName)
      .select("id, state")
      .eq("id", application_id)
      .single();

    if (fetchError || !currentApp) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const oldState = currentApp.state;

    // Update the application state
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        state: new_state,
        state_updated_at: new Date().toISOString(),
      })
      .eq("id", application_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update state", details: updateError.message },
        { status: 500 }
      );
    }

    // Log the state transition event
    const { error: eventError } = await supabase
      .from("application_state_events")
      .insert({
        application_type,
        application_id,
        from_state: oldState,
        to_state: new_state,
        actor_id: user.id,
        reason: reason || `State changed from ${oldState} to ${new_state}`,
        metadata: {
          actor_role: profile.role,
          timestamp: new Date().toISOString(),
        },
      });

    if (eventError) {
      logger.error("Failed to log state event:", eventError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      application_id,
      application_type,
      old_state: oldState,
      new_state,
      event_logged: !eventError,
    });
  } catch (error) {
    logger.error("Transition error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
