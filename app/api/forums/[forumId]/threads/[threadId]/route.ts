export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/forums/[forumId]/threads/[threadId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/lib/getUserIdFromRequest";
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

type Params = { params: Promise<{ forumId: string; threadId: string }> };

// GET: full thread details + posts
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { threadId } = await params;
    const supabase = await createClient();

    // Get thread details
    const { data: thread, error: threadError } = await supabase
      .from("discussion_threads")
      .select(`
        id,
        title,
        created_at,
        last_post_at,
        user_id,
        view_count,
        is_locked
      `)
      .eq("id", threadId)
      .single();

    if (threadError || !thread) {
      logger.error("[thread detail] error:", threadError);
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await supabase
      .from("discussion_threads")
      .update({ view_count: (thread.view_count || 0) + 1 })
      .eq("id", threadId);

    // Get thread creator profile
    const { data: creatorProfile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", thread.user_id)
      .single();

    // Get posts
    const { data: posts, error: postsError } = await supabase
      .from("discussion_posts")
      .select(`
        id,
        content,
        created_at,
        user_id,
        is_solution,
        likes_count
      `)
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (postsError) {
      logger.error("[thread posts] error:", postsError);
      return NextResponse.json(
        { error: "Failed to load posts" },
        { status: 500 }
      );
    }

    // Get profiles for all post authors
    const userIds = [...new Set(posts?.map((p) => p.user_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    const response = {
      thread: {
        id: thread.id,
        title: thread.title,
        createdAt: thread.created_at,
        lastActivity: thread.last_post_at || thread.created_at,
        createdByName: creatorProfile?.full_name || "Learner",
        viewCount: thread.view_count || 0,
        isLocked: thread.is_locked || false,
      },
      posts: (posts || []).map((p) => {
        const profile = profileMap.get(p.user_id);
        return {
          id: p.id,
          content: p.content,
          createdAt: p.created_at,
          authorName: profile?.full_name || "Learner",
          avatarUrl: profile?.avatar_url || null,
          isSolution: p.is_solution || false,
          likesCount: p.likes_count || 0,
        };
      }),
    };

    return NextResponse.json(response);
  } catch (error) { 
    logger.error("[thread detail] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: add a reply to the thread
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { threadId } = await params;
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const body = (await req.json()) as { content?: string };

    if (!body.content) {
      return NextResponse.json(
        { error: "Missing content" },
        { status: 400 }
      );
    }

    // Check if thread is locked
    const { data: thread } = await supabase
      .from("discussion_threads")
      .select("is_locked")
      .eq("id", threadId)
      .single();

    if (thread?.is_locked) {
      return NextResponse.json(
        { error: "Thread is locked" },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    // 1) Insert post
    const { error: postError } = await supabase
      .from("discussion_posts")
      .insert({
        thread_id: threadId,
        user_id: userId,
        content: body.content,
        created_at: now,
      });

    if (postError) {
      logger.error("[thread reply] post error:", postError);
      return NextResponse.json(
        { error: "Failed to add reply" },
        { status: 500 }
      );
    }

    // 2) Update last_post_at on thread
    const { error: updateError } = await supabase
      .from("discussion_threads")
      .update({ last_post_at: now })
      .eq("id", threadId);

    if (updateError) {
      logger.error("[thread reply] update last_post_at error:", updateError);
    }

    return NextResponse.json({ success: true });
  } catch (error) { 
    logger.error("[thread reply] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
