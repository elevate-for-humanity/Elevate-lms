-- Review helpful votes table.
-- One row per (review_id, user_id) pair — enforces one vote per user per review.
-- helpful_count on course_reviews is recalculated from this table on each vote.

CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id   uuid NOT NULL REFERENCES public.course_reviews(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS rhv_review_idx ON public.review_helpful_votes (review_id);
CREATE INDEX IF NOT EXISTS rhv_user_idx   ON public.review_helpful_votes (user_id);

COMMENT ON TABLE public.review_helpful_votes IS
  'Deduplication table for course review helpful votes. One row per user per review.';
