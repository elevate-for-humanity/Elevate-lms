

// app/api/videos/[videoId]/meta/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ videoId: string }> };

async function _GET(req: NextRequest, { params }: Params) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { videoId } = await params;
    const supabase = await createClient();

    // Get video chapters
    const { data: chapters, error: chaptersError } = await supabase
      .from("video_chapters")
      .select("*")
      .eq("video_id", videoId)
      .order("start_time", { ascending: true });

    if (chaptersError) {
      logger.error("Error fetching chapters:", chaptersError);
    }

    // Get video transcript (lesson_id stores the video reference)
    const { data: transcript, error: transcriptError } = await supabase
      .from("video_transcripts")
      .select("*")
      .eq("lesson_id", videoId)
      .single();

    if (transcriptError && transcriptError.code !== "PGRST116") {
      logger.error("Error fetching transcript:", transcriptError);
    }

    return NextResponse.json({
      chapters: chapters || [],
      transcript: transcript || null,
    });
  } catch (error) { 
    logger.error("[Video Meta Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function _POST(req: NextRequest, { params }: Params) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { videoId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { chapters, transcript } = body;

    // Update chapters if provided
    if (chapters && Array.isArray(chapters)) {
      // Delete existing chapters
      await supabase.from("video_chapters").delete().eq("video_id", videoId);

      // Insert new chapters
      if (chapters.length > 0) {
        const { error: chaptersError } = await supabase
          .from("video_chapters")
          .insert(
            chapters.map((item: any) => ({
              video_id: videoId,
              title: item.title,
              start_time: item.start_time,
              end_time: item.end_time,
            }))
          );

        if (chaptersError) {
          logger.error("Error inserting chapters:", chaptersError);
          return NextResponse.json(
            { error: "Failed to save chapters" },
            { status: 500 }
          );
        }
      }
    }

    // Update transcript if provided
    if (transcript) {
      // Check if transcript exists
      const { data: existing } = await supabase
        .from("video_transcripts")
        .select("id")
        .eq("lesson_id", videoId)
        .single();

      if (existing) {
        // Update existing
        const { error: transcriptError } = await supabase
          .from("video_transcripts")
          .update({
            transcript_text: transcript.content,
            language: transcript.language || "en",
          })
          .eq("lesson_id", videoId);

        if (transcriptError) {
          logger.error("Error updating transcript:", transcriptError);
          return NextResponse.json(
            { error: "Failed to update transcript" },
            { status: 500 }
          );
        }
      } else {
        // Insert new
        const { error: transcriptError } = await supabase
          .from("video_transcripts")
          .insert({
            lesson_id: videoId,
            transcript_text: transcript.content,
            language: transcript.language || "en",
          });

        if (transcriptError) {
          logger.error("Error inserting transcript:", transcriptError);
          return NextResponse.json(
            { error: "Failed to save transcript" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) { 
    logger.error("[Video Meta Update Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/videos/[videoId]/meta', _GET);
export const POST = withApiAudit('/api/videos/[videoId]/meta', _POST);
