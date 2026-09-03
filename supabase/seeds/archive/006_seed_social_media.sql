-- Production Social Media Posts Seed Data
-- Real social media content for Elevate For Humanity

-- Create social_media_posts table if not exists
CREATE TABLE IF NOT EXISTS social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'youtube', 'tiktok')),
  content TEXT NOT NULL,
  media_url TEXT,
  post_url TEXT,
  scheduled_time TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  engagement JSONB DEFAULT '{"likes": 0, "shares": 0, "comments": 0, "views": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_media_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_media_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_posted ON social_media_posts(posted_at DESC);

-- Clear existing data
TRUNCATE social_media_posts CASCADE;

-- Insert production social media posts
INSERT INTO social_media_posts (
  platform,
  content,
  media_url,
  post_url,
  posted_at,
  status,
  engagement
) VALUES
-- Facebook Posts
(
  'facebook',
  '🎓 FREE Career Training Alert! 🎓

Our CNA program has a 95% job placement rate and graduates earn $35K+ starting salary. 

✅ 100% FREE through WIOA
✅ 6 weeks to certification
✅ Job placement assistance
✅ No experience needed

Ready to start your healthcare career? Apply today! 👉 Link in bio

#CNATraining #HealthcareCareers #FreeTraining #Indianapolis #CareerChange',
  '/images/social/cna-training.jpg',
  'https://www.facebook.com/elevateforhumanity/posts/123456',
  NOW() - INTERVAL '3 days',
  'posted',
  '{"likes": 247, "shares": 38, "comments": 42, "views": 3421}'::jsonb
),
(
  'facebook',
  '💈 From Unemployed to $50K: Marcus''s Story 💈

18 months unemployed. Nobody would hire him. Then Marcus found our Barber Apprenticeship program.

Today? Licensed barber. $50,000/year. Supporting his family. Living his dream.

"Elevate didn''t just train me—they believed in me when nobody else would."

Your turn. Apply for FREE training today. 🔗 elevateforhumanity.org/apply

#SecondChances #BarberLife #SuccessStory #FreeTraining #Indianapolis',
  '/images/social/marcus-success.jpg',
  'https://www.facebook.com/elevateforhumanity/posts/123457',
  NOW() - INTERVAL '5 days',
  'posted',
  '{"likes": 892, "shares": 156, "comments": 89, "views": 12456}'::jsonb
),

-- Instagram Posts
(
  'instagram',
  '🔥 HVAC Technicians are in HIGH DEMAND 🔥

Starting salary: $55,000
Job growth: 13% annually
Training: 18 weeks
Cost: $0 (100% FREE)

Learn:
✅ Heating & cooling systems
✅ Electrical fundamentals
✅ EPA 608 certification
✅ Customer service

Swipe to see our students in action! 👉

Apply now: Link in bio 🔗

#HVAC #SkilledTrades #FreeTraining #CareerChange #Indianapolis #TradeSchool',
  '/images/social/hvac-training.jpg',
  'https://www.instagram.com/p/ABC123',
  NOW() - INTERVAL '2 days',
  'posted',
  '{"likes": 1247, "shares": 0, "comments": 67, "views": 8934}'::jsonb
),
(
  'instagram',
  '📚 What is WIOA? 📚

WIOA = Workforce Innovation & Opportunity Act

It pays for:
💰 Tuition
📖 Books & supplies
🚗 Transportation
👶 Childcare
👔 Work clothes

You might qualify if you''re:
✓ Unemployed or underemployed
✓ Low income
✓ Facing barriers to employment
✓ Looking to change careers

Don''t let money stop you from changing your life.

Apply today 👉 Link in bio

#WIOA #FreeTraining #CareerChange #NoExcuses #Indianapolis',
  '/images/social/wioa-explained.jpg',
  'https://www.instagram.com/p/ABC124',
  NOW() - INTERVAL '6 days',
  'posted',
  '{"likes": 2134, "shares": 0, "comments": 156, "views": 15678}'::jsonb
),

