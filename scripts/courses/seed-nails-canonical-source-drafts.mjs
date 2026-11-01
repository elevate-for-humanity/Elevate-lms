/** Emits scoped canonical source DML. Validated blueprints are produced by
 * export-beauty-source-drafts.ts. No trigger, RLS or publication gate is changed. */
import {readFileSync} from 'node:fs';
const input=process.argv[2];
if(!input)throw Error('Validated draft JSON path required');
const drafts=JSON.parse(readFileSync(input,'utf8'));
if(drafts.length!==19||new Set(drafts.map(d=>d.competencyId)).size!==19||drafts.some(d=>!/^manicurist-[a-s]$/.test(d.competencyId)||d.blueprint?.competencyId!==d.competencyId||d.blueprint?.segments?.length<13||d.blueprint?.authoringEvidence))throw Error('VALIDATED_NAIL_SOURCE_DRAFTS_REQUIRED');
const payload=JSON.stringify(drafts).replaceAll("'","''");
console.log(`DO $repair$
DECLARE b public.ultimate_course_builds%ROWTYPE; d jsonb; c jsonb; s jsonb; authored jsonb; module_id uuid; lesson_id uuid; lesson_ids jsonb := '{}'::jsonb; i integer := 0;
BEGIN
 PERFORM set_config('lock_timeout','5s',true);
 SELECT * INTO STRICT b FROM public.ultimate_course_builds WHERE id='060f338a-d79f-43dd-a0e3-67af0112fd57' AND course_id='377cd34a-b402-40ab-8ff9-2fcfd394b96d' FOR UPDATE;
 PERFORM 1 FROM public.ultimate_build_jobs WHERE build_id=b.id FOR UPDATE;
 IF b.status NOT IN ('queued','blocked','initializing') OR EXISTS(SELECT 1 FROM public.ultimate_build_jobs WHERE build_id=b.id AND (status='running' OR lease_expires_at>now())) THEN RAISE EXCEPTION 'NAIL_SOURCE_REPAIR_ACTIVE_LEASE'; END IF;
 IF EXISTS(SELECT 1 FROM public.ultimate_autopilot_pools WHERE build_id=b.id) THEN RAISE EXCEPTION 'NAIL_FROZEN_POOL_REVIEW_REQUIRED'; END IF;
 IF EXISTS(SELECT 1 FROM public.course_lessons WHERE course_id=b.course_id) THEN RAISE EXCEPTION 'NAIL_EXISTING_LESSONS_REVIEW_REQUIRED'; END IF;
 IF jsonb_array_length(b.profile->'competencies')<>19 OR jsonb_array_length(b.profile->'instructionalSources')<>19 THEN RAISE EXCEPTION 'NAIL_SOURCE_PROFILE_CHANGED'; END IF;
 INSERT INTO public.course_modules(course_id,slug,title,order_index,is_required,is_published,is_draft)
 VALUES(b.course_id,'ultimate-core',b.profile->>'title',1,true,false,true) ON CONFLICT(course_id,slug) DO NOTHING;
 SELECT id INTO STRICT module_id FROM public.course_modules WHERE course_id=b.course_id AND slug='ultimate-core' AND is_draft AND NOT is_published;
 FOR d IN SELECT * FROM jsonb_array_elements('${payload}'::jsonb) LOOP
  SELECT x INTO STRICT c FROM jsonb_array_elements(b.profile->'competencies') x WHERE x->>'id'=d->>'competencyId';
  IF c->'authorityRequirementIds' IS DISTINCT FROM d->'sourceRequirementIds' THEN RAISE EXCEPTION 'NAIL_REQUIREMENT_MAPPING_CHANGED'; END IF;
  SELECT x INTO STRICT s FROM jsonb_array_elements(b.profile->'instructionalSources') x WHERE x->>'id'=d->>'competencyId';
  authored:=substring(s->>'text' from position('Authorized course content: ' in s->>'text')+length('Authorized course content: '))::jsonb;
  IF length(coalesce(authored->>'html',''))<200 THEN RAISE EXCEPTION 'NAIL_SUBSTANTIVE_SOURCE_REQUIRED'; END IF;
  i:=i+1;
  INSERT INTO public.course_lessons(course_id,module_id,slug,title,order_index,lesson_type,status,is_published,approved,is_required,generation_status,practical_required,learning_objectives,content,content_json)
  VALUES(b.course_id,module_id,d->>'competencyId',d->>'title',i,'lesson','draft',false,false,true,'generating',coalesce((c->>'requiresPracticalEvidence')::boolean,false),
   (SELECT jsonb_agg(x->>'text') FROM jsonb_array_elements(d->'blueprint'->'objectives') x),authored,
   jsonb_build_object('ultimateDraft',true,'competencyId',d->>'competencyId','sourceRequirementIds',d->'sourceRequirementIds','blueprint',d->'blueprint','instructionPending',true,'sourceBlueprintOnly',true,'releasePending',true)) RETURNING id INTO lesson_id;
  lesson_ids:=lesson_ids||jsonb_build_object(d->>'competencyId',lesson_id);
 END LOOP;
 IF i<>19 THEN RAISE EXCEPTION 'NAIL_CANONICAL_SOURCE_COUNT_CHANGED'; END IF;
 UPDATE public.ultimate_course_builds SET profile=profile||jsonb_build_object('canonicalLessonIds',lesson_ids,'canonicalSourceDraftRepair',jsonb_build_object('version','source-draft-2026-11-01','at',now(),'reviewClaimed',false)),updated_at=now() WHERE id=b.id;
 UPDATE public.ultimate_build_jobs SET available_at=now(),payload=payload||jsonb_build_object('canonicalSourceDraftRepair','source-draft-2026-11-01'),updated_at=now() WHERE build_id=b.id AND job_type='course_build' AND status='queued' AND last_error LIKE 'ULTIMATE_CANONICAL_DRAFT_SOURCE_CONTRACT_REQUIRED:%';
END $repair$;`);
