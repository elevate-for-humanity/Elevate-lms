/** Checkpoint polling reads canonical lesson summaries, never course-sized producer artifacts. */
export async function loadCheckpointPage(db,buildId,detailId='') {
 const build=await db.from('ultimate_course_builds').select('id,course_id,status,profile,current_step,updated_at').eq('id',buildId).single();
 if(build.error)throw build.error;if(!build.data)throw Error('BUILD_NOT_FOUND');
 const [saved,canonical]=await Promise.all([
  db.from('ultimate_lesson_builds').select('id,lesson_key,competency_id,status,ultimate_lesson_steps(step,state,findings,completed_at)').eq('build_id',buildId),
  db.from('course_lessons').select('id,title,status,is_published,video_url,learning_objectives,quiz_questions,passing_score,script_text,content,media_quality_status').eq('course_id',build.data.course_id).order('order_index'),
 ]);
 if(saved.error)throw saved.error;if(canonical.error)throw canonical.error;
 const rows=(build.data.profile?.competencies??[]).map(competency=>{
  const lesson=saved.data?.find(row=>row.competency_id===competency.id);
  const canonicalId=build.data.profile?.canonicalLessonIds?.[competency.id];
  const published=canonical.data?.find(row=>row.id===canonicalId);
  const text=published?.script_text || (typeof published?.content==='string'?published.content:'');
  const video=published?.video_url;
  return {...lesson,id:lesson?.id??canonicalId??competency.id,lesson_key:competency.id,competency_id:competency.id,
    status:published?.is_published?'published':lesson?.status??'planned',canonicalLessonId:canonicalId,
    hasCheckpoint:Boolean(lesson),ultimate_lesson_steps:lesson?.ultimate_lesson_steps??[],
    preview:{videoUrl:video?'/api/admin/ultimate-course-builder/preview?'+new URLSearchParams({buildId,canonicalLessonId:canonicalId,revision:video.split('?')[0]}):null,
      mediaApproved:published?.media_quality_status==='approved',objectives:published?.learning_objectives??[],
      // Canonical lessons store learner quiz fields; the authoring preview
      // consumes the checkpoint assessment shape. Preserve zero-based answers.
      assessment:{passingScore:published?.passing_score,questions:(published?.quiz_questions??[]).map(question=>({
        ...question,prompt:question.prompt??question.question,choices:question.choices??question.options,
        answerIndex:question.answerIndex??question.correctAnswer??question.correct_answer??question.correct,
      }))},segments:text?[{title:published.title,text}]:[],
      scenes:[],published:published?.is_published===true,
      learnerPreviewUrl:canonicalId?'/api/admin/course-builder/preview?'+new URLSearchParams({courseId:build.data.course_id,lessonId:canonicalId}):null}};
 });
 if(detailId){
  const row=rows.find(row=>row.id===detailId && row.hasCheckpoint);
  if(row && !row.preview.videoUrl){
   const detail=await db.from('ultimate_lesson_builds')
    .select('media:artifacts->lesson_film_render->render->>mediaUrl,video:artifacts->lesson_film_render->render->>videoUrl,playback:artifacts->lesson_film_render->render->>playbackUrl')
    .eq('build_id',buildId).eq('id',detailId).single();
   if(detail.error)throw detail.error;
   const source=detail.data?.media??detail.data?.video??detail.data?.playback;
   if(source)row.preview.videoUrl='/api/admin/ultimate-course-builder/preview?'+new URLSearchParams({buildId,lessonBuildId:detailId,revision:source.split('?')[0]});
  }
 }
 return {...build.data,ultimate_lesson_builds:rows};
}
