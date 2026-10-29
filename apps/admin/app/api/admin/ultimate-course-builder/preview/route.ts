import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { signedLessonPlayback } from '@/lib/storage/lesson-playback';
import { streamLessonMedia } from '@/lib/storage/lesson-stream';
import { renderMediaUrl } from '@/lib/ultimate-course-builder/media/playback-source.mjs';
import { ownerApprovedPreview } from '@/lib/ultimate-course-builder/media/owner-approved-preview.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

export async function GET(req: NextRequest) {
  const auth = await apiRequireAdmin(req); if (auth.error) return auth.error;
  const buildId = req.nextUrl.searchParams.get('buildId');
  const lessonBuildId = req.nextUrl.searchParams.get('lessonBuildId');
  const canonicalLessonId=req.nextUrl.searchParams.get('canonicalLessonId');
  if(canonicalLessonId){
    if(![buildId,canonicalLessonId].every(value=>/^[a-f0-9-]{36}$/i.test(value??'')))
      return NextResponse.json({error:'Select a saved lesson.'},{status:400,headers});
    try{
      const db=await requireAdminClient();
      const build=await db.from('ultimate_course_builds').select('course_id').eq('id',buildId).maybeSingle();
      if(build.error)throw build.error;
      if(!build.data)return NextResponse.json({error:'Build not found'},{status:404,headers});
      const lesson=await db.from('course_lessons').select('id,video_url').eq('id',canonicalLessonId).eq('course_id',build.data.course_id).maybeSingle();
      if(lesson.error)throw lesson.error;
      if(!lesson.data?.video_url)return NextResponse.json({error:'No saved video yet'},{status:404,headers});
      return await streamLessonMedia(req, await signedLessonPlayback(db, lesson.data.video_url));
    }catch{return NextResponse.json({error:'Saved video access could not be renewed'},{status:503,headers});}
  }
  if (![buildId, lessonBuildId].every(value => /^[a-f0-9-]{36}$/i.test(value ?? '')))
    return NextResponse.json({error:'Select a saved lesson.'}, {status:400, headers});
  try {
    const db = await requireAdminClient();
    const lesson = await db.from('ultimate_lesson_builds').select('id,competency_id,artifacts')
      .eq('id', lessonBuildId).eq('build_id', buildId).maybeSingle();
    if (lesson.error) throw lesson.error;
    if (!lesson.data) return NextResponse.json({error:'Lesson not found'}, {status:404, headers});
    if(req.nextUrl.searchParams.get('kind')==='approved'){
      const build=await db.from('ultimate_course_builds').select('course_id,profile').eq('id',buildId).maybeSingle();
      if(build.error)throw build.error;
      const approved=await ownerApprovedPreview(db,build.data,lesson.data);
      if(!approved)return NextResponse.json({error:'No matching owner-approved published video.'},{status:404,headers});
      const location=await signedLessonPlayback(db,approved.videoUrl);
      return await streamLessonMedia(req, location);
    }
    const artifactVersionId = req.nextUrl.searchParams.get('artifactVersionId');
    if (artifactVersionId) {
      if (!/^[a-f0-9-]{36}$/i.test(artifactVersionId)) return NextResponse.json({error:'Invalid video version.'},{status:400,headers});
      const artifact = await db.from('ultimate_artifacts').select('id').eq('build_id',buildId)
        .eq('lesson_build_id',lessonBuildId).eq('stage','lesson_film_render').eq('artifact_type','stage_output').single();
      if (artifact.error || !artifact.data) return NextResponse.json({error:'Video artifact not found.'},{status:404,headers});
      const version = await db.from('ultimate_artifact_versions').select('content').eq('artifact_id',artifact.data.id).eq('id',artifactVersionId).single();
      if (version.error) throw version.error;
      const video = renderMediaUrl(version.data?.content?.render);
      if (!video) return NextResponse.json({error:'Saved video version not found.'},{status:404,headers});
      return await streamLessonMedia(req, await signedLessonPlayback(db, video));
    }
    let source = renderMediaUrl(lesson.data.artifacts?.lesson_film_render?.render);
    if (!source) {
      const artifact = await db.from('ultimate_artifacts').select('id').eq('build_id', buildId)
        .eq('lesson_build_id', lessonBuildId).eq('stage', 'lesson_film_render').eq('artifact_type', 'stage_output').maybeSingle();
      if (artifact.error) throw artifact.error;
      if (artifact.data) {
        const versions = await db.from('ultimate_artifact_versions').select('content')
          .eq('artifact_id', artifact.data.id).order('version', {ascending:false}).limit(20);
        if (versions.error) throw versions.error;
        source = (versions.data ?? []).map((row: any) => renderMediaUrl(row.content?.render)).find(Boolean) ?? null;
      }
    }
    if (!source) return NextResponse.json({error:'No saved video yet'}, {status:404, headers});
    const location = await signedLessonPlayback(db, source);
    return await streamLessonMedia(req, location);
  } catch {
    return NextResponse.json({error:'Saved video access could not be renewed'}, {status:503, headers});
  }
}

export const HEAD = GET;
