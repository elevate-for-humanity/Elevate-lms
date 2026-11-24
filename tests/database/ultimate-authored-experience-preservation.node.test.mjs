import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// All accepted artifacts below are synthetic SQL fixtures, never production QA
// evidence. Exercise the actual installed function bodies in isolated Postgres.
const migrationUrl = new URL('../../supabase/migrations/20261124174506_preserve_authored_ultimate_experience.sql', import.meta.url);
const rollbackMigrationUrl = new URL('../../supabase/migrations/20261124183158_restore_authored_ultimate_release_history.sql', import.meta.url);
const hash = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const contractVersion = 'ultimate-lesson-2026-10-29.1';

test('authored Ultimate attachment and publication against isolated PostgreSQL', async t => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema auth; create schema rpc_private;
      create table auth.users(id uuid primary key);
      grant usage on schema rpc_private to authenticated, service_role;
      create function rpc_private.existing_authenticated_access() returns boolean language sql as 'select true';
      revoke all on function rpc_private.existing_authenticated_access() from public;
      grant execute on function rpc_private.existing_authenticated_access() to authenticated;
      create function auth.role() returns text language sql as $$ select current_setting('request.jwt.claim.role',true) $$;
      create function public.ultimate_assert_autopilot_scope(uuid,uuid,text,boolean) returns void language sql as 'select';
      create table public.courses(id uuid primary key, status text default 'draft', is_active boolean default false,
        review_status text, generation_status text, generation_progress integer, published_at timestamptz,
        published_by uuid, version integer, total_lessons integer, updated_at timestamptz);
      create table public.ultimate_build_jobs(id uuid primary key, build_id uuid, status text, lease_owner text,
        execution_generation bigint, lease_expires_at timestamptz, payload jsonb);
      create table public.ultimate_course_builds(id uuid primary key, course_id uuid, profile jsonb,
        status text default 'built', updated_at timestamptz);
      create table public.ultimate_lesson_builds(id uuid primary key, build_id uuid, competency_id text,
        status text, artifacts jsonb);
      create table public.course_modules(id uuid primary key default gen_random_uuid(),course_id uuid,title text,
        slug text,order_index integer,is_required boolean,is_published boolean,is_draft boolean,created_by uuid);
      create table public.course_lessons(id uuid primary key,course_id uuid,module_id uuid,slug text,title text,
        order_index integer,lesson_type text,is_required boolean,status text,is_published boolean,approved boolean,
        video_url text,video_status text,video_error text,duration_seconds integer,duration_minutes integer,
        script_text text,scene_data jsonb,content_json jsonb,quiz_questions jsonb,passing_score integer,
        content jsonb,rendered_html text,learning_objectives jsonb,practical_required boolean,generation_status text,
        ai_generated boolean,published_at timestamptz,published_by uuid,video_job_id uuid,media_origin text,
        media_quality_status text,media_quality_evidence jsonb,updated_at timestamptz);
      create table public.video_jobs(id uuid primary key default gen_random_uuid(),course_id uuid,lesson_id uuid,
        lesson_title text,asset_kind text,asset_key text,status text,provider text,video_url text,script text,
        scene_data jsonb,duration_seconds integer,scene_count integer,completed_at timestamptz,review_status text,
        reviewed_by uuid,reviewed_at timestamptz,review_notes text,quality_evidence jsonb,lease_token uuid,
        lease_expires_at timestamptz);
      create table public.ultimate_release_versions(id uuid primary key default gen_random_uuid(),build_id uuid,
        course_id uuid,version integer,package jsonb,status text,released_by uuid,rolled_back_from uuid,
        released_at timestamptz default now());
      create table public.course_versions(id uuid primary key,course_id uuid,snapshot jsonb);
      set request.jwt.claim.role='service_role';
    `);
    const prior = await readFile(new URL('../../supabase/migrations/20261027031413_atomic_ultimate_publication.sql', import.meta.url), 'utf8');
    await db.exec(prior.slice(0, prior.indexOf('CREATE OR REPLACE FUNCTION public.commit_ultimate_release')));
    const migration = await readFile(migrationUrl, 'utf8');
    await db.exec(await readFile(new URL('../../supabase/migrations/20261124165505_protect_manufacturing_simulation_keys.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../supabase/migrations/20261124171036_version_manufacturing_simulation_progress.sql', import.meta.url), 'utf8'));
    await db.exec(migration);
    const rollbackMigration = await readFile(rollbackMigrationUrl, 'utf8');
    await db.exec(rollbackMigration);

    async function seed({ authored = true } = {}) {
      const course = randomUUID(), build = randomUUID(), canonical = randomUUID(), lesson = randomUUID(), actor = randomUUID();
      const gradingKey = randomUUID();
      const privateSpec = { version: 1, id: 'scenario', title: 'Synthetic inspection', kind: 'inspection',
        brief: 'Use only the synthetic exhibit.', masteryThreshold: 80,
        exhibits: [{ title: 'Synthetic equipment', columns: [{ key: 'status', label: 'Status' }], rows: [{ status: 'Brake defect reported' }] }],
        tasks: [{ id: 'hold', type: 'choice', prompt: 'Which decision follows the exhibit?',
          options: [{ value: 'hold', label: 'Hold' }, { value: 'operate', label: 'Operate' }],
          critical: true, expected: 'hold', rationale: 'Hold until the defect is resolved.' }] };
      const publicSpec = { ...privateSpec, gradingKeyId: gradingKey,
        tasks: privateSpec.tasks.map(({ expected: _expected, rationale: _rationale, ...task }) => task) };
      const experience = {
        version: 1, plannedMinutes: 120, actualHoursAwardedByContent: 0,
        knowledgeChecks: [{ id: 'authored-one', question: 'What must be held?', options: ['Unresolved load', 'Nothing'], correct: 0 }, { id: 'authored-two', question: 'Who evaluates operation?', options: ['Employer', 'This simulation'], correct: 0 }],
        exercises: [{ id: 'original-exercise', title: 'Document the hold' }],
        readingGuide: { summary: 'Original reviewed reading' }, remediation: ['Review the employer/site boundary'],
        manufacturingSimulation: publicSpec,
      };
      const workbook = { brief: 'Original workbook', questions: ['Evidence?', 'Decision?', 'Next step?'] };
      const activityPlan = [{ title: 'Scenario and reflection', minutes: 120 }];
      const quizQuestions = [{ id: 'vetted-a', question: 'Hold or operate?', correctAnswer: 0 }, { id: 'vetted-b', question: 'Who evaluates?', correctAnswer: 0 }];
      const snapshot = { experience, workbook, activityPlan, quizQuestions, content: '<p>Original authored content</p>',
        renderedHtml: '<article>Original rendered lesson</article>', learningObjectives: ['Original objective'], durationMinutes: 120, passingScore: 85 };
      const sourceText = 'Explicitly attached synthetic source; no production approval.\n' + canonical;
      const record = { version: 'authored-experience-v1', lessonId: canonical, authoredLessonId: 'authored-01',
        sourceId: 'attached-source', sourceHash: hash(sourceText), snapshotHash: hash(snapshot), snapshot };
      const certifiedExperience = { ...experience, learningActivities: [{ id: 'generated-added-activity', title: 'Media-linked practice' }],
        reassessment: [{ id: 'new-reassessment', question: 'Check again' }] };
      const learnerBlueprint = { title: 'Composed learner view', knowledgeChecks: experience.knowledgeChecks };
      const preservation = { ...record, experience: certifiedExperience, experienceHash: hash(certifiedExperience),
        learnerBlueprint, learnerBlueprintHash: hash(learnerBlueprint) };
      const question = { id: 'generated-q', prompt: 'Generated provider question', choices: ['A', 'B'], answerIndex: 0,
        explanation: 'Synthetic explanation', remediation: 'Synthetic remediation' };
      const artifacts = {
        assessment_alignment: { assessment: { questions: [question], reassessment: [{ ...question, id: 'generated-retry' }], passingScore: 80 },
          ...(authored ? { authoredPreservation: preservation } : {}) },
        lesson_film_render: { render: { success: true, videoUrl: 'https://media.example/isolated-fixture.mp4',
          captionsUrl: 'https://media.example/isolated-fixture.vtt', transcriptUrl: 'https://media.example/isolated-fixture.txt', duration: 372.2, sceneData: { scenes: [] } } },
        natural_narration: { narration: { segments: [{ audioUrl: 'https://media.example/isolated-fixture.wav' }] } },
        finished_media_qa: { mediaQA: { pass: true, syntheticFixture: true } }, narration_qa: { narrationQA: { pass: true, syntheticFixture: true } },
        instructor_script: { script: { script: 'Synthetic accepted narration fixture' } }, active_teaching: { activities: [{ id: 'generated-activity' }] },
      };
      const profile = { ownerPaused: true, competencies: [{ id: 'competency' }], canonicalLessonIds: { competency: canonical },
        ...(authored ? { instructionalSources: [{ id: 'attached-source', text: sourceText }],
          authoredLessonRequirements: { competency: { lessonId: canonical, authoredLessonId: 'authored-01' } },
          authoredLessonPreservation: { competency: record } } : {}) };
      const contentJson = { ...(authored ? { authoredLessonId: 'authored-01' } : {}), experience, workbook, activityPlan, unrelated: 'retain' };
      await db.query('insert into courses(id) values($1)', [course]);
      await db.query('insert into manufacturing_simulation_specs(id,lesson_id,course_id,spec) values($1,$2,$3,$4)', [gradingKey, canonical, course, privateSpec]);
      await db.query('insert into ultimate_course_builds(id,course_id,profile) values($1,$2,$3)', [build, course, profile]);
      await db.query("insert into ultimate_lesson_builds values($1,$2,'competency','built',$3)", [lesson, build, artifacts]);
      await db.query(`insert into course_lessons(id,course_id,slug,title,order_index,lesson_type,is_required,status,is_published,approved,
        content_json,quiz_questions,passing_score,duration_minutes,content,rendered_html,learning_objectives)
        values($1,$2,'authored-01','Original lesson',1,'video',true,'draft',false,false,$3,$4,85,120,$5,$6,$7)`,
      [canonical, course, contentJson, JSON.stringify(quizQuestions), JSON.stringify(snapshot.content), snapshot.renderedHtml, JSON.stringify(snapshot.learningObjectives)]);
      const source = { sourceLessonBuildId: lesson, competencyId: 'competency', canonicalLessonId: canonical, slug: 'authored-01',
        videoUrl: artifacts.lesson_film_render.render.videoUrl, preservedPublished: false, contractArtifacts: artifacts };
      const prepared = { sourceLessonBuildId: lesson, competencyId: 'competency', canonicalLessonId: canonical, slug: 'authored-01',
        row: { title: 'Media-enriched title', order_index: 1, lesson_type: 'video', video_url: source.videoUrl,
          learning_objectives: ['Generated objective'], script_text: 'Synthetic accepted narration fixture',
          content_json: { contractVersion, experience: authored ? certifiedExperience : { knowledgeChecks: [{ id: 'generated-check' }], reassessment: [], readingGuide: { summary: 'Generated reading' } },
            workbook: { brief: 'Unrelated provider workbook' }, activityPlan: [], authoredLessonId: 'must-not-replace-marker' } },
        media: { lesson_title: 'Synthetic media', provider: 'synthetic-test-only', video_url: source.videoUrl,
          script: 'Synthetic accepted narration fixture', duration_seconds: 373, scene_count: 1, review_notes: 'Isolated SQL fixture only', quality_evidence: { syntheticFixture: true } } };
      const pkg = { courseId: course, buildId: build, contractVersion, title: 'Synthetic course', profile, lessons: [source] };
      return { course, build, canonical, lesson, actor, gradingKey, privateSpec, profile, artifacts, record, snapshot, certifiedExperience, pkg, prepared,
        row: async () => (await db.query('select * from course_lessons where id=$1', [canonical])).rows[0],
        attach: (accepted = artifacts, fence = [null, null, null]) => db.query('select public.ultimate_attach_lesson_media($1,$2,$3,$4,$5) result', [lesson, accepted, ...fence]),
        publish: (rows = [prepared], packageValue = pkg) => db.query('select public.commit_ultimate_publication_core($1,$2,$3) result', [packageValue, JSON.stringify(rows), actor]),
      };
    }
    function assertAuthored(row, f) {
      assert.deepEqual(row.content_json.experience, f.certifiedExperience);
      assert.deepEqual(row.quiz_questions, f.snapshot.quizQuestions);
      assert.deepEqual(row.learning_objectives, f.snapshot.learningObjectives);
      assert.equal(row.duration_minutes, f.snapshot.durationMinutes); assert.equal(row.passing_score, f.snapshot.passingScore);
      assert.equal(row.content, f.snapshot.content); assert.equal(row.rendered_html, f.snapshot.renderedHtml);
      assert.deepEqual(row.content_json.workbook, f.snapshot.workbook);
      assert.deepEqual(row.content_json.activityPlan, f.snapshot.activityPlan);
      assert.equal(row.content_json.authoredLessonId, 'authored-01');
    }
    async function counts(f) {
      return (await db.query(`select (select count(*)::int from video_jobs where course_id=$1) media,
        (select count(*)::int from course_modules where course_id=$1) modules,
        (select count(*)::int from ultimate_release_versions where course_id=$1) releases`, [f.course])).rows[0];
    }
    async function publishRevision(f) {
      const b = structuredClone(Object.fromEntries(Object.entries(f).filter(([, value]) => typeof value !== 'function')));
      b.build = randomUUID(); b.lesson = randomUUID(); b.gradingKey = randomUUID();
      b.privateSpec.tasks[0].prompt = 'Revision B: decide from the changed inspection evidence.';
      b.snapshot.experience.manufacturingSimulation = { ...b.privateSpec, gradingKeyId: b.gradingKey,
        tasks: b.privateSpec.tasks.map(({ expected: _expected, rationale: _rationale, ...task }) => task) };
      b.snapshot.experience.knowledgeChecks[0].question = 'Revision B reviewed question';
      b.snapshot.quizQuestions[0].question = 'Revision B vetted assessment question';
      b.snapshot.workbook.brief = 'Revision B workbook';
      b.snapshot.activityPlan = [{ title: 'Revision B activities', minutes: 130 }];
      b.snapshot.content = '<p>Revision B source</p>'; b.snapshot.renderedHtml = '<article>Revision B</article>';
      b.snapshot.learningObjectives = ['Revision B objective']; b.snapshot.durationMinutes = 130; b.snapshot.passingScore = 90;
      b.certifiedExperience = { ...b.snapshot.experience, learningActivities: [{ id: 'revision-b-added' }], reassessment: [{ id: 'b-retry' }] };
      const sourceText = 'Explicit synthetic revision B source; no production approval.\n' + b.canonical;
      b.record = { ...b.record, sourceHash: hash(sourceText), snapshotHash: hash(b.snapshot), snapshot: b.snapshot };
      b.profile = { ...b.profile, instructionalSources: [{ id: 'attached-source', text: sourceText }],
        authoredLessonPreservation: { competency: b.record } };
      const learnerBlueprint = { title: 'Revision B learner projection', knowledgeChecks: b.snapshot.experience.knowledgeChecks };
      b.artifacts.assessment_alignment.authoredPreservation = { ...b.record, experience: b.certifiedExperience,
        experienceHash: hash(b.certifiedExperience), learnerBlueprint, learnerBlueprintHash: hash(learnerBlueprint) };
      b.artifacts.lesson_film_render.render.videoUrl = 'https://media.example/revision-b.mp4';
      b.prepared = { ...b.prepared, sourceLessonBuildId: b.lesson,
        row: { ...b.prepared.row, video_url: b.artifacts.lesson_film_render.render.videoUrl,
          content_json: { ...b.prepared.row.content_json, experience: b.certifiedExperience } },
        media: { ...b.prepared.media, video_url: b.artifacts.lesson_film_render.render.videoUrl } };
      b.pkg = { ...b.pkg, buildId: b.build, profile: b.profile, lessons: [{ ...b.pkg.lessons[0],
        sourceLessonBuildId: b.lesson, videoUrl: b.artifacts.lesson_film_render.render.videoUrl, contractArtifacts: b.artifacts }] };
      await db.query('insert into manufacturing_simulation_specs(id,lesson_id,course_id,spec) values($1,$2,$3,$4)', [b.gradingKey, b.canonical, b.course, b.privateSpec]);
      await db.query(`update course_lessons set status='draft',is_published=false,approved=false,content_json=$1,
        quiz_questions=$2,passing_score=$3,duration_minutes=$4,content=$5,rendered_html=$6,learning_objectives=$7 where id=$8`,
      [{ authoredLessonId: 'authored-01', experience: b.snapshot.experience, workbook: b.snapshot.workbook, activityPlan: b.snapshot.activityPlan },
        JSON.stringify(b.snapshot.quizQuestions), b.snapshot.passingScore, b.snapshot.durationMinutes, JSON.stringify(b.snapshot.content), b.snapshot.renderedHtml,
        JSON.stringify(b.snapshot.learningObjectives), b.canonical]);
      await db.query('insert into ultimate_course_builds(id,course_id,profile) values($1,$2,$3)', [b.build, b.course, b.profile]);
      await db.query("insert into ultimate_lesson_builds values($1,$2,'competency','built',$3)", [b.lesson, b.build, b.artifacts]);
      b.release = (await f.publish([b.prepared], b.pkg)).rows[0].result;
      assertAuthored(await f.row(), b);
      return b;
    }
    const rollback = (f, release, pkg = f.pkg, rows = [f.prepared]) => db.query(
      'select public.commit_ultimate_publication_core($1,$2,$3,$4) result', [pkg, JSON.stringify(rows), f.actor, release.id]);

    await t.test('attachment retains authored questions, workbooks, source content, duration and objectives on retry', async () => {
      const f = await seed(); await f.attach(); await f.attach(); const row = await f.row();
      assertAuthored(row, f); assert.equal(row.status, 'draft'); assert.equal(row.approved, false); assert.equal(row.is_published, false);
      assert.equal(row.content_json.mediaAttachment.publicationPending, true);
      assert.deepEqual(row.content_json.assessment, f.artifacts.assessment_alignment.assessment);
      assert.equal(row.duration_seconds, 373); assert.equal(row.content_json.unrelated, 'retain');
    });
    await t.test('atomic publication consumes exactly the certified experience and preserves authored fields', async () => {
      const f = await seed(); await f.attach(); const result = (await f.publish()).rows[0].result;
      assert.equal(result.status, 'released'); assertAuthored(await f.row(), f);
      assert.equal((await f.row()).is_published, true); assert.equal((await f.row()).content_json.mediaAttachment.publicationPending, false);
      assert.deepEqual(await counts(f), { media: 1, modules: 1, releases: 1 });
      assert.equal((await f.publish()).rows[0].result.id, result.id); // existing exact-package idempotency
    });
    await t.test('direct publication from the original authored snapshot uses the same certified projection', async () => {
      const f = await seed(); await f.publish(); assertAuthored(await f.row(), f);
    });
    await t.test('source edits, missing records, mismatched bindings and changed authored values fail before attachment writes', async () => {
      for (const mutation of ['source', 'missing', 'binding', 'experience', 'marker']) {
        const f = await seed(); const before = await f.row();
        if (mutation === 'source') {
          const profile = structuredClone(f.profile); profile.instructionalSources[0].text += '\nchanged';
          await db.query('update ultimate_course_builds set profile=$1 where id=$2', [profile, f.build]);
        } else if (mutation === 'marker') {
          await db.query("update course_lessons set content_json=content_json-'authoredLessonId' where id=$1", [f.canonical]);
        } else {
          if (mutation === 'missing') delete f.artifacts.assessment_alignment.authoredPreservation;
          if (mutation === 'binding') f.artifacts.assessment_alignment.authoredPreservation.snapshotHash = '0'.repeat(64);
          if (mutation === 'experience') f.artifacts.assessment_alignment.authoredPreservation.experience.knowledgeChecks = [];
          await db.query('update ultimate_lesson_builds set artifacts=$1 where id=$2', [f.artifacts, f.lesson]);
        }
        await assert.rejects(f.attach(), /ULTIMATE_AUTHORED_/);
        const after = await f.row(); assert.equal(after.video_url, before.video_url); assert.deepEqual(after.quiz_questions, before.quiz_questions);
      }
    });
    await t.test('each authored snapshot field blocks drift before media attachment', async () => {
      const changes = [
        ["content_json=jsonb_set(content_json,'{workbook}','{}')"],
        ["content_json=jsonb_set(content_json,'{activityPlan}','[]')"],
        ["content_json=jsonb_set(content_json,'{experience,plannedMinutes}','30')"],
        ["quiz_questions='[]'"], ["content='\"changed\"'"], ["rendered_html='changed'"],
        ["learning_objectives='[]'"], ['duration_minutes=30'], ['passing_score=1'],
      ];
      for (const [change] of changes) {
        const f = await seed(); await db.query(`update course_lessons set ${change} where id=$1`, [f.canonical]);
        await assert.rejects(f.attach(), /ULTIMATE_AUTHORED_SNAPSHOT_CHANGED/);
        assert.equal((await f.row()).video_url, null);
      }
    });
    await t.test('a required authored source cannot fall back to generic publication when marker and binding are removed', async () => {
      const f = await seed();
      delete f.profile.authoredLessonPreservation;
      delete f.artifacts.assessment_alignment.authoredPreservation;
      await db.query('update ultimate_course_builds set profile=$1 where id=$2', [f.profile, f.build]);
      await db.query('update ultimate_lesson_builds set artifacts=$1 where id=$2', [f.artifacts, f.lesson]);
      await db.query("update course_lessons set content_json=content_json-'authoredLessonId' where id=$1", [f.canonical]);
      await assert.rejects(f.attach(), /ULTIMATE_AUTHORED_PRESERVATION_REQUIRED/);
      await assert.rejects(f.publish(), /ULTIMATE_AUTHORED_PRESERVATION_REQUIRED/);
      assert.deepEqual(await counts(f), { media: 0, modules: 0, releases: 0 });
      assert.equal((await f.row()).video_url, null);
    });
    await t.test('tampered publication experience and source drift reject before any module, media or release write', async () => {
      const f = await seed(); const altered = structuredClone(f.prepared); altered.row.content_json.experience.knowledgeChecks = [];
      await assert.rejects(f.publish([altered]), /ULTIMATE_AUTHORED_PUBLICATION_CHANGED/);
      assert.deepEqual(await counts(f), { media: 0, modules: 0, releases: 0 });
      await f.attach(); await db.query('update course_lessons set passing_score=1 where id=$1', [f.canonical]);
      await assert.rejects(f.publish(), /ULTIMATE_AUTHORED_SNAPSHOT_CHANGED/);
      assert.deepEqual(await counts(f), { media: 0, modules: 0, releases: 0 });
      assert.equal((await f.row()).status, 'draft');
    });
    await t.test('attachment readback detects a trigger changing authored quiz and rolls the whole update back', async () => {
      const f = await seed(); const before = await f.row();
      await db.exec(`create function break_authored_quiz() returns trigger language plpgsql as $$ begin new.quiz_questions='[]'; return new; end $$;
        create trigger break_authored_quiz before update on course_lessons for each row execute function break_authored_quiz();`);
      try { await assert.rejects(f.attach(), /ULTIMATE_ATTACHMENT_READBACK_FAILED/); assert.deepEqual(await f.row(), before); }
      finally { await db.exec('drop trigger break_authored_quiz on course_lessons; drop function break_authored_quiz()'); }
    });
    await t.test('publication readback detects workbook interference and rolls media/module/release writes back', async () => {
      const f = await seed(); await f.attach(); const before = await f.row();
      await db.exec(`create function break_authored_workbook() returns trigger language plpgsql as $$ begin
        if new.status='published' then new.content_json=jsonb_set(new.content_json,'{workbook}','{}'); end if; return new; end $$;
        create trigger break_authored_workbook before update on course_lessons for each row execute function break_authored_workbook();`);
      try { await assert.rejects(f.publish(), /ULTIMATE_AUTHORED_SNAPSHOT_CHANGED/); assert.deepEqual(await f.row(), before);
        assert.deepEqual(await counts(f), { media: 0, modules: 0, releases: 0 }); }
      finally { await db.exec('drop trigger break_authored_workbook on course_lessons; drop function break_authored_workbook()'); }
    });
    await t.test('unmarked lessons retain generated attachment and ordinary publication merging', async () => {
      const f = await seed({ authored: false }); await f.attach(); const attached = await f.row();
      assert.equal(attached.quiz_questions.length, 3); assert.equal(attached.passing_score, 80);
      assert.equal(attached.content_json.experience.knowledgeChecks[0].id, 'generated-q');
      assert.deepEqual(attached.content_json.experience.exercises, f.snapshot.experience.exercises);
      // Normal publication rows do not add an authored marker.
      delete f.prepared.row.content_json.authoredLessonId;
      await f.publish(); const published = await f.row();
      assert.deepEqual(published.learning_objectives, ['Generated objective']);
      assert.deepEqual(published.content_json.experience.readingGuide, { summary: 'Generated reading' });
      assert.equal(published.content_json.experience.knowledgeChecks.length, 2);
      assert.equal(published.quiz_questions.length, 3);
    });
    await t.test('published attachment preservation and media QA denial remain unchanged', async () => {
      const f = await seed(); await f.publish(); const before = await f.row();
      assert.equal((await f.attach()).rows[0].result.preservedPublished, true); assert.deepEqual(await f.row(), before);
      const rejected = await seed(); rejected.artifacts.finished_media_qa.mediaQA.pass = false;
      await db.query('update ultimate_lesson_builds set artifacts=$1 where id=$2', [rejected.artifacts, rejected.lesson]);
      await assert.rejects(rejected.attach(), /ULTIMATE_ATTACHMENT_VERIFIED_MEDIA_REQUIRED/);
      await assert.rejects(rejected.publish(), /ULTIMATE_LESSONS_NOT_RELEASE_READY/);
      assert.deepEqual(await counts(rejected), { media: 0, modules: 0, releases: 0 });
    });
    await t.test('owner pause, active worker lease and stale generation remain enforced', async () => {
      const f = await seed(), job = randomUUID();
      await db.query("insert into ultimate_build_jobs(id,build_id,status,lease_owner,execution_generation,lease_expires_at) values($1,$2,'running','worker',3,now()+interval '1 hour')", [job, f.build]);
      await assert.rejects(f.attach(), /RECOVERY_REQUIRES_PAUSED_IDLE_BUILD/);
      await assert.rejects(f.attach(f.artifacts, [job, 'worker', 3]), /OWNER_PAUSED_REFERENCE_BUILD/);
      await assert.rejects(f.attach(f.artifacts, [job, 'worker', 2]), /ULTIMATE_JOB_LEASE_LOST/);
      await assert.rejects(db.query('select public.commit_ultimate_publication_core($1,$2,$3,null,$4)',
        [f.pkg, JSON.stringify([f.prepared]), f.actor, { jobId: job, workerId: 'other', generation: 3 }]), /ULTIMATE_JOB_LEASE_LOST/);
      assert.deepEqual(await counts(f), { media: 0, modules: 0, releases: 0 });
    });
    await t.test('historical rollback restores authored revision A after B and retains both immutable keys and accepted progress versions', async () => {
      const f = await seed(); const releaseA = (await f.publish()).rows[0].result;
      const b = await publishRevision(f), learner = randomUUID();
      await db.query('insert into auth.users values($1)', [learner]);
      for (const [spec, passed, attempts] of [[f.gradingKey, true, 2], [b.gradingKey, false, 3]]) {
        await db.query(`insert into manufacturing_simulation_progress
          (learner_id,course_id,lesson_id,spec_id,lesson_slug,interaction_id,answers,score,completed,attempts,feedback)
          values($1,$2,$3,$4,'authored-01','scenario','{}',$5,$6,$7,'[]')`,
        [learner, f.course, f.canonical, spec, passed ? 100 : 0, passed, attempts]);
      }
      const beforeProgress = (await db.query('select * from manufacturing_simulation_progress where learner_id=$1 order by spec_id', [learner])).rows;
      const result = (await rollback(f, releaseA)).rows[0].result;
      assert.equal(result.rolled_back_from, releaseA.id); assert.equal(result.version, 3);
      assertAuthored(await f.row(), f);
      assert.equal((await f.row()).video_url, f.prepared.row.video_url);
      assert.equal((await f.row()).content_json.experience.manufacturingSimulation.gradingKeyId, f.gradingKey);
      assert.deepEqual((await db.query('select * from manufacturing_simulation_progress where learner_id=$1 order by spec_id', [learner])).rows, beforeProgress);
      assert.equal((await db.query('select count(*)::int n from manufacturing_simulation_specs where course_id=$1', [f.course])).rows[0].n, 2);
      assert.equal((await rollback(f, releaseA)).rows[0].result.id, result.id);
      assert.deepEqual(await counts(f), { media: 1, modules: 1, releases: 3 });
    });
    await t.test('rollback rejects a request differing from the exact historical release before writes', async () => {
      const f = await seed(); const releaseA = (await f.publish()).rows[0].result; await publishRevision(f);
      const before = await f.row(); const altered = structuredClone(f.pkg); altered.title = 'Not the stored historical release';
      await assert.rejects(rollback(f, releaseA, altered), /ULTIMATE_RELEASE_NOT_FOUND/);
      assert.deepEqual(await f.row(), before); assert.deepEqual(await counts(f), { media: 1, modules: 1, releases: 2 });
    });
    await t.test('missing, foreign and mismatched historical grading references reject rollback atomically', async () => {
      for (const problem of ['missing', 'foreign', 'mismatch']) {
        const f = await seed(); const releaseA = (await f.publish()).rows[0].result; await publishRevision(f);
        const before = await f.row();
        if (problem === 'missing') await db.query('delete from manufacturing_simulation_specs where id=$1', [f.gradingKey]);
        if (problem === 'foreign') await db.query('update manufacturing_simulation_specs set lesson_id=$1 where id=$2', [randomUUID(), f.gradingKey]);
        if (problem === 'mismatch') await db.query("update manufacturing_simulation_specs set spec=jsonb_set(spec,'{tasks,0,prompt}','\"Changed private problem\"') where id=$1", [f.gradingKey]);
        await assert.rejects(rollback(f, releaseA), /ULTIMATE_AUTHORED_HISTORICAL_GRADING_REQUIRED/);
        assert.deepEqual(await f.row(), before); assert.deepEqual(await counts(f), { media: 1, modules: 1, releases: 2 });
      }
    });
    await t.test('historical rollback still rejects altered accepted projections and source evidence', async () => {
      for (const problem of ['projection', 'source']) {
        const f = await seed(); const releaseA = (await f.publish()).rows[0].result; await publishRevision(f);
        const before = await f.row(), pkg = structuredClone(f.pkg), rows = structuredClone([f.prepared]);
        if (problem === 'projection') rows[0].row.content_json.experience.knowledgeChecks = [];
        else {
          pkg.profile.instructionalSources[0].text += ' Corrupted historical source';
          await db.query('update ultimate_release_versions set package=$1 where id=$2', [pkg, releaseA.id]);
        }
        await assert.rejects(rollback(f, releaseA, pkg, rows), /ULTIMATE_AUTHORED_(PUBLICATION|SOURCE)_CHANGED/);
        assert.deepEqual(await f.row(), before); assert.deepEqual(await counts(f), { media: 1, modules: 1, releases: 2 });
      }
    });
    await t.test('rollback readback interference rolls source, media and release history back to revision B', async () => {
      const f = await seed(); const releaseA = (await f.publish()).rows[0].result; await publishRevision(f);
      const before = await f.row();
      await db.exec(`create function break_historical_restore() returns trigger language plpgsql as $$ begin
        if new.duration_minutes=120 and new.status='published' then new.rendered_html='interference'; end if; return new; end $$;
        create trigger break_historical_restore before update on course_lessons for each row execute function break_historical_restore();`);
      try {
        await assert.rejects(rollback(f, releaseA), /ULTIMATE_AUTHORED_SNAPSHOT_CHANGED/);
        assert.deepEqual(await f.row(), before); assert.deepEqual(await counts(f), { media: 1, modules: 1, releases: 2 });
      } finally { await db.exec('drop trigger break_historical_restore on course_lessons; drop function break_historical_restore()'); }
    });
    await t.test('new helper and release RPC deny public roles without breaking unrelated authenticated schema access', async () => {
      for (const role of ['anon', 'authenticated']) for (const fn of [
        'rpc_private.ultimate_authored_preservation(jsonb,jsonb,text,jsonb,jsonb)',
        'rpc_private.ultimate_authored_rollback_payload(jsonb,jsonb,text,jsonb,jsonb)',
        'public.ultimate_attach_lesson_media(uuid,jsonb,uuid,text,bigint)',
        'public.commit_ultimate_publication_core(jsonb,jsonb,uuid,uuid,jsonb)',
      ]) assert.equal((await db.query("select has_function_privilege($1,$2,'execute') allowed", [role, fn])).rows[0].allowed, false);
      await db.exec('set role authenticated');
      try {
        assert.equal((await db.query('select rpc_private.existing_authenticated_access() allowed')).rows[0].allowed, true);
        await assert.rejects(db.query("select rpc_private.ultimate_authored_preservation('{}','{}','x','{}')"), /permission denied/);
      } finally { await db.exec('reset role'); }
    });
    await t.test('forward migration replay retains data, schema ACL and exact installed release contract', async () => {
      const f = await seed(); await f.attach(); const before = await f.row(); await db.exec(rollbackMigration);
      assert.deepEqual(await f.row(), before);
      assert.equal((await db.query("select has_schema_privilege('authenticated','rpc_private','usage') allowed")).rows[0].allowed, true);
      const definition = (await db.query("select pg_get_functiondef('public.commit_ultimate_publication_core(jsonb,jsonb,uuid,uuid,jsonb)'::regprocedure) source")).rows[0].source;
      assert.ok(definition.includes(contractVersion)); assert.ok(!definition.includes('ultimate-lesson-2026-10-05.1'));
    });
  } finally { await db.close(); }
});
