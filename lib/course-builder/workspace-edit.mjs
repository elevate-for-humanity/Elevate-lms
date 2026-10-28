export function draftLessonHtml(value){
 const escape=text=>text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
 return value.split(/\n{2,}/).map(paragraph=>'<p>'+escape(paragraph).replace(/\n/g,'<br>')+'</p>').join('\n');
}
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function validateCourseEdit(value,hasLesson) {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('AI_EDIT_INVALID');
 if(Object.keys(value).some(key=>!['course','lesson'].includes(key)))throw Error('AI_EDIT_FIELD_NOT_SUPPORTED');
 const patch={course:{},lesson:{}};
 for(const [scope,fields] of [['course',['title','description']],['lesson',['title','content']]]){
  const source=value[scope];if(source==null)continue;
  if(typeof source!=='object'||Array.isArray(source))throw Error('AI_EDIT_INVALID');
  if(Object.keys(source).some(key=>!fields.includes(key)))throw Error('AI_EDIT_FIELD_NOT_SUPPORTED');
  for(const key of fields)if(source[key]!==undefined){
   if(typeof source[key]!=='string'||!source[key].trim()||source[key].length>(key==='title'?250:40000))throw Error('AI_EDIT_INVALID');
   patch[scope][key]=source[key].trim();
  }
 }
 if(Object.keys(patch.lesson).length&&!hasLesson)throw Error('SELECT_LESSON_BEFORE_EDITING');
 if(!Object.keys(patch.course).length&&!Object.keys(patch.lesson).length)throw Error('AI_EDIT_EMPTY');
 return patch;
}
/** Keep the published course untouched. Revisions get new canonical identities. */
export async function saveCourseEdit({db,sourceCourse,sourceLessons,sourceModules,lessonId,patch,actorId,requestId,uuid=()=>crypto.randomUUID()}) {
 if(!UUID.test(sourceCourse.id)||!UUID.test(actorId))throw Error('COURSE_EDIT_ID_REQUIRED');
 const target=lessonId?sourceLessons.find(row=>row.id===lessonId):null;
 if(lessonId&&!target)throw Error('LESSON_NOT_IN_SELECTED_COURSE');
 patch=validateCourseEdit(patch,Boolean(target));
 let courseId=sourceCourse.id,newLessonId=lessonId,createdRevision=false;
 if(sourceCourse.status==='published'){
  const {cloneEditedCourseRevision}=await import('./clone-service.ts');
  const revision=await cloneEditedCourseRevision({db,sourceCourse,sourceLessons,sourceModules,lessonId,patch,actorId,requestId,uuid});
  if(revision.reused)return {...revision,status:'draft',createdRevision:true};
  courseId=revision.courseId;newLessonId=revision.lessonId;createdRevision=true;
 }else{
  if(!['draft','review','ready','pending_review'].includes(sourceCourse.status))throw Error('COURSE_NOT_EDITABLE');
  if(Object.keys(patch.course).length){
   const changed=await db.from('courses').update({...patch.course,updated_at:new Date().toISOString()})
    .eq('id',courseId).eq('status',sourceCourse.status).select('id').single();
   if(changed.error)throw changed.error;if(!changed.data)throw Error('COURSE_CHANGED_DURING_EDIT');
  }
  if(target&&Object.keys(patch.lesson).length){
   const update={...patch.lesson,updated_at:new Date().toISOString()};
   if(patch.lesson.content){update.video_url=null;update.approved=false;update.media_quality_status='unverified';update.script_text=null;update.rendered_html=draftLessonHtml(patch.lesson.content);
    const {film,mediaAttachment,...content}=target.content_json??{};update.content_json={...content,experience:{...(content.experience??{}),readingGuide:{summary:patch.lesson.content,sections:[]}},revisionInstruction:patch.lesson.content};}
   const changed=await db.from('course_lessons').update(update).eq('id',target.id).eq('course_id',courseId).eq('is_published',false).select('id').single();
   if(changed.error)throw changed.error;if(!changed.data)throw Error('PUBLISHED_LESSON_REQUIRES_REVISION');
  }
 }
 return {courseId,lessonId:newLessonId??null,status:'draft',createdRevision,requiresBuild:true,
  previewUrl:'/api/admin/course-builder/preview?'+new URLSearchParams({courseId,...(newLessonId?{lessonId:newLessonId}:{})})};
}
