-- Organization/operator navigation: simple primary workflow with specialized modules grouped together.
-- The Admin shell reads this value at runtime and falls back to lib/admin/nav-config.ts if invalid.

INSERT INTO public.platform_settings (key, value, updated_at, updated_by, is_secret, is_active)
VALUES (
  'ADMIN_NAV_SECTIONS_JSON',
  $$[
    {"label":"Home","href":"/dashboard","items":[
      {"label":"Dashboard","href":"/dashboard"},
      {"label":"Students","href":"/students"},
      {"label":"Applications","href":"/applications"},
      {"label":"Enrollments","href":"/enrollments"},
      {"label":"Notifications","href":"/notifications"}
    ]},
    {"label":"CRM","href":"/crm","items":[
      {"label":"CRM Overview","href":"/crm"},
      {"label":"Leads","href":"/crm/leads"},
      {"label":"Contacts","href":"/crm/contacts"},
      {"label":"Deals","href":"/crm/deals"},
      {"label":"Campaigns","href":"/crm/campaigns"},
      {"label":"Follow-Ups","href":"/crm/follow-ups"}
    ]},
    {"label":"Community","href":"/community","items":[
      {"label":"Community Operations","href":"/community"},
      {"label":"Inbox","href":"/inbox"},
      {"label":"Live Chat","href":"/live-chat"},
      {"label":"Announcements","href":"/instructor/announcements"}
    ]},
    {"label":"Courses","href":"/courses","items":[
      {"label":"All Courses","href":"/courses"},
      {"label":"Programs","href":"/programs"},
      {"label":"Course Builder","href":"/admin/course-builder"},
      {"label":"Instructors","href":"/instructors"},
      {"label":"Certificates","href":"/certificates"},
      {"label":"Credentials","href":"/credentials"}
    ]},
    {"label":"Website","href":"/admin/website-editor","items":[
      {"label":"Website Editor","href":"/admin/website-editor"},
      {"label":"Content","href":"/content"},
      {"label":"Blog","href":"/blog"},
      {"label":"Store","href":"/store"}
    ]},
    {"label":"Automations","href":"/studio/workflows","items":[
      {"label":"Workflows","href":"/studio/workflows"},
      {"label":"Email Marketing","href":"/email-marketing"},
      {"label":"System Jobs","href":"/system/jobs"},
      {"label":"Webhooks","href":"/system/webhooks"},
      {"label":"Integrations","href":"/integrations"}
    ]},
    {"label":"AI Team","href":"/ai-team","items":[
      {"label":"AI Team","href":"/ai-team"},
      {"label":"Intelligence","href":"/intelligence"},
      {"label":"Completion Forecast","href":"/intelligence/forecast"}
    ]},
    {"label":"Reports","href":"/reports","items":[
      {"label":"Reports","href":"/reports"},
      {"label":"Analytics","href":"/analytics"},
      {"label":"Engagement","href":"/analytics/engagement"},
      {"label":"Learning","href":"/analytics/learning"},
      {"label":"Revenue","href":"/analytics/revenue"},
      {"label":"System Health","href":"/system-health"}
    ]},
    {"label":"Modules","href":"/funding","items":[
      {"label":"Workforce / WIOA","href":"/wioa"},
      {"label":"Funding","href":"/funding"},
      {"label":"Apprenticeship","href":"/apprenticeships"},
      {"label":"Testing Center","href":"/testing-center"},
      {"label":"Compliance","href":"/compliance"},
      {"label":"Employers","href":"/employers"},
      {"label":"Program Holders","href":"/program-holders"},
      {"label":"Dev Studio","href":"/admin/studio"},
      {"label":"Settings","href":"/settings"}
    ]}
  ]$$,
  now(),
  NULL,
  false,
  true
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now(),
  is_secret = false,
  is_active = true;
