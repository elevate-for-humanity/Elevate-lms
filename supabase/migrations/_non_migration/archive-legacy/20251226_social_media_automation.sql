-- Social Media Automation for Monetization
-- 3x daily posting to LinkedIn, Facebook, YouTube
-- Blog integration and analytics tracking

-- Social Media Accounts Table
CREATE TABLE IF NOT EXISTS social_media_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'facebook', 'youtube', 'instagram', 'twitter')),
  account_name TEXT,
  account_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_monetized BOOLEAN DEFAULT false,
  followers_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform)
);

-- Social Media Posts Table
CREATE TABLE IF NOT EXISTS social_media_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL,
  post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video', 'link', 'carousel')),
  title TEXT,
  content TEXT NOT NULL,
  media_url TEXT,
  thumbnail_url TEXT,
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  posted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'posting', 'posted', 'failed', 'cancelled')),
  platform_post_id TEXT, -- ID from the platform after posting
  error_message TEXT,
  engagement JSONB DEFAULT '{"likes": 0, "shares": 0, "comments": 0, "views": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Media Analytics Table
CREATE TABLE IF NOT EXISTS social_media_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL,
  date DATE NOT NULL,
  followers_count INTEGER DEFAULT 0,
  followers_gained INTEGER DEFAULT 0,
  followers_lost INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, date)
);

