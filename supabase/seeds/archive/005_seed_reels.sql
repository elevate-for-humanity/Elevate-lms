-- Production-ready reels seed data
-- Short-form video content for social media

-- Create reels table if it doesn't exist
CREATE TABLE IF NOT EXISTS reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reels_published ON reels(published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_views ON reels(views DESC);

-- Clear existing data
TRUNCATE reels CASCADE;

INSERT INTO reels (
  video_url,
  thumbnail_url,
  title,
  description,
  duration_seconds,
  likes,
  views,
  published,
  created_at
) VALUES
(
  '/videos/reels/barber-success.mp4',
  '/images/reels/barber-thumb.jpg',
  'From Unemployed to $50K: Marcus''s Story',
  'Watch how Marcus went from 18 months unemployed to a licensed barber earning $50,000/year. 100% free training. #SecondChances #CareerChange',
  45,
  1247,
  15823,
  true,
  NOW() - INTERVAL '7 days'
),
(
  '/videos/reels/cna-day-in-life.mp4',
  '/images/reels/cna-thumb.jpg',
  'Day in the Life: CNA Student',
  'Follow Sarah through a day of CNA training. Real skills. Real jobs. 100% free. #CNATraining #Healthcare',
  38,
  892,
  11456,
  true,
  NOW() - INTERVAL '5 days'
),
(
  '/videos/reels/hvac-hands-on.mp4',
  '/images/reels/hvac-thumb.jpg',
  'HVAC Training: Hands-On Learning',
  'See what HVAC training really looks like. $55K starting salary. No experience needed. #HVAC #SkilledTrades',
  42,
  1056,
  13789,
  true,
  NOW() - INTERVAL '3 days'
),
(
  '/videos/reels/wioa-explained.mp4',
  '/images/reels/wioa-thumb.jpg',
  'How to Get FREE Career Training',
  'WIOA pays for everything: tuition, books, even childcare. Here''s how to qualify. #FreeTraining #WIOA',
  35,
  2134,
  28945,
  true,
  NOW() - INTERVAL '2 days'
),
(
  '/videos/reels/graduation-day.mp4',
  '/images/reels/grad-thumb.jpg',
  'Graduation Day: 25 New Careers Begin',
  'Watch 25 students celebrate completing their training and starting new careers. You could be next. #Graduation #Success',
  50,
  3421,
  42156,
  true,
  NOW() - INTERVAL '1 day'
);
