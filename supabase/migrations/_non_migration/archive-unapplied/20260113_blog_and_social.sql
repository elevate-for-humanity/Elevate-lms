-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'News',
  image TEXT DEFAULT '/images/blog/default.jpg',
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT DEFAULT 'Elevate Team',
  reading_time INTEGER DEFAULT 5,
  views INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Posts Table (for scheduling)
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed', 'cancelled')),
  error_message TEXT,
  platform_post_ids JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- Blog posts: Public can read published, admins can manage all
CREATE POLICY "Public can read published blog posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can manage blog posts"
  ON blog_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Social posts: Only admins can manage
CREATE POLICY "Admins can manage social posts"
  ON social_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);

-- Grant permissions
GRANT SELECT ON blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON blog_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON social_posts TO authenticated;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert sample blog posts
INSERT INTO blog_posts (title, slug, excerpt, content, category, image, status, published_at, author_name) VALUES
(
  'From Unemployed to HVAC Technician: Marcus''s Journey',
  'marcus-hvac-journey',
  'After losing his job during the pandemic, Marcus enrolled in our HVAC program. Six months later, he''s earning $55,000/year with full benefits.',
  '## A New Beginning

Marcus Thompson was working in retail management when COVID-19 hit. After being laid off, he struggled to find work in his field. That''s when he discovered Elevate for Humanity''s HVAC program through Indiana Career Connect.

"I never thought about HVAC before, but the advisor showed me the job outlook and salary potential," Marcus recalls.

## The Training Experience

The 20-week program was fully funded through WIOA, covering:
- Tuition and fees
- Books and study materials
- Tools and equipment
- EPA certification exam

Marcus appreciated the hands-on approach. "We weren''t just reading textbooks. We were actually working on real HVAC systems from day one."

## The Results

Today, Marcus works for a leading Indianapolis HVAC company, earning $55,000 annually with full benefits and opportunities for advancement.

"I went from unemployed to making more than I ever did in retail, with a career that can''t be outsourced," he says.

## Your Turn

Ready to start your own success story? [Apply now](/apply) or call us at (317) 314-3757.',
  'Success Story',
  '/images/blog/hvac-success.jpg',
  'published',
  NOW() - INTERVAL '5 days',
  'Elevate Team'
),
(
  'New Partnership with Indiana Career Connect',
  'indiana-career-connect-partnership',
  'We''re excited to announce our expanded partnership with Indiana Career Connect, bringing more funding opportunities to students across Indianapolis.',
  '## Expanding Access to Free Training

Elevate for Humanity has formalized an expanded partnership with Indiana Career Connect, the state''s official workforce development portal.

## What This Means for You

This partnership makes it easier for Hoosiers to access free career training through WIOA funding:

- **Streamlined enrollment** - Complete your entire eligibility process online
- **Faster approvals** - Receive training vouchers in as little as 2 weeks
- **Co-location services** - Meet with WorkOne advisors and Elevate staff in one visit

## How to Get Started

1. Visit [Indiana Career Connect](https://indianacareerconnect.com)
2. Create your profile
3. Schedule an appointment with a WorkOne advisor
4. Get approved for WIOA funding
5. Enroll in your chosen program

## Questions?

Contact us at (317) 314-3757 or [apply online](/apply).',
  'News',
  '/images/blog/partnership.jpg',
  'published',
  NOW() - INTERVAL '10 days',
  'Elevate Team'
),
(
  'Understanding WIOA Funding: A Complete Guide',
  'wioa-funding-guide',
  'Learn how WIOA funding works, who qualifies, and how it can cover 100% of your training costs for in-demand careers.',
  '## What is WIOA?

The Workforce Innovation and Opportunity Act (WIOA) is the primary federal workforce development program, providing funding for job training and education.

## Who Qualifies?

Most adults qualify based on:
- **Income** - Below certain thresholds
- **Public assistance** - SNAP, TANF, SSI recipients
- **Veteran status** - All veterans qualify
- **Displacement** - Laid off or plant closure

## What Does WIOA Cover?

WIOA covers 100% of training costs including:
- Tuition and fees
- Books and supplies
- Tools and equipment
- Certification exams
- Support services (transportation, childcare)

## How to Apply

1. Visit Indiana Career Connect
2. Create your profile
3. Schedule an appointment with a WorkOne career advisor
4. Bring required documents
5. Get approved and start training

The entire process typically takes 2-3 weeks from initial appointment to program start.

## Ready to Get Started?

[Check your eligibility](/wioa-eligibility) or [apply now](/apply).',
  'Resource',
  '/images/blog/wioa-guide.jpg',
  'published',
  NOW() - INTERVAL '15 days',
  'Elevate Team'
)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE blog_posts IS 'Blog posts for the marketing site';
COMMENT ON TABLE social_posts IS 'Scheduled social media posts for automation';