-- Social Media Content Queue Table
CREATE TABLE IF NOT EXISTS social_media_content_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL CHECK (content_type IN ('blog', 'program', 'success_story', 'tip', 'announcement')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  source_id UUID, -- blog_post_id, program_id, etc.
  priority INTEGER DEFAULT 5, -- 1-10, higher = more important
  used_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_media_posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_media_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_blog ON social_media_posts(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_social_analytics_platform_date ON social_media_analytics(platform, date);
CREATE INDEX IF NOT EXISTS idx_content_queue_active ON social_media_content_queue(is_active, priority DESC);

-- Function: Auto-post blog to social media when published
CREATE OR REPLACE FUNCTION auto_post_blog_to_social()
RETURNS TRIGGER AS $$
DECLARE
  post_time TIMESTAMPTZ;
  platform_name TEXT;
BEGIN
  -- Only trigger when status changes to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    
    -- Add to content queue
    INSERT INTO social_media_content_queue (
      content_type,
      title,
      content,
      media_url,
      source_id,
      priority
    ) VALUES (
      'blog',
      NEW.title,
      COALESCE(NEW.excerpt, LEFT(NEW.content, 280)),
      NEW.featured_image,
      NEW.id,
      8 -- High priority for new blog posts
    );
    
    -- Schedule posts for each active platform
    post_time := NOW() + INTERVAL '1 hour';
    
    FOR platform_name IN 
      SELECT platform FROM social_media_accounts WHERE is_active = true
    LOOP
      INSERT INTO social_media_posts (
        platform,
        post_type,
        title,
        content,
        media_url,
        blog_post_id,
        scheduled_for,
        status
      ) VALUES (
        platform_name,
        'link',
        NEW.title,
        COALESCE(NEW.excerpt, LEFT(NEW.content, 280)) || ' Read more: https://elevateforhumanity.org/blog/' || NEW.slug,
        NEW.featured_image,
        NEW.id,
        post_time,
        'scheduled'
      );
      
      -- Stagger posts by 30 minutes per platform
      post_time := post_time + INTERVAL '30 minutes';
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for blog publishing
DROP TRIGGER IF EXISTS blog_publish_social_trigger ON blog_posts;
CREATE TRIGGER blog_publish_social_trigger
  AFTER INSERT OR UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_post_blog_to_social();

-- Function: Schedule 3x daily posts
CREATE OR REPLACE FUNCTION schedule_daily_social_posts(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(posts_scheduled INTEGER) AS $$
DECLARE
  morning_time TIMESTAMPTZ;
  afternoon_time TIMESTAMPTZ;
  evening_time TIMESTAMPTZ;
  platform_rec RECORD;
  content_rec RECORD;
  posts_count INTEGER := 0;
BEGIN
  -- Set posting times (EST)
  morning_time := target_date + INTERVAL '9 hours';
  afternoon_time := target_date + INTERVAL '13 hours';
  evening_time := target_date + INTERVAL '18 hours';
  
  -- For each active platform
  FOR platform_rec IN 
    SELECT platform FROM social_media_accounts WHERE is_active = true
  LOOP
    
    -- Morning post
    SELECT * INTO content_rec
    FROM social_media_content_queue
    WHERE is_active = true
    ORDER BY priority DESC, used_count ASC, RANDOM()
    LIMIT 1;
    
    IF FOUND THEN
      INSERT INTO social_media_posts (
        platform,
        post_type,
        title,
        content,
        media_url,
        scheduled_for,
        status
      ) VALUES (
        platform_rec.platform,
        CASE WHEN content_rec.media_url IS NOT NULL THEN 'image' ELSE 'text' END,
        content_rec.title,
        content_rec.content,
        content_rec.media_url,
        morning_time,
        'scheduled'
      );
      
      UPDATE social_media_content_queue
      SET used_count = used_count + 1, last_used_at = NOW()
      WHERE id = content_rec.id;
      
      posts_count := posts_count + 1;
    END IF;
    
    -- Afternoon post
    SELECT * INTO content_rec
    FROM social_media_content_queue
    WHERE is_active = true AND id != content_rec.id
    ORDER BY priority DESC, used_count ASC, RANDOM()
    LIMIT 1;
    
    IF FOUND THEN
      INSERT INTO social_media_posts (
        platform,
        post_type,
        title,
        content,
        media_url,
        scheduled_for,
        status
      ) VALUES (
        platform_rec.platform,
        CASE WHEN content_rec.media_url IS NOT NULL THEN 'image' ELSE 'text' END,
        content_rec.title,
        content_rec.content,
        content_rec.media_url,
        afternoon_time,
        'scheduled'
      );
      
      UPDATE social_media_content_queue
      SET used_count = used_count + 1, last_used_at = NOW()
      WHERE id = content_rec.id;
      
      posts_count := posts_count + 1;
    END IF;
    
    -- Evening post
    SELECT * INTO content_rec
    FROM social_media_content_queue
    WHERE is_active = true AND id != content_rec.id
    ORDER BY priority DESC, used_count ASC, RANDOM()
    LIMIT 1;
    
    IF FOUND THEN
      INSERT INTO social_media_posts (
        platform,
        post_type,
        title,
        content,
        media_url,
        scheduled_for,
        status
      ) VALUES (
        platform_rec.platform,
        CASE WHEN content_rec.media_url IS NOT NULL THEN 'image' ELSE 'text' END,
        content_rec.title,
        content_rec.content,
        content_rec.media_url,
        evening_time,
        'scheduled'
      );
      
      UPDATE social_media_content_queue
      SET used_count = used_count + 1, last_used_at = NOW()
      WHERE id = content_rec.id;
      
      posts_count := posts_count + 1;
    END IF;
    
  END LOOP;
  
  RETURN QUERY SELECT posts_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Update analytics
CREATE OR REPLACE FUNCTION update_social_analytics(
  p_platform TEXT,
  p_date DATE,
  p_followers INTEGER DEFAULT NULL,
  p_posts INTEGER DEFAULT NULL,
  p_likes INTEGER DEFAULT NULL,
  p_shares INTEGER DEFAULT NULL,
  p_comments INTEGER DEFAULT NULL,
  p_reach INTEGER DEFAULT NULL,
  p_impressions INTEGER DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO social_media_analytics (
    platform,
    date,
    followers_count,
    posts_count,
    likes_count,
    shares_count,
    comments_count,
    reach,
    impressions
  ) VALUES (
    p_platform,
    p_date,
    COALESCE(p_followers, 0),
    COALESCE(p_posts, 0),
    COALESCE(p_likes, 0),
    COALESCE(p_shares, 0),
    COALESCE(p_comments, 0),
    COALESCE(p_reach, 0),
    COALESCE(p_impressions, 0)
  )
  ON CONFLICT (platform, date) DO UPDATE SET
    followers_count = COALESCE(p_followers, social_media_analytics.followers_count),
    posts_count = COALESCE(p_posts, social_media_analytics.posts_count),
    likes_count = COALESCE(p_likes, social_media_analytics.likes_count),
    shares_count = COALESCE(p_shares, social_media_analytics.shares_count),
    comments_count = COALESCE(p_comments, social_media_analytics.comments_count),
    reach = COALESCE(p_reach, social_media_analytics.reach),
    impressions = COALESCE(p_impressions, social_media_analytics.impressions);
END;
$$ LANGUAGE plpgsql;

-- Seed initial social media accounts
INSERT INTO social_media_accounts (platform, account_name, account_url, is_active) VALUES
  ('linkedin', 'Elevate for Humanity', 'https://linkedin.com/company/elevateforhumanity', true),
  ('facebook', 'Elevate for Humanity', 'https://facebook.com/elevateforhumanity', true),
  ('youtube', 'Elevate for Humanity', 'https://youtube.com/@elevateforhumanity', true)
ON CONFLICT (platform) DO NOTHING;

-- Seed initial content queue with sample posts
INSERT INTO social_media_content_queue (content_type, title, content, priority) VALUES
  ('tip', 'Career Success Tip', 'Start your career transformation today. Our programs are designed to get you job-ready fast. #CareerDevelopment #Training', 7),
  ('announcement', 'Free Training Available', 'Did you know? Many of our programs are available with WIOA funding. Start learning at no cost to you. Apply today! #FreeTraining #WIOA', 8),
  ('tip', 'Skills That Matter', 'Employers are looking for skilled workers. Get certified in high-demand fields like healthcare, trades, and technology. #SkillsDevelopment', 6),
  ('success_story', 'Student Success', 'Our graduates are thriving in their new careers. Join them and transform your future. #SuccessStory #CareerChange', 7),
  ('announcement', 'Now Enrolling', 'New cohorts starting soon! Explore our programs and find the right path for you. #Enrollment #Training', 8)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON social_media_accounts TO authenticated;
GRANT ALL ON social_media_posts TO authenticated;
GRANT ALL ON social_media_analytics TO authenticated;
GRANT ALL ON social_media_content_queue TO authenticated;

-- Comments
COMMENT ON TABLE social_media_accounts IS 'Social media platform accounts for automation';
COMMENT ON TABLE social_media_posts IS 'Scheduled and posted social media content';
COMMENT ON TABLE social_media_analytics IS 'Daily analytics for each platform';
COMMENT ON TABLE social_media_content_queue IS 'Content pool for automated posting';
COMMENT ON FUNCTION auto_post_blog_to_social() IS 'Automatically create social posts when blog is published';
COMMENT ON FUNCTION schedule_daily_social_posts(DATE) IS 'Schedule 3 posts per day per platform';
COMMENT ON FUNCTION update_social_analytics(TEXT, DATE, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) IS 'Update daily analytics for a platform';
