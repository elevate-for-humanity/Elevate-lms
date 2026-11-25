// @vitest-environment node
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, expect, it } from 'vitest';

const programId = '10000000-0000-0000-0000-000000000001';
const courseId = '20000000-0000-0000-0000-000000000001';
const moduleId = '30000000-0000-0000-0000-000000000001';

let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role;
    create table programs (id uuid primary key, published boolean, is_active boolean, status text,
      has_lms_course boolean, delivery_model text, slug text, title text, description text,
      review_status text, org_id uuid, version integer, published_at timestamptz,
      published_by uuid, updated_at timestamptz, hero_image_url text);
    create table courses (id uuid primary key, program_id uuid references programs,
      status text, is_active boolean, published_at timestamptz, generation_status text, slug text, title text);
    create table program_media (program_id uuid references programs, media_type text, url text, alt_text text, sort_order integer);
    create table program_ctas (program_id uuid references programs, label text, href text);
    create table program_tracks (program_id uuid references programs, available boolean, title text);
    create table program_modules (program_id uuid references programs, is_published boolean, title text,
      id uuid primary key default gen_random_uuid());
    create table program_lessons (module_id uuid references program_modules);
    create table program_credentials (program_id uuid references programs);
    create table program_outcomes (program_id uuid references programs);
    create table program_versions (org_id uuid, program_id uuid, version integer, snapshot jsonb,
      created_by uuid, created_at timestamptz, unique(program_id,version));
    create table course_modules (id uuid primary key, course_id uuid references courses,
      is_published boolean, is_draft boolean, title text);
    create table course_lessons (course_id uuid references courses, module_id uuid references course_modules,
      is_required boolean, is_published boolean, status text, title text, lesson_type text,
      quiz_questions jsonb, rendered_html text, video_url text, content jsonb, content_json jsonb);
    insert into programs (id,published,is_active,status,has_lms_course,delivery_model,slug,title,description)
      values ('${programId}', false, false, 'draft', true,
      'internal_lms', 'example', 'Example program', 'Program description');
    insert into courses (id,program_id,status,is_active,generation_status,slug,title)
      values ('${courseId}','${programId}','draft',false,'draft','example','Example course');
    insert into course_modules values ('${moduleId}','${courseId}',false,true,'First module');
    insert into course_lessons (course_id,module_id,is_required,is_published,status,title,lesson_type)
      values ('${courseId}','${moduleId}',true,false,'draft','First assessment','quiz');
    grant select, update on courses, programs to service_role;
  `);
  await db.exec(readFileSync(
    'supabase/migrations/20261125122000_enforce_catalog_publication_readiness.sql', 'utf8',
  ));
}, 30_000);

afterAll(async () => { await db?.close(); });

it('blocks a direct database write that tries to publish an incomplete catalog entry', async () => {
  await expect(db.exec(`
    set role service_role;
    update programs set published=true, is_active=true where id='${programId}';
  `)).rejects.toThrow('Supply program hero media');
  await db.exec('reset role');
  expect((await db.query('select published from programs')).rows).toEqual([{ published: false }]);
});

it('rejects missing assessments and atomically accepts a complete linked course and catalog', async () => {
  await db.exec(`
    update programs set hero_image_url='/images/example.webp' where id='${programId}';
    insert into program_ctas values ('${programId}','Apply','/apply?program=example');
    insert into program_tracks values ('${programId}',true,'Self-pay');
    insert into program_modules (program_id,is_published,title) values ('${programId}',true,'First module');
  `);
  await expect(db.query('select publish_catalog_program($1,$1)', [programId]))
    .rejects.toThrow('Approve the program');
  await db.query("update programs set review_status='approved',org_id=$1 where id=$1", [programId]);
  await expect(db.query('select publish_catalog_program($1,$1)', [programId]))
    .rejects.toThrow('finish publishing the linked LMS course');
  expect((await db.query('select version from program_versions')).rows).toEqual([]);
  expect((await db.query('select url from program_media')).rows).toEqual([]);
  await expect(db.exec(`update programs set published=true where id='${programId}'`))
    .rejects.toThrow('Supply program hero media');

  const publishMaterials = `
    update courses set status='published',is_active=true,generation_status='published',published_at=now()
      where id='${courseId}';
    update course_modules set is_published=true,is_draft=false where id='${moduleId}';
    update course_lessons set is_published=true,status='published' where module_id='${moduleId}';
  `;
  await expect(db.exec(publishMaterials)).rejects.toThrow('Finish course generation');
  expect((await db.query('select status from courses')).rows).toEqual([{ status: 'draft' }]);

  await db.exec(`begin;
    ${publishMaterials}
    update course_lessons set quiz_questions='[{"prompt":"A reviewed training question"}]'
      where module_id='${moduleId}';
    select publish_catalog_program('${programId}','${programId}');
    commit;
  `);
  expect((await db.query('select published from programs')).rows).toEqual([{ published: true }]);
  expect((await db.query('select status from courses')).rows).toEqual([{ status: 'published' }]);
  expect((await db.query('select version from program_versions')).rows).toEqual([{ version: 1 }]);
  expect((await db.query('select url from program_media')).rows).toEqual([{ url: '/images/example.webp' }]);
  expect((await db.query("select has_function_privilege('authenticated','publish_catalog_program(uuid,uuid)','execute') as allowed")).rows)
    .toEqual([{ allowed: false }]);
});

it('keeps complete externally delivered catalog programs publishable', async () => {
  const partnerId = '10000000-0000-0000-0000-000000000002';
  await db.exec(`begin;
    insert into programs (id,published,is_active,status,has_lms_course,delivery_model,slug,title,description)
      values ('${partnerId}',true,true,'active',false,
      'partner_managed','partner','Partner program','Partner description');
    insert into program_media (program_id,media_type,url) values ('${partnerId}','hero_image','/images/partner.webp');
    insert into program_ctas values ('${partnerId}','Contact the partner','/contact?program=partner');
    insert into program_tracks values ('${partnerId}',true,'Partner enrollment');
    commit;`);
  expect((await db.query('select published from programs where id=$1', [partnerId])).rows)
    .toEqual([{ published: true }]);
});
