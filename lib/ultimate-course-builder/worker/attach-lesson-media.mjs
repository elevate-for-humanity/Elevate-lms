/** The database attaches the saved film under the current lease and reads it
 * back atomically. A failed handoff must never advance the course cursor. */
export async function attachCompletedLessonMedia({db,job,workerId,generation,profile,result,validate,assertActive}) {
 if (!result.completed || result.previewReady) return [];
 const attached=[];
 for (const lesson of result.lessons ?? []) {
  assertActive();
  validate(lesson.result.artifacts,profile,lesson.competencyId);
  const canonical=profile.canonicalLessonIds?.[lesson.competencyId];
  if (!canonical) throw Error('ULTIMATE_ATTACHMENT_CANONICAL_MAPPING_REQUIRED');
  const {data,error}=await db.rpc('ultimate_attach_lesson_media',{
   p_lesson:lesson.lessonBuildId,p_artifacts:lesson.result.artifacts,
   p_job:job.id,p_worker:workerId,p_generation:generation,
  });
  if(error)throw Error('ULTIMATE_ATTACHMENT_FAILED:'+error.message);
  assertActive();
  if(data?.lessonId!==canonical || !data.videoUrl ||
   (!data.preservedPublished && data.sourceLessonBuildId!==lesson.lessonBuildId))
   throw Error('ULTIMATE_ATTACHMENT_READBACK_FAILED');
  attached.push(data);
 }
 if(!attached.length)throw Error('ULTIMATE_ATTACHMENT_COMPLETED_LESSON_REQUIRED');
 return attached;
}
