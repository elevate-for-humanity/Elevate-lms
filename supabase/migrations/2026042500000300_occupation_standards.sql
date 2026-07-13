-- Industry standards cache table.
--
-- Stores O*NET, BLS, and CareerOneStop data per SOC code.
-- Refreshed on-demand via /api/admin/industry/refresh-standards.
-- Injected into AI course generation prompts so output is grounded
-- in real job task data rather than model training data alone.
--
-- Apply in Supabase Dashboard → SQL Editor.

CREATE TABLE IF NOT EXISTS public.occupation_standards (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  soc_code              text NOT NULL,          -- e.g. '21-1093.00'
  soc_title             text NOT NULL,          -- e.g. 'Social and Human Service Assistants'
  source                text NOT NULL,          -- 'onet' | 'bls' | 'careeronestop'

  -- O*NET fields
  tasks                 jsonb,   -- [{task: string, importance: number, frequency: number}]
  skills                jsonb,   -- [{name: string, importance: number, level: number}]
  knowledge             jsonb,   -- [{name: string, importance: number}]
  abilities             jsonb,   -- [{name: string, importance: number}]
  work_activities       jsonb,   -- [{name: string, importance: number}]
  technology_skills     jsonb,   -- [{name: string, hot_technology: boolean}]
  education_required    jsonb,   -- {typical_level: string, distribution: {level: string, pct: number}[]}
  work_context          jsonb,   -- [{name: string, value: string}]

  -- BLS fields
  median_annual_wage    integer,               -- USD
  employment_count      integer,               -- national
  projected_growth_pct  numeric(5,2),          -- 10-year projection %
  projected_growth_cat  text,                  -- 'much faster' | 'faster' | 'average' | 'slower' | 'decline'
  entry_wage            integer,               -- 10th percentile
  experienced_wage      integer,               -- 90th percentile
  indiana_median_wage   integer,               -- state-specific if available

  -- CareerOneStop fields
  certifications        jsonb,   -- [{name: string, organization: string, url: string}]
  apprenticeship_count  integer,
  job_postings_count    integer,
  top_employers         jsonb,   -- [{name: string, location: string}]

  -- Metadata
  fetched_at            timestamptz NOT NULL DEFAULT now(),
  expires_at            timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  fetch_error           text     -- last error if fetch failed
  -- is_stale is computed at query time: (now() > expires_at)
  -- GENERATED ALWAYS AS is not supported here (now() is not immutable)
);

-- Index for fast lookup by SOC code
CREATE INDEX IF NOT EXISTS idx_occupation_standards_soc ON public.occupation_standards (soc_code);
CREATE INDEX IF NOT EXISTS idx_occupation_standards_expires ON public.occupation_standards (expires_at);

