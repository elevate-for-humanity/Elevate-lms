-- ================================================================
-- EFH Unicorn SaaS LMS — DEMO TENANT SEED
-- Replace {{OWNER_USER_ID}}, {{STRIPE_CUSTOMER_ID}}, {{ORG_NAME}}
-- Run in Supabase SQL editor (as service role). Idempotent-ish.
-- ================================================================

-- INSTRUCTIONS:
-- 1. Get your user ID: select id,email from auth.users order by created_at desc limit 10;
-- 2. Replace {{OWNER_USER_ID}} with your UUID
-- 3. Replace {{ORG_NAME}} with your org name (e.g., "Elevate for Humanity")
-- 4. Replace {{STRIPE_CUSTOMER_ID}} with your Stripe customer ID or leave as 'cus_demo_efh'
-- 5. Run this entire script in Supabase SQL Editor
-- 6. Get the org_id from the orgs table
-- 7. In browser console: localStorage.setItem('org_id', 'YOUR-ORG-UUID');

-- 1) Create org + owner member + basic settings/entitlements/billing
with new_org as (
  insert into orgs (name, slug, tier)
  values ('{{ORG_NAME}}', 'elevate-for-humanity', 'starter')
  on conflict (slug) do update set name = excluded.name
  returning id
), ensure_owner as (
  insert into org_members (org_id, user_id, role)
  select id, '{{OWNER_USER_ID}}'::uuid, 'owner'::app_role from new_org
  on conflict (org_id, user_id) do nothing
  returning org_id
), seed_settings as (
  insert into org_settings (org_id, config)
  select org_id, jsonb_build_object(
    'branding', jsonb_build_object('primary', '#111827', 'accent', '#06b6d4', 'logoUrl', null),
    'featureFlags', jsonb_build_object(
      'aiWebsiteBuilder', true,
      'aiCourseCreator', true,
      'community', true,
      'marketing', true,
      'analytics', true
    )
  )
  from ensure_owner
  on conflict (org_id) do update set config = excluded.config, updated_at = now()
  returning org_id
), seed_entitlements as (
  insert into entitlements (org_id, max_seats, max_courses, features)
  select org_id, 10, 25,
    jsonb_build_object('audit', true, 'customBranding', true, 'sso', false)
  from seed_settings
  on conflict (org_id) do update
    set max_seats = excluded.max_seats,
        max_courses = excluded.max_courses,
        features = excluded.features,
        updated_at = now()
  returning org_id
), seed_billing as (
  insert into billing_subscriptions (org_id, stripe_customer_id, plan, status)
  select org_id, '{{STRIPE_CUSTOMER_ID}}', 'starter', 'active'
  from seed_entitlements
  on conflict (org_id) do update
    set stripe_customer_id = excluded.stripe_customer_id,
        plan = excluded.plan,
        status = excluded.status
  returning org_id
)
select org_id as seeded_org_id from seed_billing;

-- 2) Course catalog (course -> module -> lesson) + media
with org as (
  select id as org_id from orgs where name = '{{ORG_NAME}}' order by created_at desc limit 1
),
mk_course as (
  insert into courses (org_id, title, slug, description, status, created_by)
  select org_id, 'Early Childhood Education (CDA Pathway)',
         'cda-pathway',
         'Short-term, WRG-aligned CDA prep with practicum.',
         'published'::pub_status, '{{OWNER_USER_ID}}'::uuid
  from org
  on conflict (org_id, slug) do update set title = excluded.title
  returning id, org_id
),
mk_module as (
  insert into modules (org_id, course_id, title, position)
  select org_id, id, 'Foundations of Child Development', 1 from mk_course
  on conflict do nothing
  returning id, org_id, course_id
),
mk_lesson1 as (
  insert into lessons (org_id, module_id, title, content, status)
  select org_id, id, 'Safety & Licensing Basics',
    jsonb_build_object('blocks', jsonb_build_array('licensing overview','safety checklists')),
    'published'::pub_status
  from mk_module
  on conflict do nothing
  returning id, org_id
),
mk_lesson2 as (
  insert into lessons (org_id, module_id, title, content, status)
  select org_id, id, 'Child Development Stages',
    jsonb_build_object('blocks', jsonb_build_array('cognitive','social-emotional','physical')),
    'published'::pub_status
  from mk_module
  on conflict do nothing
  returning id, org_id
),
mk_media as (
  insert into media_assets (org_id, kind, url, metadata)
  select org_id, 'pdf', 'https://example.com/cda-handbook.pdf',
         jsonb_build_object('size','2MB') from org
  on conflict do nothing
  returning org_id
)
select 'Course seed complete' as status;

-- 3) Assessment: bank, questions, assessment, items, sample attempt
with org as (
  select id as org_id from orgs where name = '{{ORG_NAME}}' order by created_at desc limit 1
),
bank as (
  insert into question_banks (org_id, title)
  select org_id, 'CDA Foundations Bank' from org
  on conflict do nothing
  returning id, org_id
),
qs as (
  insert into questions (org_id, bank_id, type, prompt, answer_key, metadata)
  select org_id, id, 'mcq',
         jsonb_build_object('q','What document is required for licensing?','choices',array['Immunization Record','Daily Schedule','Staff Handbook']),
         jsonb_build_object('correct','Immunization Record'),
         '{}'::jsonb
  from bank
  on conflict do nothing
  returning id, org_id
),
assess as (
  insert into assessments (org_id, course_id, title, config, status)
  select o.org_id, c.id, 'CDA Module 1 Quiz',
         jsonb_build_object('timeLimit', 900, 'proctor', false),
         'published'::pub_status
  from org o
  join courses c on c.org_id = o.org_id and c.status = 'published'
  order by c.created_at desc
  limit 1
  on conflict do nothing
  returning id, org_id
),
items as (
  insert into assessment_items (org_id, assessment_id, question_id, position)
  select q.org_id, a.id, q.id, 1
  from qs q join assess a on a.org_id = q.org_id
  on conflict do nothing
  returning org_id
)
select 'Assessment seed complete' as status;

