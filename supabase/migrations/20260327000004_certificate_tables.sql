-- Certificate and credential tables that are referenced in application code
-- but have no prior CREATE TABLE migration.
-- Apply manually via Supabase Dashboard SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- issued_certificates
-- Used by: app/admin/certificates/*, app/api/admin/certificates/bulk/
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS issued_certificates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number text NOT NULL UNIQUE,
  recipient_name    text NOT NULL,
  recipient_email   text NOT NULL,
  name              text,
  description       text,
  issue_date        date NOT NULL,
  signed_by         text NOT NULL DEFAULT 'Elevate for Humanity Career & Technical Institute',
  status            text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'revoked', 'expired')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE issued_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON issued_certificates
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
CREATE POLICY "service_role_all" ON issued_certificates
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- partner_certificates
-- Used by: app/api/admin/completions/, app/verify/[certificateId]/
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_certificates (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number text NOT NULL UNIQUE,
  certificate_url    text,
  verification_url   text,
  issued_date        date,
  issued_at          timestamptz,
  enrollment_id      uuid REFERENCES partner_lms_enrollments(id) ON DELETE SET NULL,
  user_id            uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE partner_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select" ON partner_certificates
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admin_all" ON partner_certificates
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
CREATE POLICY "service_role_all" ON partner_certificates
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- credential_verification
-- Used by: scripts/test-database.ts, scripts/test-full-system.ts
-- Minimal table — test scripts only check existence.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credential_verification (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id   uuid,
  verified_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_method text,
  verified_at     timestamptz NOT NULL DEFAULT now(),
  result          text CHECK (result IN ('valid','invalid','expired','revoked'))
);

ALTER TABLE credential_verification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON credential_verification
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
CREATE POLICY "service_role_all" ON credential_verification
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- certification_submissions
-- Used by: app/api/admin/certifications/review/
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certification_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      uuid REFERENCES programs(id) ON DELETE SET NULL,
  status          text NOT NULL DEFAULT 'pending',
                    CHECK (status IN ('pending','approved','rejected')),
  reviewed_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at     timestamptz,
  reviewer_notes  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE certification_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select" ON certification_submissions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "owner_insert" ON certification_submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_all" ON certification_submissions
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
CREATE POLICY "service_role_all" ON certification_submissions
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- id_verifications
-- Used by: app/api/verification/submit/, app/admin/verifications/
-- Note: no user_id column by design — files stored in documents table.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS id_verifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name  text NOT NULL,
  id_type    text NOT NULL,
  status     text NOT NULL DEFAULT 'pending',
               CHECK (status IN ('pending','approved','rejected','under_review')),
  reviewed_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at  timestamptz,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE id_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON id_verifications
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
CREATE POLICY "service_role_all" ON id_verifications
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- certiport_exam_requests
-- Used by: app/api/certiport-exam/*, app/certiport-exam/
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certiport_exam_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_code       text NOT NULL,
  exam_name       text NOT NULL,
  exam_category   text,
  course_id       uuid,
  program_slug    text,
  student_name    text,
  student_email   text,
  funding_source  text,
  voucher_code    text,
  status          text NOT NULL DEFAULT 'pending',
                    CHECK (status IN ('pending','paid','voucher_assigned','completed','cancelled')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE certiport_exam_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select" ON certiport_exam_requests
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "owner_insert" ON certiport_exam_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_all" ON certiport_exam_requests
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
CREATE POLICY "service_role_all" ON certiport_exam_requests
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- user_credentials
-- Used by: lib/credentials/credential-system.ts
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_credentials (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id          text NOT NULL,
  course_id              uuid,
  awarded_at             timestamptz NOT NULL DEFAULT now(),
  expires_at             timestamptz,
  verification_code      text NOT NULL UNIQUE,
  external_credential_id text,
  score                  integer,
  status                 text NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','expired','revoked'))
);

ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select" ON user_credentials
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admin_all" ON user_credentials
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
CREATE POLICY "service_role_all" ON user_credentials
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- credential_share_links
-- Used by: lib/credential-generator.ts, app/c/[token]/
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credential_share_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token           text NOT NULL UNIQUE,
  credential_id   text NOT NULL,
  credential_code text,
  expires_at      timestamptz NOT NULL,
  one_time_use    boolean NOT NULL DEFAULT false,
  used_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE credential_share_links ENABLE ROW LEVEL SECURITY;
-- Public read by token (used in /c/[token] public page)
CREATE POLICY "public_select_by_token" ON credential_share_links
  FOR SELECT USING (true);
CREATE POLICY "service_role_all" ON credential_share_links
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- certifications
-- Used by: supabase/functions/check-course-completion/, app/agencies/
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certifications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id             uuid,
  certification_name    text,
  certification_issuer  text NOT NULL DEFAULT 'Elevate for Humanity',
  type                  text DEFAULT 'individual',
  is_active             boolean NOT NULL DEFAULT true,
  issued_at             timestamptz NOT NULL DEFAULT now(),
  expires_at            timestamptz
);

ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select" ON certifications
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "admin_all" ON certifications
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
CREATE POLICY "service_role_all" ON certifications
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- certification_types
-- Used by: app/admin/certifications/bulk/
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certification_types (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  provider         text,
  validity_months  integer,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE certification_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_select" ON certification_types
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all" ON certification_types
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
CREATE POLICY "service_role_all" ON certification_types
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- user_certifications
-- Used by: app/admin/certifications/bulk/, lib/hub/job-matching.ts
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_certifications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certification_type_id uuid REFERENCES certification_types(id) ON DELETE SET NULL,
  certification_name    text,
  certification_type    text,
  status                text NOT NULL DEFAULT 'pending',
                          CHECK (status IN ('pending','active','expired','revoked')),
  earned_date           date,
  expires_at            timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select" ON user_certifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admin_all" ON user_certifications
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
CREATE POLICY "service_role_all" ON user_certifications
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- credentials_attained
-- Used by: app/api/analytics/reports/wioa-quarterly/, app/api/reports/wioa-quarterly/
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credentials_attained (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_date  date NOT NULL,
  credential  text,
  program_id  uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE credentials_attained ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON credentials_attained
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
CREATE POLICY "service_role_all" ON credentials_attained
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- certificate_templates
-- Used by: app/admin/certificates/issue/, app/admin/certificates/bulk/
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificate_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON certificate_templates
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
CREATE POLICY "service_role_all" ON certificate_templates
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- verify_audit
-- Used by: app/api/verify/route.ts — rate-limited credential verification log
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verify_audit (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash       text,
  credential_id text,
  result        text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE verify_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON verify_audit
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
CREATE POLICY "service_role_all" ON verify_audit
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- reporting_credentials
-- Used by: app/api/reports/credentials/
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reporting_credentials (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  program_id      uuid,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_name text,
  issued_at       timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz
);

ALTER TABLE reporting_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON reporting_credentials
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
CREATE POLICY "service_role_all" ON reporting_credentials
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- external_credentials
-- Used by: app/api/credentials/complete/
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS external_credentials (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider     text NOT NULL,
  status       text NOT NULL DEFAULT 'in_progress',
                 CHECK (status IN ('in_progress','completed','failed','expired')),
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE external_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select" ON external_credentials
  FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "admin_all" ON external_credentials
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
CREATE POLICY "service_role_all" ON external_credentials
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- cert_revocation_log
-- Used by: app/api/cert/revocations/
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cert_revocation_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial          text,
  learner_email   text,
  course_title    text,
  issued_at       timestamptz,
  expires_at      timestamptz,
  revoked_at      timestamptz NOT NULL DEFAULT now(),
  revoked_reason  text
);

ALTER TABLE cert_revocation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON cert_revocation_log
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
CREATE POLICY "service_role_all" ON cert_revocation_log
  USING (auth.role() = 'service_role');