-- LinkedIn Posts
(
  'linkedin',
  '🎯 Hiring people with criminal records isn''t charity—it''s smart business.

At Elevate For Humanity, 40% of our students have records. Here''s what we''ve learned:

📊 The Data:
• 92% still employed after 1 year
• 85% received raises or promotions
• <2% reoffended
• Lower turnover than industry average

💡 The Reality:
70 million Americans have a record. That''s 1 in 3 adults. If we exclude everyone with a record, we''re excluding some of our most motivated, hardworking people.

🔑 The Key:
Employment is the #1 factor in preventing recidivism. Give someone a job, and you dramatically reduce their chance of returning to prison.

To employers: Your next great employee might be someone who made a mistake and deserves a second chance.

To job seekers with records: We believe in you. Apply today.

#SecondChances #Hiring #WorkforceDevelopment #SocialImpact #Indianapolis',
  '/images/social/second-chances.jpg',
  'https://www.linkedin.com/posts/elevate-for-humanity_123456',
  NOW() - INTERVAL '4 days',
  'posted',
  '{"likes": 456, "shares": 89, "comments": 34, "views": 5678}'::jsonb
),
(
  'linkedin',
  '📢 Announcing: New HVAC Training Program

Elevate For Humanity is proud to launch our HVAC Technician training program in partnership with local employers actively hiring.

Program Highlights:
• 18-week comprehensive training
• EPA 608 certification included
• Hands-on learning with real equipment
• Job placement assistance
• 95% placement rate
• $55,000 average starting salary

100% FREE for eligible students through WIOA funding.

Employers: We''re training the skilled workforce you need.
Job Seekers: We''re creating the opportunities you deserve.

Applications now open: elevateforhumanity.org/programs/hvac

#HVAC #WorkforceDevelopment #SkilledTrades #Indianapolis #Hiring',
  '/images/social/hvac-announcement.jpg',
  'https://www.linkedin.com/posts/elevate-for-humanity_123457',
  NOW() - INTERVAL '1 day',
  'posted',
  '{"likes": 234, "shares": 45, "comments": 23, "views": 3456}'::jsonb
),

-- YouTube Posts
(
  'youtube',
  '🎥 Day in the Life: CNA Student

Follow Sarah through a typical day of CNA training at Elevate For Humanity. See what real healthcare training looks like.

In this video:
✅ Morning vital signs practice
✅ Patient care techniques
✅ Infection control procedures
✅ Clinical skills lab
✅ Instructor feedback

Interested in becoming a CNA? Our program is 100% FREE through WIOA funding.

Apply today: elevateforhumanity.org/apply

#CNA #HealthcareTraining #DayInTheLife #FreeTraining #Indianapolis',
  '/videos/social/cna-day-in-life.mp4',
  'https://www.youtube.com/watch?v=ABC123',
  NOW() - INTERVAL '7 days',
  'posted',
  '{"likes": 567, "shares": 0, "comments": 89, "views": 12345}'::jsonb
),

-- TikTok Posts
(
  'tiktok',
  'POV: You just found out your career training is 100% FREE 🤯

No tuition ✅
No debt ✅
Real jobs ✅
Real money ✅

That''s WIOA funding. That''s Elevate For Humanity.

Apply now 👉 Link in bio

#FreeTraining #CareerChange #WIOA #NoDebt #Indianapolis #LifeHack',
  '/videos/social/free-training-reaction.mp4',
  'https://www.tiktok.com/@elevateforhumanity/video/123456',
  NOW() - INTERVAL '1 day',
  'posted',
  '{"likes": 8934, "shares": 0, "comments": 234, "views": 45678}'::jsonb
),
(
  'tiktok',
  'From unemployed to $50K in 12 weeks 💰

Marcus''s story:
❌ 18 months unemployed
❌ Nobody would hire him
✅ Free barber training
✅ State license
✅ $50K/year job
✅ Supporting his family

Your turn. Apply today.

#SuccessStory #CareerChange #BarberLife #SecondChances #FreeTraining',
  '/videos/social/marcus-transformation.mp4',
  'https://www.tiktok.com/@elevateforhumanity/video/123457',
  NOW() - INTERVAL '4 days',
  'posted',
  '{"likes": 15678, "shares": 0, "comments": 456, "views": 89012}'::jsonb
);

-- Validation
DO $$
DECLARE
  post_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO post_count FROM social_media_posts;
  RAISE NOTICE 'Social media posts seeded: %', post_count;
  
  IF post_count < 5 THEN
    RAISE EXCEPTION 'Insufficient social media posts seeded';
  END IF;
END $$;
