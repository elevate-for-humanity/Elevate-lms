export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/forums/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all forums with thread and post counts
    const { data: forums, error: forumsError } = await db
      .from("forums")
      .select(`
        id,
        name,
        description,
        is_pinned,
        is_locked,
        created_at
      `)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (forumsError) {
      logger.error("[Forums API Error]:", forumsError);
      return NextResponse.json(
        { error: "Failed to fetch forums" },
        { status: 500 }
      );
    }

    // Get thread counts and last activity for each forum
    const forumsWithStats = await Promise.all(
      (forums || []).map(async (forum) => {
        // Get thread count
        const { count: threadCount } = await db
          .from("discussion_threads")
          .select("*", { count: "exact", head: true })
          .eq("forum_id", forum.id);

        // Get post count
        const { data: threads } = await db
          .from("discussion_threads")
          .select("id")
          .eq("forum_id", forum.id);

        const threadIds = threads?.map((t) => t.id) || [];

        let postCount = 0;
        if (threadIds.length > 0) {
          const { count } = await db
            .from("discussion_posts")
            .select("*", { count: "exact", head: true })
            .in("thread_id", threadIds);
          postCount = count || 0;
        }

        // Get last activity
        const { data: lastPost } = await db
          .from("discussion_posts")
          .select("created_at")
          .in("thread_id", threadIds)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return {
          id: forum.id,
          name: forum.name,
          description: forum.description,
          threadCount: threadCount || 0,
          postCount,
          lastActivity: lastPost?.created_at || null,
          isPinned: forum.is_pinned || false,
          isLocked: forum.is_locked || false,
        };
      })
    );

    return NextResponse.json(forumsWithStats);
  } catch (error) { 
    logger.error("[Forums API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
