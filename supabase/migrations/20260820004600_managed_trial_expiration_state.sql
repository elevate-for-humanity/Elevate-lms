-- Canonical platform trials are stored in managed_licenses.
-- Give the lifecycle worker an explicit terminal state rather than overloading
-- suspended/canceled, which have different operational meanings.

ALTER TABLE public.managed_licenses
  DROP CONSTRAINT IF EXISTS managed_licenses_status_check;

ALTER TABLE public.managed_licenses
  ADD CONSTRAINT managed_licenses_status_check
  CHECK (
    status = ANY (
      ARRAY[
        'trial'::text,
        'active'::text,
        'past_due'::text,
        'canceled'::text,
        'suspended'::text,
        'expired'::text
      ]
    )
  );
