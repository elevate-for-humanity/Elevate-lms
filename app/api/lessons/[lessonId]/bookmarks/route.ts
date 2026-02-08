import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;

  const { data, error }: any = await supabase
    .from("video_bookmarks")
    .select("id, label, position_seconds, created_at")
    .eq("lesson_id", lessonId)
    .eq("user_id", user.id)
    .order("position_seconds", { ascending: true });

  if (error) {
    logger.error("bookmarks GET error", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ bookmarks: data || [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;
  const body = await req.json();
  const { label, positionSeconds } = body;

  if (typeof positionSeconds !== "number") {
    return NextResponse.json(
      { error: "positionSeconds required as number" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("video_bookmarks").insert({
    user_id: user.id,
    lesson_id: lessonId,
    label: label || null,
    position_seconds: Math.floor(positionSeconds),
  });

  if (error) {
    logger.error("bookmarks POST error", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
