export function draftLessonHtml(value){
 const escape=text=>text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
 return value.split(/\n{2,}/).map(paragraph=>'<p>'+escape(paragraph).replace(/\n/g,'<br>')+'</p>').join('\n');
}
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const pick=(row,keys)=>Object.fromEntries(keys.filter(key=>row[key]!==undefined).map(key=>[key,row[key]]));
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
  const existing=await db.from('courses').select('id,metadata').contains('metadata',{course_ai_edit_request_id:requestId}).maybeSingle();
  if(existing.error)throw existing.error;
  if(existing.data){
    if(existing.data.metadata?.course_ai_edit_complete!==true)throw Error('DRAFT_REVISION_INCOMPLETE_REQUIRES_REVIEW');
    return {courseId:existing.data.id,lessonId:existing.data.metadata.ai_edited_lesson_id??null,status:'draft',createdRevision:true,reused:true};
  }
  courseId=uuid();createdRevision=true;
  const courseFields=['program_id','description','short_description','org_id','compliance_profile_key','governing_body','governing_region','governing_standard_version','duration_hours','passing_score'];
  const created=await db.from('courses').insert({...pick(sourceCourse,courseFields),id:courseId,
   title:patch.course.title??sourceCourse.title+' — Draft revision',slug:sourceCourse.slug+'-revision-'+courseId.slice(0,8),
   ...patch.course,status:'draft',is_active:false,created_by:actorId,
   metadata:{...(sourceCourse.metadata??{}),source_course_id:sourceCourse.id,course_ai_edit_request_id:requestId,course_ai_edit_complete:false}});
  if(created.error)throw created.error;
  const moduleIds=new Map(sourceModules.map(row=>[row.id,uuid()]));
  if(sourceModules.length){
   const modules=await db.from('course_modules').insert(sourceModules.map(row=>({
    ...pick(row,['title','slug','order_index','target_hours','domain_key','metadata']),
    id:moduleIds.get(row.id),course_id:courseId,is_published:false,is_draft:true,created_by:actorId})));
   if(modules.error)throw modules.error;
  }
  if(sourceLessons.length){
   const fields=['title','slug','order_index','lesson_type','content','content_json','rendered_html','duration_minutes','learning_objectives','quiz_questions','passing_score','competency_checks','instructor_notes','practical_required','activities','is_required','required_artifacts','domain_key','hour_category','evidence_type','delivery_method','requires_instructor_signoff','instructor_requirement','minimum_seat_time_minutes','fieldwork_eligible','video_url','script_text'];
   const lessons=sourceLessons.map(row=>{
    const id=uuid();if(row.id===lessonId)newLessonId=id;
    const copy={...pick(row,fields),id,course_id:courseId,module_id:moduleIds.get(row.module_id)??null,
      status:'draft',is_published:false,approved:false,media_quality_status:'unverified'};
    if(row.id===lessonId){
      Object.assign(copy,patch.lesson);
      if(patch.lesson.content){copy.video_url=null;copy.script_text=null;copy.rendered_html=draftLessonHtml(patch.lesson.content);
       const {film,mediaAttachment,...content}=copy.content_json??{};copy.content_json={...content,experience:{...(content.experience??{}),readingGuide:{summary:patch.lesson.content,sections:[]}},revisionInstruction:patch.lesson.content};}
    }
    return copy;
   });
   const saved=await db.from('course_lessons').insert(lessons);if(saved.error)throw saved.error;
  }
  const completed=await db.from('courses').update({metadata:{...(sourceCourse.metadata??{}),
   source_course_id:sourceCourse.id,course_ai_edit_request_id:requestId,course_ai_edit_complete:true,ai_edited_lesson_id:newLessonId??null}})
   .eq('id',courseId).eq('status','draft').select('id').single();
  if(completed.error)throw completed.error;if(!completed.data)throw Error('DRAFT_REVISION_SAVE_NOT_VERIFIED');
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