-- 4) Community & gamification
with org as (
  select id as org_id from orgs where name='{{ORG_NAME}}' order by created_at desc limit 1
),
thread as (
  insert into forum_threads (org_id, title, created_by)
  select org_id, 'Welcome to EFH Community', '{{OWNER_USER_ID}}'::uuid from org
  on conflict do nothing
  returning id, org_id
),
post as (
  insert into forum_posts (org_id, thread_id, author_id, content)
  select org_id, id, '{{OWNER_USER_ID}}'::uuid,
         jsonb_build_object('markdown','Introduce yourself and your program focus!')
  from thread
  on conflict do nothing
  returning org_id
),
badge as (
  insert into badges (org_id, key, name, description)
  select org_id, 'founder', 'Founder Badge', 'Early supporter & facilitator'
  from org
  on conflict do nothing
  returning id, org_id
),
award as (
  insert into user_badges (org_id, user_id, badge_id)
  select b.org_id, '{{OWNER_USER_ID}}'::uuid, b.id from badge b
  on conflict do nothing
  returning org_id
),
lb as (
  insert into leaderboards (org_id, user_id, points)
  select org_id, '{{OWNER_USER_ID}}'::uuid, 100 from org
  on conflict (org_id, user_id) do update set points = 100
  returning org_id
)
select 'Community seed complete' as status;

-- 5) Marketing (campaign + A/B) + Funnel + Webhook endpoint
with org as (
  select id as org_id from orgs where name='{{ORG_NAME}}' order by created_at desc limit 1
),
camp as (
  insert into campaigns (org_id, name, channel, config, status)
  select org_id, 'CDA Cohort Launch', 'email',
         jsonb_build_object('subject','Welcome to CDA', 'from','training@efh.org'),
         'draft'
  from org
  on conflict do nothing
  returning id, org_id
),
ab as (
  insert into ab_tests (org_id, entity, variants, metrics)
  select org_id, 'email.subject',
         jsonb_build_object('A', jsonb_build_object('subject','Start CDA This Month'),
                            'B', jsonb_build_object('subject','Your CDA Scholarship Awaits')),
         '{}'::jsonb
  from org
  on conflict do nothing
  returning org_id
),
fn as (
  insert into funnels (org_id, name, steps)
  select org_id, 'CDA Enrollment',
    jsonb_build_array(
      jsonb_build_object('step','visit','path','/programs/cda'),
      jsonb_build_object('step','apply','form','/apply'),
      jsonb_build_object('step','enroll','pay','WRG/WIOA')
    )
  from org
  on conflict do nothing
  returning org_id
),
wh as (
  insert into webhook_endpoints (org_id, url, secret, active)
  select org_id, 'https://hooks.zapier.com/hooks/catch/123/abc', 'shh_demo', true from org
  on conflict do nothing
  returning org_id
)
select 'Marketing seed complete' as status;

-- 6) Analytics dashboard + sample events
with org as (
  select id as org_id from orgs where name='{{ORG_NAME}}' order by created_at desc limit 1
),
dash as (
  insert into dashboards (org_id, name, widgets)
  select org_id, 'Executive Overview',
    jsonb_build_array(
      jsonb_build_object('kpi','Active Students','query','count_students'),
      jsonb_build_object('kpi','Course Completions','query','count_completions'),
      jsonb_build_object('chart','Enrollments by Week','query','enrollments_by_week')
    )
  from org
  on conflict do nothing
  returning org_id
),
ev as (
  insert into analytics_events (org_id, user_id, name, properties)
  select org_id, '{{OWNER_USER_ID}}'::uuid, 'lesson.view',
    jsonb_build_object('course','CDA','lesson','Safety & Licensing') from org
  on conflict do nothing
  returning org_id
)
select 'Analytics seed complete' as status;

-- 7) AI Website Builder — sample landing page
with org as (
  select id as org_id from orgs where name='{{ORG_NAME}}' order by created_at desc limit 1
)
insert into pages (org_id, slug, title, html, css, metadata, status)
select org_id, 'cda-landing',
  'CDA Pathway — Elevate for Humanity',
  '<section class="hero"><h1>Earn Your CDA</h1><p>WRG-funded, childcare-friendly training.</p></section>',
  '.hero{padding:64px 24px; max-width:960px; margin:0 auto;} h1{font-size:42px;}',
  jsonb_build_object('seo', jsonb_build_object('description','CDA workforce pathway')),'published'
from org
on conflict (org_id, slug) do update
  set title = excluded.title,
      html = excluded.html,
      css = excluded.css,
      metadata = excluded.metadata,
      status = excluded.status;

-- 8) Audit log a few key actions
with org as (select id as org_id from orgs where name='{{ORG_NAME}}' order by created_at desc limit 1)
insert into audit_logs (org_id, actor_id, action, target, diff)
select org_id, '{{OWNER_USER_ID}}'::uuid, 'seed.init', 'org', jsonb_build_object('name','{{ORG_NAME}}') from org
on conflict do nothing;

-- 9) Show the org_id for easy copy-paste
select id as org_id, name, tier, created_at 
from orgs 
where name = '{{ORG_NAME}}' 
order by created_at desc 
limit 1;

-- ================================================================
-- SEED COMPLETE!
-- Copy the org_id from the result above, then in browser console:
-- localStorage.setItem('org_id', 'YOUR-ORG-UUID-HERE');
-- ================================================================
