export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/study-groups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all study groups
    const { data: groups, error: groupsError } = await supabase
      .from("study_groups")
      .select(`
        id,
        name,
        description,
        modality,
        schedule,
        location,
        meeting_link,
        max_members,
        next_session,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (groupsError) {
      logger.error("[Study Groups API Error]:", groupsError);
      return NextResponse.json(
        { error: "Failed to fetch study groups" },
        { status: 500 }
      );
    }

    // Get membership info for each group
    const groupsWithMembership = await Promise.all(
      (groups || []).map(async (group) => {
        // Get member count
        const { count: memberCount } = await supabase
          .from("study_group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_id", group.id);

        // Check if current user is a member
        const { data: membership } = await supabase
          .from("study_group_members")
          .select("id")
          .eq("group_id", group.id)
          .eq("user_id", user.id)
          .single();

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          modality: group.modality,
          schedule: group.schedule,
          location: group.location,
          meetingLink: group.meeting_link,
          memberCount: memberCount || 0,
          maxMembers: group.max_members,
          isMember: !!membership,
          nextSession: group.next_session,
        };
      })
    );

    return NextResponse.json(groupsWithMembership);
  } catch (error) { 
    logger.error("[Study Groups API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