-- Compliance domains table — stores credentialing body domain weights
-- (IC&RC, NAADAC, NHA, NCCER, state boards, etc.)
-- These are the authoritative domain structures that AI must cover.
CREATE TABLE IF NOT EXISTS public.credential_domains (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_code   text NOT NULL,   -- e.g. 'ICRC-PRS', 'NHA-CCMA', 'EPA-608'
  credential_title  text NOT NULL,
  governing_body    text NOT NULL,   -- e.g. 'IC&RC', 'NHA', 'EPA'
  state             text,            -- null = national
  version           text,            -- e.g. '2024'
  effective_date    date,
  domains           jsonb NOT NULL,  -- [{key, name, weight_pct, min_hours, competencies: string[]}]
  exam_blueprint    jsonb,           -- {total_questions, time_minutes, passing_score, domain_breakdown}
  source_url        text,
  verified_by       text,            -- name of SME who verified
  verified_at       timestamptz,
  compliance_status text NOT NULL DEFAULT 'draft_for_human_review',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credential_domains_code ON public.credential_domains (credential_code);

-- Seed known credential domains (IC&RC PRS, NHA CCMA, EPA 608)
-- These are manually authored from published exam blueprints.
-- compliance_status = 'draft_for_human_review' until SME-verified.

INSERT INTO public.credential_domains
  (credential_code, credential_title, governing_body, state, version, effective_date, domains, exam_blueprint, source_url, compliance_status)
VALUES
(
  'ICRC-PRS',
  'Peer Recovery Specialist',
  'IC&RC',
  NULL,
  '2023',
  '2023-01-01',
  '[
    {"key":"ethics","name":"Ethics and Boundaries","weight_pct":15,"min_hours":6,"competencies":["Maintain professional boundaries","Apply IC&RC Code of Ethics","Recognize dual relationships","Mandatory reporting obligations"]},
    {"key":"advocacy","name":"Advocacy","weight_pct":15,"min_hours":6,"competencies":["Navigate systems on behalf of peers","Connect to community resources","Assist with benefits enrollment","Reduce barriers to care"]},
    {"key":"mentoring","name":"Mentoring and Education","weight_pct":20,"min_hours":8,"competencies":["Share lived experience appropriately","Facilitate peer support groups","Teach recovery skills","Model recovery behaviors"]},
    {"key":"recovery_support","name":"Recovery and Wellness Support","weight_pct":25,"min_hours":10,"competencies":["Develop recovery plans","Identify triggers and warning signs","Apply wellness dimensions","Support medication-assisted recovery"]},
    {"key":"crisis","name":"Crisis Support","weight_pct":15,"min_hours":6,"competencies":["Recognize crisis indicators","Apply de-escalation techniques","Connect to crisis services","Document crisis contacts"]},
    {"key":"cultural","name":"Cultural Responsiveness","weight_pct":10,"min_hours":4,"competencies":["Apply trauma-informed care principles","Recognize cultural factors in recovery","Serve diverse populations","Address stigma"]}
  ]'::jsonb,
  '{"total_questions":100,"time_minutes":120,"passing_score":70,"domain_breakdown":{"ethics":15,"advocacy":15,"mentoring":20,"recovery_support":25,"crisis":15,"cultural":10}}'::jsonb,
  'https://internationalcredentialing.org/prs',
  'draft_for_human_review'
),
(
  'NHA-CCMA',
  'Certified Clinical Medical Assistant',
  'NHA',
  NULL,
  '2024',
  '2024-01-01',
  '[
    {"key":"patient_care","name":"Patient Care","weight_pct":24,"min_hours":10,"competencies":["Vital signs","Patient intake","Specimen collection","Wound care","Medication administration under supervision"]},
    {"key":"clinical_procedures","name":"Clinical Procedures","weight_pct":22,"min_hours":9,"competencies":["EKG/ECG","Phlebotomy","Urinalysis","Sterilization","Assisting with minor procedures"]},
    {"key":"administrative","name":"Administrative","weight_pct":20,"min_hours":8,"competencies":["Medical records","Scheduling","Insurance verification","HIPAA compliance","ICD/CPT coding basics"]},
    {"key":"communication","name":"Communication","weight_pct":18,"min_hours":7,"competencies":["Patient education","Telephone triage","Interdisciplinary communication","Cultural competency"]},
    {"key":"legal_ethics","name":"Legal and Ethical Issues","weight_pct":16,"min_hours":6,"competencies":["Scope of practice","Informed consent","Advance directives","Mandatory reporting","OSHA standards"]}
  ]'::jsonb,
  '{"total_questions":150,"time_minutes":180,"passing_score":70,"domain_breakdown":{"patient_care":24,"clinical_procedures":22,"administrative":20,"communication":18,"legal_ethics":16}}'::jsonb,
  'https://www.nhanow.com/certifications/medical-assistant',
  'draft_for_human_review'
),
(
  'EPA-608',
  'EPA Section 608 Universal Technician',
  'EPA',
  NULL,
  '2023',
  '2023-01-01',
  '[
    {"key":"core","name":"Core — General Knowledge","weight_pct":25,"min_hours":8,"competencies":["Refrigerant types and properties","Environmental impact of refrigerants","Clean Air Act Section 608","Ozone depletion and global warming potential"]},
    {"key":"type1","name":"Type I — Small Appliances","weight_pct":25,"min_hours":8,"competencies":["Recovery techniques for small appliances","Disposable cylinder regulations","System-dependent recovery","Recovery equipment certification"]},
    {"key":"type2","name":"Type II — High-Pressure Systems","weight_pct":25,"min_hours":8,"competencies":["High-pressure refrigerant handling","Leak detection","Recovery and recycling","Retrofit procedures"]},
    {"key":"type3","name":"Type III — Low-Pressure Systems","weight_pct":25,"min_hours":8,"competencies":["Low-pressure refrigerant handling","Purging and pressurizing","Leak testing","Evacuation procedures"]}
  ]'::jsonb,
  '{"total_questions":100,"time_minutes":120,"passing_score":70,"domain_breakdown":{"core":25,"type1":25,"type2":25,"type3":25}}'::jsonb,
  'https://www.epa.gov/section608',
  'draft_for_human_review'
)
ON CONFLICT (credential_code, version) DO NOTHING;

-- RLS: admin-only write, service role read
ALTER TABLE public.occupation_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_domains ENABLE ROW LEVEL SECURITY;

DROP policy if exists "service_role_all_occupation_standards" on public.occupation_standards;
CREATE policy "service_role_all_occupation_standards" on public.occupation_standards FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP policy if exists "authenticated_read_occupation_standards" on public.occupation_standards;
CREATE policy "authenticated_read_occupation_standards" on public.occupation_standards FOR SELECT TO authenticated USING (true);

DROP policy if exists "service_role_all_credential_domains" on public.credential_domains;
CREATE policy "service_role_all_credential_domains" on public.credential_domains FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP policy if exists "authenticated_read_credential_domains" on public.credential_domains;
CREATE policy "authenticated_read_credential_domains" on public.credential_domains FOR SELECT TO authenticated USING (true);

