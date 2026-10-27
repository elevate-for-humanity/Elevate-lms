-- Session-private regression fixtures. The driver always rolls back.
CREATE TRIGGER private_pool_failure BEFORE UPDATE ON pg_temp.ultimate_build_jobs
 FOR EACH ROW EXECUTE FUNCTION pg_temp.consume_ultimate_media_wakeup();
DO $$
DECLARE
 course uuid:=gen_random_uuid(); build uuid:=gen_random_uuid(); coordinator uuid:=gen_random_uuid();
 a uuid:=gen_random_uuid();b uuid:=gen_random_uuid();preserved uuid:=gen_random_uuid(); module uuid:=gen_random_uuid();
 profile jsonb; planned jsonb; first_job pg_temp.ultimate_build_jobs%ROWTYPE; second_job pg_temp.ultimate_build_jobs%ROWTYPE;
 media_job pg_temp.ultimate_build_jobs%ROWTYPE; reclaimed pg_temp.ultimate_build_jobs%ROWTYPE;
 first_lesson uuid;second_lesson uuid; output jsonb; step_name text; rejected boolean;
BEGIN
 INSERT INTO pg_temp.courses(id,slug,title)VALUES(course,'private-pool-test','Private transaction fixture');
 INSERT INTO pg_temp.course_lessons(id,course_id,module_id,slug,title,order_index)VALUES
  (a,course,module,'a','Lesson A',1),(b,course,module,'b','Lesson B',2);
 INSERT INTO pg_temp.course_lessons(id,course_id,module_id,slug,title,order_index,status,is_published,video_status,video_url)
 VALUES(preserved,course,module,'preserved','Previously published fixture',3,'published',true,'complete','private-test-only.mp4');
 profile:=jsonb_build_object('id','private-test','parallelAutopilot','three-role-v1','publishCompletedLessons',true,
  'competencies',jsonb_build_array(jsonb_build_object('id',a,'title','Lesson A'),jsonb_build_object('id',b,'title','Lesson B'),jsonb_build_object('id',preserved,'title','Preserved')),
  'canonicalLessonIds',jsonb_build_object(a::text,a,b::text,b,preserved::text,preserved),
  'preservedPublishedLessonIds',jsonb_build_array(preserved));
 INSERT INTO pg_temp.ultimate_course_builds(id,course_id,profile,status)VALUES(build,course,profile,'running');
 INSERT INTO pg_temp.ultimate_build_jobs(id,build_id,status,execution_generation,lease_owner,lease_expires_at)
 VALUES(coordinator,build,'running',1,'coordinator',now()+interval '5 minutes');
 planned:=pg_temp.seed_ultimate_lesson_autopilots(coordinator,'coordinator',1,profile,repeat('a',64));
 IF planned->>'taskCount'<>'6' OR (SELECT count(*) FROM pg_temp.ultimate_build_jobs WHERE build_id=build AND payload?'autopilot')<>6
 THEN RAISE EXCEPTION 'TEST: expected exactly three jobs for each unfinished lesson'; END IF;
 IF EXISTS(SELECT 1 FROM pg_temp.claim_ultimate_lesson_autopilot('premature-media',300,'media')) OR
   EXISTS(SELECT 1 FROM pg_temp.claim_ultimate_lesson_autopilot('premature-quality',300,'quality'))
 THEN RAISE EXCEPTION 'TEST: prerequisite bypass'; END IF;
 SELECT * INTO first_job FROM pg_temp.claim_ultimate_lesson_autopilot('worker-a',300,'instruction');
 SELECT * INTO second_job FROM pg_temp.claim_ultimate_lesson_autopilot('worker-b',300,'instruction');
 IF first_job.id IS NULL OR second_job.id IS NULL OR first_job.id=second_job.id OR
  first_job.payload#>>'{autopilot,competencyId}'=second_job.payload#>>'{autopilot,competencyId}'
 THEN RAISE EXCEPTION 'TEST: two claims overwrote the same lesson'; END IF;
 output:=pg_temp.ultimate_fenced_write(first_job.id,'worker-a',first_job.execution_generation,'create_lesson',build,
  jsonb_build_object('lessonKey',first_job.payload#>>'{autopilot,competencyId}','competencyId',first_job.payload#>>'{autopilot,competencyId}'));
 first_lesson:=(output->>'id')::uuid;
 output:=pg_temp.ultimate_fenced_write(second_job.id,'worker-b',second_job.execution_generation,'create_lesson',build,
  jsonb_build_object('lessonKey',second_job.payload#>>'{autopilot,competencyId}','competencyId',second_job.payload#>>'{autopilot,competencyId}'));
 second_lesson:=(output->>'id')::uuid;
 rejected:=false;
 BEGIN PERFORM pg_temp.ultimate_fenced_write(first_job.id,'worker-a',first_job.execution_generation,'save_artifact',second_lesson,'{"artifacts":{"wrongLesson":true}}');
 EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE '%CROSS_LESSON_WRITE%' THEN rejected:=true;ELSE RAISE;END IF; END;
 IF NOT rejected THEN RAISE EXCEPTION 'TEST: cross-lesson write accepted'; END IF;
 rejected:=false;
 BEGIN PERFORM pg_temp.complete_ultimate_lesson_autopilot(first_job.id,'worker-a',first_job.execution_generation);
 EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE '%STAGE_NOT_COMPLETE%' THEN rejected:=true;ELSE RAISE;END IF;END;
 IF NOT rejected THEN RAISE EXCEPTION 'TEST: incomplete instruction advanced'; END IF;
 rejected:=false;
 BEGIN PERFORM pg_temp.ultimate_fenced_artifact_version(first_job.id,'worker-a',first_job.execution_generation,
  jsonb_build_object('buildId',build,'lessonBuildId',second_lesson,'stage','storyboard','artifactType','stage_output','logicalKey','lesson:'||second_lesson||':stage:storyboard','content','{}'::jsonb));
 EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE '%CROSS_LESSON_WRITE%' THEN rejected:=true;ELSE RAISE;END IF;END;
 IF NOT rejected THEN RAISE EXCEPTION 'TEST: cross-lesson version accepted'; END IF;
 UPDATE pg_temp.ultimate_build_jobs SET lease_expires_at=now()-interval '1 second' WHERE id=first_job.id;
 rejected:=false;
 BEGIN PERFORM pg_temp.ultimate_fenced_write(first_job.id,'worker-a',first_job.execution_generation,'save_artifact',first_lesson,'{"artifacts":{"stale":true}}');
 EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE '%LEASE_LOST%' THEN rejected:=true;ELSE RAISE;END IF;END;
 IF NOT rejected THEN RAISE EXCEPTION 'TEST: expired owner wrote'; END IF;
 SELECT * INTO reclaimed FROM pg_temp.claim_ultimate_lesson_autopilot('replacement',300,'instruction');
 IF reclaimed.id IS DISTINCT FROM first_job.id OR reclaimed.execution_generation<>first_job.execution_generation+1
 THEN RAISE EXCEPTION 'TEST: failed atomic lease recovery'; END IF;
 FOREACH step_name IN ARRAY ARRAY['standards_lock','learning_objectives','prerequisites','teaching_sequence','instructor_script','storyboard'] LOOP
  PERFORM pg_temp.ultimate_fenced_write(reclaimed.id,'replacement',reclaimed.execution_generation,'record_step',first_lesson,
   jsonb_build_object('step',step_name,'state','passed','artifacts',jsonb_build_object('contractEvidence',jsonb_build_object('passed',true,'version','ultimate-lesson-2026-10-05.1'))));
 END LOOP;
 PERFORM pg_temp.complete_ultimate_lesson_autopilot(reclaimed.id,'replacement',reclaimed.execution_generation);
 SELECT * INTO media_job FROM pg_temp.claim_ultimate_lesson_autopilot('media-a',300,'media');
 IF media_job.id IS NULL OR media_job.payload#>>'{autopilot,competencyId}' IS DISTINCT FROM reclaimed.payload#>>'{autopilot,competencyId}'
 THEN RAISE EXCEPTION 'TEST: wrong successor claimed'; END IF;
 UPDATE pg_temp.ultimate_build_jobs SET available_at=now() WHERE build_id=build AND payload#>>'{autopilot,role}'='quality';
 IF EXISTS(SELECT 1 FROM pg_temp.claim_ultimate_lesson_autopilot('quality-before-film',300,'quality'))
 THEN RAISE EXCEPTION 'TEST: quality bypassed an unfinished media job'; END IF;
 UPDATE pg_temp.ultimate_build_jobs SET status='failed',lease_owner=NULL,lease_expires_at=NULL WHERE id=media_job.id;
 IF (SELECT status FROM pg_temp.ultimate_course_builds WHERE id=build)<>'running'
 THEN RAISE EXCEPTION 'TEST: one failure blocked the course'; END IF;
 PERFORM pg_temp.ultimate_fenced_write(second_job.id,'worker-b',second_job.execution_generation,'save_artifact',second_lesson,'{"artifacts":{"otherLessonContinues":true}}');
 IF NOT(SELECT artifacts?'otherLessonContinues' FROM pg_temp.ultimate_lesson_builds WHERE id=second_lesson)
 THEN RAISE EXCEPTION 'TEST: unrelated lesson could not continue'; END IF;
 IF EXISTS(SELECT 1 FROM pg_temp.ultimate_lesson_builds WHERE build_id=build AND competency_id=preserved::text) OR
  (SELECT video_url FROM pg_temp.course_lessons WHERE id=preserved)<>'private-test-only.mp4'
 THEN RAISE EXCEPTION 'TEST: prior publication changed'; END IF;
 UPDATE pg_temp.ultimate_build_jobs SET available_at=now() WHERE id=coordinator;
 IF EXISTS(SELECT 1 FROM pg_temp.claim_ultimate_build_job('legacy-overlap',300))
 THEN RAISE EXCEPTION 'TEST: legacy coordinator overlapped a pool'; END IF;
 RAISE NOTICE 'PASS: 12 role, dependency, recovery, fencing and preservation assertions';
END $$;
SELECT jsonb_build_object('passed',true,'isolation','session-private tables; rollback','assertions',12) AS autopilot_database_test;
