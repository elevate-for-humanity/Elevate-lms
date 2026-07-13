-- Social media auto-posting columns
-- Adds share_to_social + social_posted_at to blog_posts and reels
-- so the cron-social-media function can pick up new content automatically.

-- blog_posts
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS share_to_social boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS social_posted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_post_caption text DEFAULT NULL;

-- reels
ALTER TABLE public.reels
  ADD COLUMN IF NOT EXISTS share_to_social boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS social_posted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_post_caption text DEFAULT NULL;

-- Index for efficient scheduler queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_social
  ON public.blog_posts (share_to_social, social_posted_at, published_at)
  WHERE share_to_social = true AND social_posted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reels_social
  ON public.reels (share_to_social, social_posted_at, published)
  WHERE share_to_social = true AND social_posted_at IS NULL;
