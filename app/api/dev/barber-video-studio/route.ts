import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  BARBER_VIDEO_DIR,
  readStudioStatus,
} from '@/lib/barber/video-studio-status';
import { BARBER_COURSE_ID } from '@/lib/barber/constants';
import { localBarberLessonVideoPath } from '@/lib/barber/resolve-lesson-video-url';

export const dynamic = 'force-dynamic';

// PUBLIC ROUTE: dev QA — live barber video generation progress (no PII)
export async function GET() {
  const studio = readStudioStatus();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let lessons: Array<{ slug: string; title: string; order_index: number }> = [];
  if (supabaseUrl && serviceKey) {
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data } = await db
      .from('course_lessons')
      .select('slug, title, order_index')
      .eq('course_id', BARBER_COURSE_ID)
      .order('order_index');
    lessons = data ?? [];
  }

  const mp4OnDisk = new Set(
    fs.existsSync(BARBER_VIDEO_DIR)
      ? fs.readdirSync(BARBER_VIDEO_DIR).filter((f) => f.endsWith('.mp4'))
      : [],
  );

  const items = lessons.map((lesson) => {
    const fileName = `${lesson.slug}.mp4`;
    const diskPath = path.join(BARBER_VIDEO_DIR, fileName);
    const onDisk = mp4OnDisk.has(fileName);
    let sizeMb: number | null = null;
    const durationSec: number | null = null;
    if (onDisk && fs.existsSync(diskPath)) {
      sizeMb = Math.round((fs.statSync(diskPath).size / 1024 / 1024) * 10) / 10;
    }

    const localUrl = onDisk ? localBarberLessonVideoPath(lesson.slug) : null;
    const cdnUrl =
      supabaseUrl && onDisk
        ? `${supabaseUrl}/storage/v1/object/public/course-videos/barber/${fileName}`
        : null;

    const isCurrent = studio.currentSlug === lesson.slug;
    let status: 'missing' | 'ready' | 'rendering' = 'missing';
    if (onDisk) status = 'ready';
    else if (isCurrent) status = 'rendering';

    return {
      slug: lesson.slug,
      title: lesson.title,
      order_index: lesson.order_index,
      status,
      localUrl,
      cdnUrl,
      sizeMb,
      durationSec,
      isCurrent,
    };
  });

  const readyCount = items.filter((i) => i.status === 'ready').length;

  return NextResponse.json({
    studio,
    readyCount,
    totalLessons: items.length || studio.totalLessons,
    items,
    refreshedAt: new Date().toISOString(),
  });
}
