-- Expand application statuses for Virtual Admissions Office
-- Original: submitted, in_review, under_review, approved, rejected, enrolled, pending_workone, waitlisted
-- New: Adds fee_required, documents_required, paris_required, eligibility_review, funding_verification, manual_review, ready_for_enrollment, auto_enrolled

-- Add enrollment_status column for detailed tracking
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS enrollment_status TEXT DEFAULT NULL;

-- Add failure_reasons column to track what needs review
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS failure_reasons TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add queue_priority column
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS queue_priority INTEGER DEFAULT 5;

-- Add assigned_reviewer column
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS assigned_reviewer UUID REFERENCES profiles(id);

-- Add queue_entered_at timestamp
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS queue_entered_at TIMESTAMPTZ;

-- Add last_reevaluation_at timestamp
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS last_reevaluation_at TIMESTAMPTZ;

-- Add reevaluation_count
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS reevaluation_count INTEGER DEFAULT 0;

-- Create enum for enrollment status
DO $$ BEGIN
  CREATE TYPE enrollment_stage AS ENUM (
    'submitted',
    'fee_required',
    'fee_paid',
    'documents_required',
    'documents_approved',
    'paris_required',
    'paris_completed',
    'eligibility_review',
    'eligibility_verified',
    'funding_verification',
    'funding_approved',
    'ready_for_enrollment',
    'auto_enrolled',
    'manual_review',
    'enrolled',
    'waitlisted',
    'declined'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add the typed column
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS enrollment_stage enrollment_stage;

-- Create index for queue queries
CREATE INDEX IF NOT EXISTS idx_applications_enrollment_stage 
ON public.applications(enrollment_stage) 
WHERE enrollment_stage IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_queue_priority 
ON public.applications(queue_priority) 
WHERE queue_priority < 5;

CREATE INDEX IF NOT EXISTS idx_applications_requiring_review 
ON public.applications(assigned_reviewer) 
WHERE assigned_reviewer IS NULL AND enrollment_stage = 'manual_review';

-- Update existing records with new enrollment_stage
UPDATE public.applications 
SET enrollment_stage = 'enrolled' 
WHERE status = 'enrolled' AND enrollment_stage IS NULL;

UPDATE public.applications 
SET enrollment_stage = 'submitted' 
WHERE status = 'submitted' AND enrollment_stage IS NULL;

UPDATE public.applications 
SET enrollment_stage = 'manual_review' 
WHERE status IN ('in_review', 'under_review') AND enrollment_stage IS NULL;

UPDATE public.applications 
SET enrollment_stage = 'auto_enrolled' 
WHERE status = 'approved' AND enrollment_stage IS NULL;

UPDATE public.applications 
SET enrollment_stage = 'waitlisted' 
WHERE status = 'waitlisted' AND enrollment_stage IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.applications.enrollment_stage IS 'Detailed enrollment pipeline stage for Virtual Admissions Office automation';
COMMENT ON COLUMN public.applications.failure_reasons IS 'Array of reasons why application requires manual review';
COMMENT ON COLUMN public.applications.queue_priority IS 'Priority level: 1=urgent, 2=high, 3=medium, 4=low, 5=normal';
COMMENT ON COLUMN public.applications.assigned_reviewer IS 'Staff member assigned to review this application';
COMMENT ON COLUMN public.applications.queue_entered_at IS 'When application entered manual review queue';
COMMENT ON COLUMN public.applications.last_reevaluation_at IS 'Last time enrollment eligibility was automatically re-evaluated';
COMMENT ON COLUMN public.applications.reevaluation_count IS 'Number of times enrollment eligibility has been re-evaluated';
