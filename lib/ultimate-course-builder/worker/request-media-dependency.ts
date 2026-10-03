import type { SupabaseClient } from '@supabase/supabase-js';

export type SceneMediaGap = {sceneId: string; visualRequirement: string; reason: string};

/** Missing scenes become a durable acquisition request in the existing Studio,
 * owned by the course creator. Retrying a lesson updates that request rather
 * than losing the scene requirements or creating another browser system. */
export async function requestMediaDependency(db: SupabaseClient, input: {
  courseId: string; competencyId: string; lessonTitle: string;
  gaps: SceneMediaGap[]; workspaceUrl?: string; ownerId?: string;
}) {
  if (!input.gaps.length) return null;
  const {data:course,error:courseError}=await db.from('courses')
    .select('created_by,title').eq('id',input.courseId).single();
  if (courseError) throw courseError;
  if (!course) throw new Error('ULTIMATE_MEDIA_COURSE_REQUIRED');
  let ownerId = course.created_by;
  // Imported historical courses may lack creator metadata. A configured
  // administrator can own acquisition without rewriting their creation history.
  if (!ownerId && input.ownerId) {
    const {data:owner,error:ownerError}=await db.from('profiles')
      .select('id,role').eq('id',input.ownerId).single();
    if(ownerError) throw ownerError;
    if(owner && ['admin','super_admin'].includes(owner.role)) ownerId=owner.id;
  }
  if (!ownerId) throw new Error('ULTIMATE_MEDIA_OWNER_REQUIRED');
  const key=`ultimate-media:${input.courseId}:${input.competencyId}`;
  const command=`Acquire distinct licensed Envato media for ${input.lessonTitle}. Reuse the existing account, workspace, stored files and licenses first. For each missing scene, inspect the actual media, record its item ID and license evidence, and explain the visible actions that support the exact scene requirement. Add suitable missing files to the course workspace and download them as a batch. Do not purchase, infer a supervisor approval, invent a learning record, reuse a clip for multiple scenes, or treat stock labels as required. The renderer adds the script's labels and diagrams. Missing scenes: ${JSON.stringify(input.gaps)}.`;
  const context={ultimate_course_id:input.courseId,competency_id:input.competencyId,
    media_gaps:input.gaps,browser_target:input.workspaceUrl || 'https://app.envato.com/workspaces',
    acquisition_mode:'envato-workspace-batch',resume_after:'licensed_file_attached_and_scene_verified'};
  const {error:insertError}=await db.from('studio_runs').upsert({user_id:ownerId,
    course_id:input.courseId,command,goal:`Complete media coverage: ${input.lessonTitle}`,
    status:'planning',context,idempotency_key:key},
    {onConflict:'user_id,idempotency_key',ignoreDuplicates:true});
  if (insertError) throw insertError;
  const {data:run,error}=await db.from('studio_runs').select('id')
    .eq('user_id',ownerId).eq('idempotency_key',key).single();
  if(error || !run) throw error ?? new Error('ULTIMATE_MEDIA_REQUEST_NOT_PERSISTED');
  const {error:updateError}=await db.from('studio_runs').update({command,context,updated_at:new Date().toISOString()})
    .eq('id',run.id);
  if(updateError) throw updateError;
  return {runId:run.id,browserUrl:`/studio/browser?acquisitionRunId=${encodeURIComponent(run.id)}`,
    gapCount:input.gaps.length};
}
