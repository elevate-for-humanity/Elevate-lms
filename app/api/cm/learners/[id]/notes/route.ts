
// app/api/cm/learners/[id]/notes/route.ts - Add case manager notes
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClients";
import { getAuthUser } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;

    // Get current user
    const user = await getAuthUser();
    if (!user || (user.role as string) !== "case_manager") {
      return NextResponse.json(
        { error: "Unauthorized - Case manager access required" },
        { status: 403 }
      );
    }

    const learnerId = id;
    const caseManagerId = user.id;

    // Verify case manager has access to this learner
    const { data: assignment } = await supabaseAdmin
      .from("case_manager_assignments")
      .select("id")
      .eq("case_manager_id", caseManagerId)
      .eq("learner_id", learnerId)
      .eq("status", "active")
      .maybeSingle();

    if (!assignment) {
      return NextResponse.json(
        { error: "Access denied - Learner not assigned to you" },
        { status: 403 }
      );
    }

    // Get request body
    const body = await req.json();
    const { note_type, note } = body;

    if (!note || !note.trim()) {
      return NextResponse.json(
        { error: "Note text is required" },
        { status: 400 }
      );
    }

    // Insert note
    const { data: newNote, error: insertError } = await supabaseAdmin
      .from("case_manager_notes")
      .insert({
        case_manager_id: caseManagerId,
        learner_id: learnerId,
        note_type: note_type || "check_in",
        note: note.trim(),
      })
      .select()
      .maybeSingle();

    if (insertError) {
      logger.error("Insert note error:", insertError);
      throw insertError;
    }

    return NextResponse.json({
      message: "Note added successfully",
      note: newNote,
    });
  } catch (err) {
    logger.error("Add note error:", err);
    return NextResponse.json(
      { error: "Failed to add note" },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/cm/learners/[id]/notes', _POST);
