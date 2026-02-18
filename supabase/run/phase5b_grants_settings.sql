-- Ensure unique index for ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS idx_grant_opportunities_external_id_unique ON grant_opportunities(external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_settings_key_unique ON site_settings(key);

-- Seed real grant opportunities
INSERT INTO grant_opportunities (external_id, title, description, funder, amount_min, amount_max, deadline, focus_areas, status, url) VALUES
  ('wioa-adult-in', 'WIOA Adult Program — Indiana', 'Workforce Innovation and Opportunity Act Title I Adult funding for occupational skills training, on-the-job training, and supportive services for eligible adults.', 'Indiana Department of Workforce Development', 3000, 10000, '2026-06-30T23:59:59Z', ARRAY['workforce','training','adult'], 'open', 'https://www.in.gov/dwd/wioa/'),
  ('wioa-youth-in', 'WIOA Youth Program — Indiana', 'WIOA Title I Youth funding for out-of-school and in-school youth ages 16-24, including paid work experience and occupational skills training.', 'Indiana Department of Workforce Development', 3000, 10000, '2026-06-30T23:59:59Z', ARRAY['workforce','youth','training'], 'open', 'https://www.in.gov/dwd/wioa/'),
  ('rap-dol', 'DOL Registered Apprenticeship Program', 'Federal support for Registered Apprenticeship sponsors including technical assistance, credential recognition, and connections to WIOA funding.', 'U.S. Department of Labor', 0, 0, NULL, ARRAY['apprenticeship','workforce','credentials'], 'open', 'https://www.apprenticeship.gov/'),
  ('pell-grant', 'Federal Pell Grant', 'Need-based federal grant for eligible students enrolled in approved postsecondary programs. Does not need to be repaid.', 'U.S. Department of Education', 750, 7395, '2026-06-30T23:59:59Z', ARRAY['education','financial-aid'], 'open', 'https://studentaid.gov/understand-aid/types/grants/pell'),
  ('next-level-jobs', 'Next Level Jobs — Workforce Ready Grant', 'Indiana state program covering tuition and fees for high-demand certificate programs in healthcare, IT, advanced manufacturing, building/construction, and transportation/logistics.', 'Indiana Commission for Higher Education', 0, 8000, NULL, ARRAY['workforce','indiana','tuition'], 'open', 'https://www.in.gov/che/state-financial-aid/workforce-ready-grant/')
ON CONFLICT (external_id) DO NOTHING;

-- Seed site_settings
INSERT INTO site_settings (key, value) VALUES
  ('contact_info', '{"phone": "(317) 314-3757", "email": "info@elevateforhumanity.org", "address": "Indianapolis, IN", "hours": "Mon-Fri 9am-5pm EST"}'),
  ('enrollment_contact', '{"phone": "(317) 314-3757", "email": "enroll@elevateforhumanity.org", "name": "Enrollment Services"}'),
  ('staff_applications', '{"enabled": true, "form_url": "/apply/staff", "positions_open": true}'),
  ('employer_applications', '{"enabled": true, "form_url": "/apply/employer"}'),
  ('program_holder_applications', '{"enabled": true, "form_url": "/apply/program-holder"}'),
  ('signup_enabled', '{"enabled": true}'),
  ('mobile_app', '{"ios_url": null, "android_url": null, "pwa_enabled": true}'),
  ('parent_portal', '{"enabled": true, "description": "Monitor your student progress, view attendance, and communicate with instructors."}'),
  ('last_security_audit', '{"date": "2026-01-15", "auditor": "Internal", "status": "passed", "next_audit": "2026-07-15"}'),
  ('trust_stats', '{"programs_offered": 12, "employer_partners": 50, "job_placement_rate": 85, "completion_rate": 92}'),
  ('employer_stats', '{"active_partners": 50, "industries": 8, "avg_starting_wage": 18.50}'),
  ('home_hero_config', '{"headline": "Free Career Training That Leads to Real Jobs", "subheadline": "WIOA-funded programs in healthcare, skilled trades, technology, and more.", "cta_text": "View Programs", "cta_url": "/programs"}'),
  ('live_chat_config', '{"enabled": true, "provider": "tidio", "hours": "Mon-Fri 9am-5pm EST"}'),
  ('custom_styles', '{"primary_color": "#dc2626", "secondary_color": "#2563eb"}')
ON CONFLICT (key) DO NOTHING;
