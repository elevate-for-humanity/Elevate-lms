import {renderMediaUrl, renderPlaybackUrl} from '../media/playback-source.mjs';

/** Validate bounded lesson rows, then retain only matching existing publications. */
export async function verifySavedCourseLessons({db,build,profile,validate,assertActive}) {
 const saved=await db.from('ultimate_lesson_builds').select('id,competency_id,status').eq('build_id',build.id);
 if(saved.error)throw saved.error;
 const canonical=await db.from('course_lessons').select('id,status,is_published,approved,video_status,media_quality_status,video_url,film:content_json->film,attachment:content_json->mediaAttachment').eq('course_id',build.course_id);
 if(canonical.error)throw canonical.error;
 const preserved=new Set(profile.publishCompletedLessons===true ? profile.preservedPublishedLessonIds??[] : []);
 for(const competency of profile.competencies) {
  assertActive();
  const id=profile.canonicalLessonIds?.[competency.id];
  if(preserved.has(id))continue;
  const lesson=saved.data?.find(row=>row.competency_id===competency.id);
  if(!lesson || lesson.status!=='built')throw Error('ULTIMATE_COMPETENCY_NOT_COMPLETE:'+competency.id);
  const loaded=await db.from('ultimate_lesson_builds').select('artifacts').eq('build_id',build.id).eq('id',lesson.id).single();
  if(loaded.error)throw loaded.error;
  if(!loaded.data)throw Error('ULTIMATE_COMPETENCY_NOT_COMPLETE:'+competency.id);
  validate(loaded.data.artifacts,profile,competency.id);
  const render=loaded.data.artifacts?.lesson_film_render?.render;
  const prior=canonical.data?.find(row=>row.id===id);
  const source=renderMediaUrl(render),playback=renderPlaybackUrl(render);
  if(profile.publishCompletedLessons===true && prior?.status==='published' && prior.is_published===true &&
    prior.approved===true && prior.video_status==='complete' && prior.media_quality_status==='approved' &&
    playback && prior.video_url===playback && source && prior.film?.videoUrl===source &&
    render.captionsUrl && prior.film?.captionsUrl===render.captionsUrl &&
    render.transcriptUrl && prior.film?.transcriptUrl===render.transcriptUrl &&
    prior.attachment?.sourceLessonBuildId===lesson.id)preserved.add(id);
 }
 return profile.publishCompletedLessons===true ? {...profile,preservedPublishedLessonIds:[...preserved]} : profile;
}
