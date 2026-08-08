-- Complete the learner community engagement model.
-- Idempotent so it can safely run against databases where parts already exist.

CREATE TABLE IF NOT EXISTS community_post_likes (
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_comments_post_created
  ON community_post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_community_likes_user
  ON community_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created
  ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags
  ON community_posts USING gin(tags);

ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community likes readable" ON community_post_likes;
CREATE POLICY "Community likes readable"
  ON community_post_likes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Members can like" ON community_post_likes;
CREATE POLICY "Members can like"
  ON community_post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can unlike" ON community_post_likes;
CREATE POLICY "Members can unlike"
  ON community_post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Community comments readable" ON community_post_comments;
CREATE POLICY "Community comments readable"
  ON community_post_comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Members can comment" ON community_post_comments;
CREATE POLICY "Members can comment"
  ON community_post_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can edit own comments" ON community_post_comments;
CREATE POLICY "Members can edit own comments"
  ON community_post_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can delete own comments" ON community_post_comments;
CREATE POLICY "Members can delete own comments"
  ON community_post_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Let authenticated learners read the community. Keep posting restricted to the author.
DROP POLICY IF EXISTS "Public read" ON community_posts;
DROP POLICY IF EXISTS "Authenticated community read" ON community_posts;
CREATE POLICY "Authenticated community read"
  ON community_posts FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Auth insert" ON community_posts;
DROP POLICY IF EXISTS "Members can post" ON community_posts;
CREATE POLICY "Members can post"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own update" ON community_posts;
DROP POLICY IF EXISTS "Authors can update posts" ON community_posts;
CREATE POLICY "Authors can update posts"
  ON community_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authors can delete posts" ON community_posts;
CREATE POLICY "Authors can delete posts"
  ON community_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION refresh_community_post_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post_id uuid;
BEGIN
  target_post_id := COALESCE(NEW.post_id, OLD.post_id);

  UPDATE community_posts
  SET
    likes_count = (SELECT count(*) FROM community_post_likes WHERE post_id = target_post_id),
    comments_count = (SELECT count(*) FROM community_post_comments WHERE post_id = target_post_id),
    updated_at = now()
  WHERE id = target_post_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_post_like_count ON community_post_likes;
CREATE TRIGGER trg_refresh_post_like_count
AFTER INSERT OR DELETE ON community_post_likes
FOR EACH ROW EXECUTE FUNCTION refresh_community_post_counts();

DROP TRIGGER IF EXISTS trg_refresh_post_comment_count ON community_post_comments;
CREATE TRIGGER trg_refresh_post_comment_count
AFTER INSERT OR DELETE ON community_post_comments
FOR EACH ROW EXECUTE FUNCTION refresh_community_post_counts();

-- Harden group membership. Existing rows are preserved; constraints are added only when safe.
ALTER TABLE study_group_members
  ADD COLUMN IF NOT EXISTS study_group_id uuid,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS joined_at timestamptz DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_study_group_members_unique
  ON study_group_members(study_group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user
  ON study_group_members(user_id);

ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON study_group_members;
DROP POLICY IF EXISTS "Members can view groups" ON study_group_members;
CREATE POLICY "Members can view groups"
  ON study_group_members FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Auth join" ON study_group_members;
DROP POLICY IF EXISTS "Members can join groups" ON study_group_members;
CREATE POLICY "Members can join groups"
  ON study_group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can leave groups" ON study_group_members;
CREATE POLICY "Members can leave groups"
  ON study_group_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
