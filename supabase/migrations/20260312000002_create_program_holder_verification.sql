-- program_holder_verification was referenced by ALTER TABLE migrations but never created.
-- This ensures the table exists before those ALTERs run (idempotent).
CREATE TABLE IF NOT EXISTS public.program_holder_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id UUID REFERENCES public.program_holders(id) ON DELETE CASCADE,
  verification_type TEXT,
  status TEXT DEFAULT 'pending',
  stripe_verification_session_id TEXT,
  identity_documents_uploaded BOOLEAN DEFAULT false,
  identity_documents_uploaded_at TIMESTAMPTZ,
  identity_verification_status TEXT,
  ssn_verified BOOLEAN DEFAULT false,
  ssn_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS program_holder_verification_holder_idx
  ON public.program_holder_verification (program_holder_id);
