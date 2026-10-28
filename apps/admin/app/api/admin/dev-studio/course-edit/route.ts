import {NextRequest,NextResponse} from 'next/server';
import {apiRequireAdmin} from '@/lib/admin/guards';
import {applyRateLimit} from '@/lib/api/withRateLimit';
import {requireAdminClient} from '@/lib/supabase/admin';
import {aiChat} from '@/lib/ai/ai-service';
import {executePaidInference,paidArtifactFingerprint,reservePaidInference} from '@/lib/ai/paid-inference-gateway';
import {getCourseBuilderCreditOwner} from '@/lib/course-builder/credits';
import {saveCourseEdit,validateCourseEdit} from '@/lib/course-builder/workspace-edit.mjs';
import {safeInternalError} from '@/lib/api/safe-error';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=120;
const uuid=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
export async function POST(req:NextRequest){
 const auth=await apiRequireAdmin(req);if(auth.error)return auth.error;
 const limited=await applyRateLimit(req,'api');if(limited)return limited;
 const body=await req.json().catch(()=>null);
 if(!uuid(body?.courseId)||(body.lessonId&&!uuid(body.lessonId))||typeof body.goal!=='string'||!body.goal.trim()||body.goal.length>20000)
  return NextResponse.json({error:'Select the course and lesson to change and provide an instruction.'},{status:400});
 try{
  const db=await requireAdminClient();
  const [course,modules,lessons]=await Promise.all([
   db.from('courses').select('id,title,slug,status,program_id,description,short_description,org_id,compliance_profile_key,governing_body,governing_region,governing_standard_version,duration_hours,passing_score,metadata').eq('id',body.courseId).single(),
   db.from('course_modules').select('*').eq('course_id',body.courseId).order('order_index'),
   db.from('course_lessons').select('id,module_id,title,slug,order_index,lesson_type,content,content_json,rendered_html,duration_minutes,learning_objectives,quiz_questions,passing_score,competency_checks,instructor_notes,practical_required,activities,is_required,required_artifacts,domain_key,hour_category,evidence_type,delivery_method,requires_instructor_signoff,instructor_requirement,minimum_seat_time_minutes,fieldwork_eligible,video_url,script_text').eq('course_id',body.courseId).order('order_index'),
  ]);
  for(const result of [course,modules,lessons])if(result.error)throw result.error;
  if(!course.data)return NextResponse.json({error:'Course not found.'},{status:404});
  const selected=body.lessonId?lessons.data?.find(row=>row.id===body.lessonId):null;
  if(body.lessonId&&!selected)return NextResponse.json({error:'Lesson is not in the selected course.'},{status:404});
  if(course.data.status!=='published'){
   const active=await db.from('ultimate_course_builds').select('id').eq('course_id',body.courseId)
    .in('status',['initializing','queued','running']).limit(1).maybeSingle();
   if(active.error)throw active.error;
   if(active.data)return NextResponse.json({error:'Pause the active build before changing its instructional inputs.'},{status:409});
  }
  const system='Apply only the requested course or selected lesson text edits. Return JSON only: {"course":{"title":"optional","description":"optional"},"lesson":{"title":"optional","content":"optional complete plain-text lesson text"}}. Omit unchanged fields. Do not alter IDs, standards, credentials, assessments, media, publication, or permissions. Do not claim you saved or published anything. If the request needs a different operation, return {"error":"Explain what additional operation is needed"}.';
  const context={course:{id:body.courseId,title:course.data.title,description:course.data.description},lesson:selected?{title:selected.title,content:selected.content,objectives:selected.learning_objectives}:null};
  const owner=await getCourseBuilderCreditOwner({db,userId:auth.id,effectiveRoles:auth.effectiveRoles});
  const fingerprint=paidArtifactFingerprint({operation:'course-workspace-edit',goal:body.goal,context});
  const authorization=await reservePaidInference(db,{scopeKey:owner.tenantId?'tenant:'+owner.tenantId:'platform',
   tenantId:owner.tenantId??null,actorId:auth.id,artifactFingerprint:fingerprint,idempotencyKey:'course-edit:'+fingerprint,
   provider:'configured',model:'configured',operation:'course-workspace-edit',projectedCostMicros:100000});
  if(authorization.decision!=='approved'||!authorization.requestId)return NextResponse.json({error:'AI editing requires generation authorization.',decision:authorization.decision,requestId:authorization.requestId},{status:409});
  const execution=await executePaidInference({db,authorize:async()=>authorization,dispatch:()=>aiChat({
   messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(context)+'\nInstruction: '+body.goal}],
   temperature:0.2,maxTokens:8000})});
  const text=execution.value?.content?.trim().replace(/^\x60\x60\x60(?:json)?\s*/,'').replace(/\s*\x60\x60\x60$/,'');
  if(!text)throw Error('AI_EDIT_EMPTY_RESPONSE');
  const generated=JSON.parse(text);
  if(generated.error)return NextResponse.json({error:String(generated.error)},{status:422});
  const patch=validateCourseEdit(generated,Boolean(selected));
  const saved=await saveCourseEdit({db,sourceCourse:course.data,sourceModules:modules.data??[],sourceLessons:lessons.data??[],
   lessonId:body.lessonId,patch,actorId:auth.id,requestId:authorization.requestId});
  const audit=await db.from('audit_logs').insert({action:'course.ai_edit_saved',actor_id:auth.id,
   target_type:'courses',target_id:saved.courseId,metadata:{requestId:authorization.requestId,sourceCourseId:body.courseId,lessonId:saved.lessonId,createdRevision:saved.createdRevision}});
  return NextResponse.json({ok:true,...saved,auditRecorded:!audit.error,message:'Draft change saved. Review the preview, build the revised course, then publish after acceptance.'});
 }catch(error){return safeInternalError(error,'Course AI edit failed','The course edit could not be completed. Review the saved draft before retrying.');}
}
