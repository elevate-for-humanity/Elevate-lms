import { draftLessonHtml } from './workspace-edit.mjs';
const pick = (row: any, keys: string[]) => Object.fromEntries(keys.filter(key => row[key] !== undefined).map(key => [key, row[key]]));

export async function cloneCanonicalCourse(input: unknown) {
  const [{ z }, { requireAdminClient }, { registerProgramCourse }] = await Promise.all([import('zod'), import('../supabase/admin'), import('./program-resolver')]);
const cloneCourseSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  programId: z.string().uuid().nullable().optional(),
  programSlug: z.string().min(1).optional(),
});


  const body = cloneCourseSchema.parse(input);
  const db = await requireAdminClient();
  const { data: source, error: sourceError } = await db
    .from('courses')
    .select('*')
    .eq('id', body.courseId)
    .maybeSingle();
  if (sourceError) throw sourceError;
  if (!source) throw new Error('Course not found');

  const newTitle = body.title?.trim() || `${source.title} (Copy)`;
  const baseSlug = body.slug?.trim() || `${source.slug}-copy`;
  let newSlug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data: existing, error } = await db.from('courses').select('id').eq('slug', newSlug).maybeSingle();
    if (error) throw error;
    if (!existing) break;
    attempt += 1;
    newSlug = `${baseSlug}-${attempt}`;
  }

  const {
    id: _id,
    created_at: _createdAt,
    updated_at: _updatedAt,
    slug: _slug,
    title: _title,
    status: _status,
    review_status: _reviewStatus,
    reviewed_at: _reviewedAt,
    reviewed_by: _reviewedBy,
    review_notes: _reviewNotes,
    submitted_for_review_at: _submittedAt,
    submitted_by: _submittedBy,
    published_at: _publishedAt,
    published_by: _publishedBy,
    version: _version,
    ...courseRest
  } = source as Record<string, any>;

  const sourceGenerationStatus = String(source.generation_status ?? 'draft');
  const clonedGenerationStatus = sourceGenerationStatus === 'published' ? 'completed' : sourceGenerationStatus;
  const clonedGenerationProgress = ['completed', 'verification_ready', 'certificate_ready'].includes(clonedGenerationStatus)
    ? 100
    : Number(source.generation_progress ?? 0);

  const { data: newCourse, error: courseError } = await db
    .from('courses')
    .insert({
      ...courseRest,
      title: newTitle,
      slug: newSlug,
      program_id: body.programId === undefined ? source.program_id ?? null : body.programId,
      status: 'draft',
      is_active: false,
      review_status: 'draft',
      reviewed_at: null,
      reviewed_by: null,
      review_notes: null,
      submitted_for_review_at: null,
      submitted_by: null,
      published_at: null,
      published_by: null,
      version: 1,
      generation_status: clonedGenerationStatus,
      generation_progress: clonedGenerationProgress,
      generation_paused: false,
      updated_at: new Date().toISOString(),
    })
    .select('id,slug,title,program_id')
    .single();
  if (courseError) throw courseError;

  const { data: modules, error: moduleLoadError } = await db
    .from('course_modules')
    .select('*, course_lessons(*)')
    .eq('course_id', body.courseId)
    .order('order_index');
  if (moduleLoadError) throw moduleLoadError;

  for (const sourceModule of modules ?? []) {
    const { course_lessons: lessons, id: _moduleId, course_id: _courseId, created_at: _moduleCreated, updated_at: _moduleUpdated, ...moduleRest } = sourceModule as any;
    const { data: newModule, error: moduleError } = await db
      .from('course_modules')
      .insert({ ...moduleRest, course_id: newCourse.id, updated_at: new Date().toISOString() })
      .select('id')
      .single();
    if (moduleError || !newModule) throw moduleError ?? new Error(`Unable to clone module ${sourceModule.title}`);

    if (lessons?.length) {
      const lessonRows = lessons.map((lesson: Record<string, any>) => {
        const clone = { ...lesson };
        delete clone.id;
        delete clone.created_at;
        delete clone.updated_at;
        delete clone.course_id;
        delete clone.module_id;
        delete clone.course_module_id;
        clone.course_id = newCourse.id;
        if ('module_id' in lesson) clone.module_id = newModule.id;
        if ('course_module_id' in lesson) clone.course_module_id = newModule.id;
        clone.status = 'draft';
        clone.is_published = false;
        clone.approved = false;
        clone.updated_at = new Date().toISOString();
        return clone;
      });
      const { error: lessonError } = await db.from('course_lessons').insert(lessonRows);
      if (lessonError) throw lessonError;
    }
  }

  if (body.programSlug) {
    const mapping = await registerProgramCourse(db, body.programSlug, newCourse.id);
    if (!mapping.ok) throw new Error(mapping.error || 'Unable to register cloned program/course mapping');
  }

  return { course: newCourse, sourceCourseId: body.courseId };
}

/** Copy a published package into an unpublished AI edit revision. Shared canonical clone authority. */
export async function cloneEditedCourseRevision({db,sourceCourse,sourceLessons,sourceModules,lessonId,patch,actorId,requestId,uuid}: any) {
 let courseId=sourceCourse.id,newLessonId=lessonId;

  const existing=await db.from('courses').select('id,metadata').contains('metadata',{course_ai_edit_request_id:requestId}).maybeSingle();
  if(existing.error)throw existing.error;
  if(existing.data){
    if(existing.data.metadata?.course_ai_edit_complete!==true)throw Error('DRAFT_REVISION_INCOMPLETE_REQUIRES_REVIEW');
    return {courseId:existing.data.id,lessonId:existing.data.metadata.ai_edited_lesson_id??null,reused:true};
  }
  courseId=uuid();
  const courseFields=['program_id','description','short_description','org_id','compliance_profile_key','governing_body','governing_region','governing_standard_version','duration_hours','passing_score'];
  const created=await db.from('courses').insert({...pick(sourceCourse,courseFields),id:courseId,
   title:patch.course.title??sourceCourse.title+' — Draft revision',slug:sourceCourse.slug+'-revision-'+courseId.slice(0,8),
   ...patch.course,status:'draft',is_active:false,created_by:actorId,
   metadata:{...(sourceCourse.metadata??{}),source_course_id:sourceCourse.id,course_ai_edit_request_id:requestId,course_ai_edit_complete:false}});
  if(created.error)throw created.error;
  const moduleIds=new Map(sourceModules.map((row: any)=>[row.id,uuid()]));
  if(sourceModules.length){
   const modules=await db.from('course_modules').insert(sourceModules.map((row: any)=>({
    ...pick(row,['title','slug','order_index','target_hours','domain_key','metadata']),
    id:moduleIds.get(row.id),course_id:courseId,is_published:false,is_draft:true,created_by:actorId})));
   if(modules.error)throw modules.error;
  }
  if(sourceLessons.length){
   const fields=['title','slug','order_index','lesson_type','content','content_json','rendered_html','duration_minutes','learning_objectives','quiz_questions','passing_score','competency_checks','instructor_notes','practical_required','activities','is_required','required_artifacts','domain_key','hour_category','evidence_type','delivery_method','requires_instructor_signoff','instructor_requirement','minimum_seat_time_minutes','fieldwork_eligible','video_url','script_text'];
   const lessons=sourceLessons.map((row: any)=>{
    const id=uuid();if(row.id===lessonId)newLessonId=id;
    const copy: Record<string, any>={...pick(row,fields),id,course_id:courseId,module_id:moduleIds.get(row.module_id)??null,
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

 return {courseId,lessonId:newLessonId??null};
}
