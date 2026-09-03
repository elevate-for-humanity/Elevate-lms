-- Workforce Board Tables
--
-- Creates wioa_participants, wioa_cases, and ensures ita_vouchers has
-- all required columns. Apply in Supabase Dashboard → SQL Editor.

-- ── wioa_participants ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.wioa_participants (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name       text NOT NULL,
  last_name        text NOT NULL,
  email            text,
  phone            text,
  status           text NOT NULL DEFAULT 'active', -- active, exited, completed, transferred
  program_id       uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  case_manager_id  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  enrollment_date  timestamptz,
  exit_date        timestamptz,
  exit_reason      text,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wioa_participants_status_idx      ON public.wioa_participants (status);
CREATE INDEX IF NOT EXISTS wioa_participants_program_idx     ON public.wioa_participants (program_id);
CREATE INDEX IF NOT EXISTS wioa_participants_case_mgr_idx    ON public.wioa_participants (case_manager_id);
CREATE INDEX IF NOT EXISTS wioa_participants_email_idx       ON public.wioa_participants (email);

-- ── wioa_cases ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.wioa_cases (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number      text UNIQUE NOT NULL,
  participant_id   uuid REFERENCES public.wioa_participants(id) ON DELETE CASCADE,
  case_manager_id  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  program_id       uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  status           text NOT NULL DEFAULT 'open', -- open, closed, transferred, suspended
  funding_amount   numeric(10,2) DEFAULT 0,
  funding_used     numeric(10,2) DEFAULT 0,
  opened_at        timestamptz DEFAULT now(),
  closed_at        timestamptz,
  notes            text,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wioa_cases_participant_idx  ON public.wioa_cases (participant_id);
CREATE INDEX IF NOT EXISTS wioa_cases_status_idx       ON public.wioa_cases (status);
CREATE INDEX IF NOT EXISTS wioa_cases_case_number_idx  ON public.wioa_cases (case_number);

-- ── ita_vouchers — ensure all columns exist ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ita_vouchers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_number  text UNIQUE NOT NULL,
  user_id         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  program_id      uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  case_id         uuid REFERENCES public.wioa_cases(id) ON DELETE SET NULL,
  amount          numeric(10,2) NOT NULL DEFAULT 0,
  amount_used     numeric(10,2) DEFAULT 0,
  status          text NOT NULL DEFAULT 'issued', -- issued, redeemed, expired, cancelled
  issued_at       timestamptz DEFAULT now(),
  expires_at      timestamptz,
  redeemed_at     timestamptz,
  issued_by       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ita_vouchers_user_idx    ON public.ita_vouchers (user_id);
CREATE INDEX IF NOT EXISTS ita_vouchers_status_idx  ON public.ita_vouchers (status);
CREATE INDEX IF NOT EXISTS ita_vouchers_program_idx ON public.ita_vouchers (program_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.wioa_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wioa_cases        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ita_vouchers      ENABLE ROW LEVEL SECURITY;

-- Workforce board staff and admins can read/write participants
CREATE POLICY "wioa_participants_select" ON public.wioa_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('workforce_board', 'admin', 'super_admin', 'staff')
  ));

CREATE POLICY "wioa_participants_insert" ON public.wioa_participants FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('workforce_board', 'admin', 'super_admin', 'staff')
  ));

CREATE POLICY "wioa_participants_update" ON public.wioa_participants FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('workforce_board', 'admin', 'super_admin', 'staff')
  ));

-- Cases
CREATE POLICY "wioa_cases_select" ON public.wioa_cases FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('workforce_board', 'admin', 'super_admin', 'staff')
  ));

CREATE POLICY "wioa_cases_insert" ON public.wioa_cases FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('workforce_board', 'admin', 'super_admin', 'staff')
  ));

-- ITA vouchers: users can see their own; staff/admin see all
CREATE POLICY "ita_vouchers_select" ON public.ita_vouchers FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('workforce_board', 'admin', 'super_admin', 'staff'))
  );

CREATE POLICY "ita_vouchers_insert" ON public.ita_vouchers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('workforce_board', 'admin', 'super_admin', 'staff')
  ));
