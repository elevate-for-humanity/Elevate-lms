-- Fix document approval notification trigger
-- The trigger on documents fires a notification with type 'document_approved'
-- which violates the notifications.type check constraint.
-- Add 'document_approved' and 'document_rejected' to the allowed types.

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (type IN (
    'info',
    'success',
    'warning',
    'error',
    'alert',
    'message',
    'reminder',
    'system',
    'enrollment',
    'payment',
    'document',
    'document_approved',
    'document_rejected',
    'document_uploaded',
    'application',
    'onboarding',
    'competency',
    'ojt',
    'checkpoint',
    'certificate',
    'announcement'
  ));

-- Now approve Jordan White's pending documents
UPDATE public.documents
SET status = 'approved', reviewed_at = NOW()
WHERE user_id = 'b35f3289-614b-4c6e-b029-73617fc46655'
  AND status = 'pending_review';
