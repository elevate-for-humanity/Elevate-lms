-- Track onboarding emails sent to applicants and auto follow-ups
CREATE TABLE IF NOT EXISTS onboarding_email_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_email text NOT NULL,
  applicant_name text,
  program text,
  email_type text NOT NULL DEFAULT 'workone',  -- 'workone' or 'barber'
  sent_at timestamptz NOT NULL DEFAULT now(),
  follow_up_sent_at timestamptz,
  responded_at timestamptz,
  follow_up_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sent',  -- sent, followed_up, responded, expired
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_log_email ON onboarding_email_log(applicant_email);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON onboarding_email_log(status);
