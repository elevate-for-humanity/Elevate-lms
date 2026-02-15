export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/study-groups/[id]/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const groupId = id;

    // Check if group exists
    const { data: group, error: groupError } = await supabase
      .from("study_groups")
      .select("id, max_members")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { error: "Study group not found" },
        { status: 404 }
      );
    }

    // Check if already a member
    const { data: existingMembership } = await supabase
      .from("study_group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { message: "Already a member" },
        { status: 200 }
      );
    }

    // Check if group is full
    if (group.max_members) {
      const { count } = await supabase
        .from("study_group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", groupId);

      if (count && count >= group.max_members) {
        return NextResponse.json(
          { error: "Study group is full" },
          { status: 400 }
        );
      }
    }

    // Add user to group
    const { error: insertError } = await supabase
      .from("study_group_members")
      .insert({
        group_id: groupId,
        user_id: user.id,
        joined_at: new Date().toISOString(),
      });

    if (insertError) {
      logger.error("[Join Study Group Error]:", insertError);
      return NextResponse.json(
        { error: "Failed to join study group" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Successfully joined study group" });
  } catch (error) { 
    logger.error("[Join Study Group Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
