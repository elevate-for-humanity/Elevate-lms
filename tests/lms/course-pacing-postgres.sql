-- Driver injects the actual migration functions into pg_temp at this marker.
BEGIN;
CREATE TEMP TABLE courses(id uuid,is_active boolean);
CREATE TEMP TABLE profiles(id uuid,role text);
CREATE TEMP TABLE course_lessons(id uuid,course_id uuid,module_id uuid,title text,order_index integer,lesson_type text,duration_minutes integer,is_required boolean,is_published boolean);
CREATE TEMP TABLE program_enrollments(user_id uuid,student_id uuid,course_id uuid,status text,training_start_date date,student_start_date timestamptz,start_date timestamptz,started_at timestamptz,access_granted_at timestamptz,enrolled_at timestamptz,created_at timestamptz,updated_at timestamptz,revoked_at timestamptz);
CREATE TEMP TABLE course_enrollments(student_id uuid,course_id uuid,status text,created_at timestamptz,revoked_at timestamptz);
CREATE TEMP TABLE lesson_progress(user_id uuid,lesson_id uuid,completed boolean);
CREATE TEMP TABLE course_pacing_plans(course_id uuid,total_weeks integer,enabled boolean,release_published_lessons boolean);
CREATE TEMP TABLE course_lesson_release_weeks(lesson_id uuid,course_id uuid,release_week integer);
-- ACTUAL_PACING_FUNCTIONS
SELECT set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001"}',true);
INSERT INTO pg_temp.profiles VALUES('00000000-0000-0000-0000-000000000001','student');
INSERT INTO pg_temp.courses VALUES('10000000-0000-0000-0000-000000000001',true);
INSERT INTO pg_temp.course_pacing_plans VALUES('10000000-0000-0000-0000-000000000001',50,true,true);
INSERT INTO pg_temp.course_lessons SELECT ('20000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'10000000-0000-0000-0000-000000000001',null,'Isolated test lesson',n,'lesson',6,true,n<=3 FROM generate_series(1,4) n;
INSERT INTO pg_temp.course_lesson_release_weeks SELECT id,course_id,CASE order_index WHEN 1 THEN 1 WHEN 2 THEN 2 ELSE 50 END FROM pg_temp.course_lessons;
INSERT INTO pg_temp.program_enrollments(user_id,course_id,status,started_at,updated_at) VALUES('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','active',now()-interval '1 day',now());
DO $$
DECLARE actor uuid:='00000000-0000-0000-0000-000000000001'; one uuid:='20000000-0000-0000-0000-000000000001'; two uuid:='20000000-0000-0000-0000-000000000002'; final uuid:='20000000-0000-0000-0000-000000000003'; unpublished uuid:='20000000-0000-0000-0000-000000000004'; course uuid:='10000000-0000-0000-0000-000000000001'; plan jsonb;
BEGIN
 ASSERT pg_temp.paced_lesson_access(actor,one),'first week must open';
 ASSERT NOT pg_temp.paced_lesson_access(actor,two),'future week must stay locked';
 ASSERT NOT pg_temp.paced_lesson_access('00000000-0000-0000-0000-000000000002',one),'cannot inspect another learner';
 ASSERT NOT pg_temp.paced_lesson_access(actor,unpublished),'unpublished never opens';
 UPDATE pg_temp.program_enrollments SET started_at=now()-interval '400 days';
 ASSERT NOT pg_temp.paced_lesson_access(actor,two),'elapsed time cannot bypass missing prerequisite';
 INSERT INTO pg_temp.lesson_progress VALUES(actor,one,true);
 ASSERT pg_temp.paced_lesson_access(actor,two),'completed prerequisite and elapsed week must open';
 ASSERT NOT pg_temp.paced_lesson_access(actor,final),'cannot skip intermediate required lesson';
 INSERT INTO pg_temp.lesson_progress VALUES(actor,two,true);
 ASSERT pg_temp.paced_lesson_access(actor,final),'week50 opens only with prerequisites';
 UPDATE pg_temp.program_enrollments SET started_at=now()-interval '342 days';
 ASSERT NOT pg_temp.paced_lesson_access(actor,final),'final remains locked before week50';
 ASSERT pg_temp.pacing_requirement_met(now()-interval '343 days',50,true,now()),'exact week50 boundary';
 ASSERT NOT pg_temp.pacing_requirement_met(now()-interval '343 days'+interval '1 second',50,true,now()),'one second before boundary';
 UPDATE pg_temp.program_enrollments SET revoked_at=now();
 INSERT INTO pg_temp.course_enrollments VALUES(actor,course,'active',now()-interval '400 days',null);
 ASSERT NOT pg_temp.paced_lesson_access(actor,one),'secondary enrollment cannot override revocation';
 UPDATE pg_temp.program_enrollments SET revoked_at=null,status='pending_approval';
 ASSERT NOT pg_temp.paced_lesson_access(actor,one),'pending canonical enrollment denied';
 UPDATE pg_temp.program_enrollments SET status='active',started_at=now()+interval '1 day';
 ASSERT NOT pg_temp.paced_lesson_access(actor,one),'future enrollment denied';
 UPDATE pg_temp.program_enrollments SET started_at=now()-interval '1 day';
 plan:=pg_temp.get_my_course_pacing(course);
 ASSERT jsonb_array_length(plan->'lessons')=4,'full metadata syllabus survives gating';
 ASSERT NOT (plan->'lessons'->3) ? 'video_url','schedule never returns media';
 ASSERT (plan->>'totalWeeks')::integer=50,'schedule length is50';
 UPDATE pg_temp.courses SET is_active=false;
 ASSERT NOT pg_temp.paced_lesson_access(actor,one),'inactive course closed';
 UPDATE pg_temp.profiles SET role='admin';
 ASSERT pg_temp.paced_lesson_access(actor,unpublished),'educator preview remains possible';
END $$;
CREATE TEMP TABLE checkpoint_scores(lesson_id uuid,passed boolean);
CREATE TRIGGER test_completion BEFORE INSERT OR UPDATE ON pg_temp.lesson_progress FOR EACH ROW EXECUTE FUNCTION pg_temp.guard_paced_credit_write();
CREATE TRIGGER test_assessment BEFORE INSERT OR UPDATE ON pg_temp.checkpoint_scores FOR EACH ROW EXECUTE FUNCTION pg_temp.guard_paced_credit_write();
DO $$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  INSERT INTO pg_temp.lesson_progress VALUES('00000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',true);
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 ASSERT denied,'browser cannot mint completed credit';
 denied:=false;
 BEGIN
  INSERT INTO pg_temp.checkpoint_scores VALUES('20000000-0000-0000-0000-000000000001',true);
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 ASSERT denied,'browser cannot mint passing assessment';
 INSERT INTO pg_temp.lesson_progress VALUES('00000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',false);
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 INSERT INTO pg_temp.checkpoint_scores VALUES('20000000-0000-0000-0000-000000000001',true);
 ASSERT (SELECT count(*)=1 FROM pg_temp.checkpoint_scores),'server scoring engine can record credit';
END $$;
SELECT '22 isolated pacing and credit assertions passed' result;
ROLLBACK;
