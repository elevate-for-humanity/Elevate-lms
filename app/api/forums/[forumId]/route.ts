
// app/api/forums/[forumId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/lib/getUserIdFromRequest";
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ forumId: string }> };

// GET: list threads for a forum
async function _GET(_req: NextRequest, { params }: Params) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { forumId } = await params;
    const supabase = await createClient();

    // Get threads with creator info
    const { data: threads, error: threadsError } = await supabase
      .from("discussion_threads")
      .select(`
        id,
        title,
        created_at,
        last_post_at,
        user_id,
        view_count,
        is_pinned,
        is_locked
      `)
      .eq("forum_id", forumId)
      .order("is_pinned", { ascending: false })
      .order("last_post_at", { ascending: false, nullsFirst: false });

    if (threadsError) {
      logger.error("[threads list] error:", threadsError);
      return NextResponse.json(
        { error: "Failed to load threads" },
        { status: 500 }
      );
    }

    // Get user profiles for thread creators
    const userIds = [...new Set(threads?.map((t) => t.user_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    // Get reply counts for each thread
    const threadIds = threads?.map((t) => t.id) || [];
    const { data: posts } = await supabase
      .from("discussion_posts")
      .select("thread_id")
      .in("thread_id", threadIds);

    const repliesByThread: Record<string, number> = {};
    posts?.forEach((post) => {
      repliesByThread[post.thread_id] = (repliesByThread[post.thread_id] || 0) + 1;
    });

    const result = (threads || []).map((t) => {
      const profile = profileMap.get(t.user_id);
      return {
        id: t.id,
        title: t.title,
        createdAt: t.created_at,
        lastActivity: t.last_post_at || t.created_at,
        createdByName: profile?.full_name || "Learner",
        replyCount: repliesByThread[t.id] || 0,
        viewCount: t.view_count || 0,
        isPinned: t.is_pinned || false,
        isLocked: t.is_locked || false,
      };
    });

    return NextResponse.json(result);
  } catch (error) { 
    logger.error("[threads list] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: create new thread in a forum
async function _POST(req: NextRequest, { params }: Params) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { forumId } = await params;
    const supabase = await createClient();
    const body = (await req.json()) as { title?: string; content?: string };

    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: "Missing title or content" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // 1) Create thread
    const { data: thread, error: threadError } = await supabase
      .from("discussion_threads")
      .insert({
        forum_id: forumId,
        title: body.title,
        user_id: userId,
        created_at: now,
        last_post_at: now,
      })
      .select()
      .single();

    if (threadError || !thread) {
      logger.error("[threads create] thread error:", threadError);
      return NextResponse.json(
        { error: "Failed to create thread" },
        { status: 500 }
      );
    }

    // 2) Create first post
    const { error: postError } = await supabase
      .from("discussion_posts")
      .insert({
        thread_id: thread.id,
        user_id: userId,
        content: body.content,
        created_at: now,
      });

    if (postError) {
      logger.error("[threads create] post error:", postError);
      return NextResponse.json(
        { error: "Failed to create initial post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, threadId: thread.id });
  } catch (error) { 
    logger.error("[threads create] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/forums/[forumId]', _GET);
export const POST = withApiAudit('/api/forums/[forumId]', _POST);
