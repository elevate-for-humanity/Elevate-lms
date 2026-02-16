-- Community Hub Full Features Migration
-- Events, Groups, Direct Messaging, Notifications, Activity Feed

-- ============================================
-- COMMUNITY EVENTS
-- ============================================

CREATE TABLE IF NOT EXISTS community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL, -- workshop, webinar, networking, qa, panel, meetup
  
  -- Scheduling
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- iCal RRULE format
  
  -- Location
  location_type VARCHAR(20) DEFAULT 'online', -- online, in_person, hybrid
  location_url TEXT, -- Zoom/Meet link for online
  location_address TEXT, -- Physical address for in_person
  
  -- Media
  image_url TEXT,
  
  -- Capacity
  max_attendees INTEGER,
  
  -- Organizer
  organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'upcoming', -- draft, upcoming, live, completed, cancelled
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event RSVPs/Registrations
CREATE TABLE IF NOT EXISTS community_event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'registered', -- registered, attended, cancelled, no_show
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  attended_at TIMESTAMPTZ,
  UNIQUE(event_id, user_id)
);

-- ============================================
-- COMMUNITY GROUPS
-- ============================================

CREATE TABLE IF NOT EXISTS community_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  
  -- Settings
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  
  -- Media
  image_url TEXT,
  cover_image_url TEXT,
  
  -- Category
  category VARCHAR(100), -- healthcare, trades, beauty, technology, study, alumni, etc.
  
  -- Owner
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Stats (denormalized for performance)
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Memberships
CREATE TABLE IF NOT EXISTS community_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- owner, admin, moderator, member
  status VARCHAR(20) DEFAULT 'active', -- pending, active, banned
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Group Posts
CREATE TABLE IF NOT EXISTS community_group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  title VARCHAR(255),
  content TEXT NOT NULL,
  
  -- Media
  image_urls TEXT[], -- Array of image URLs
  
  -- Engagement (denormalized)
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Status
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Post Comments
CREATE TABLE IF NOT EXISTS community_group_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_group_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES community_group_post_comments(id) ON DELETE CASCADE, -- For nested replies
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DIRECT MESSAGING
-- ============================================

-- Conversations (supports 1:1 and group chats)
CREATE TABLE IF NOT EXISTS dm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255), -- NULL for 1:1, set for group chats
  is_group BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation Participants
CREATE TABLE IF NOT EXISTS dm_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL,
  
  -- Attachments
  attachment_url TEXT,
  attachment_type VARCHAR(50), -- image, file, link
  
  -- Status
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification Type
  type VARCHAR(50) NOT NULL, -- message, event_reminder, group_invite, mention, like, comment, follow, system
  
  -- Content
  title VARCHAR(255) NOT NULL,
  body TEXT,
  
  -- Action
  action_url TEXT, -- Where to navigate when clicked
  
  -- Related entities
  related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  related_entity_type VARCHAR(50), -- event, group, post, message, etc.
  related_entity_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACTIVITY FEED
-- ============================================

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Action
  action_type VARCHAR(50) NOT NULL, -- joined, completed_course, earned_badge, posted, commented, joined_group, rsvp_event, etc.
  
  -- Target
  target_type VARCHAR(50), -- course, badge, group, event, post, user
  target_id UUID,
  target_name VARCHAR(255), -- Denormalized for display
  
  -- Visibility
  is_public BOOLEAN DEFAULT true,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB, -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER PROFILES EXTENSION
-- ============================================

-- Add missing columns to profiles if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'headline') THEN
    ALTER TABLE profiles ADD COLUMN headline VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
    ALTER TABLE profiles ADD COLUMN location VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website') THEN
    ALTER TABLE profiles ADD COLUMN website TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'linkedin_url') THEN
    ALTER TABLE profiles ADD COLUMN linkedin_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'skills') THEN
    ALTER TABLE profiles ADD COLUMN skills TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'interests') THEN
    ALTER TABLE profiles ADD COLUMN interests TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_public') THEN
    ALTER TABLE profiles ADD COLUMN is_public BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'cover_image_url') THEN
    ALTER TABLE profiles ADD COLUMN cover_image_url TEXT;
  END IF;
END $$;

-- ============================================
-- MARKETPLACE PRODUCTS
-- ============================================

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Product Info
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2), -- For showing discounts
  
  -- Category
  category VARCHAR(100) NOT NULL, -- courses, tools, books, templates, equipment, services
  subcategory VARCHAR(100),
  
  -- Media
  image_url TEXT,
  gallery_urls TEXT[],
  
  -- Details
  features TEXT[],
  
  -- Digital vs Physical
  is_digital BOOLEAN DEFAULT true,
  download_url TEXT, -- For digital products
  
  -- Stats
  sales_count INTEGER DEFAULT 0,
  rating_average DECIMAL(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- draft, active, sold_out, archived
  is_featured BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Reviews
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, reviewer_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_community_events_start_date ON community_events(start_date);
CREATE INDEX IF NOT EXISTS idx_community_events_status ON community_events(status);
CREATE INDEX IF NOT EXISTS idx_community_events_organizer ON community_events(organizer_id);

CREATE INDEX IF NOT EXISTS idx_community_groups_category ON community_groups(category);
CREATE INDEX IF NOT EXISTS idx_community_groups_owner ON community_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_community_group_members_user ON community_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_group_posts_group ON community_group_posts(group_id);

CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation ON dm_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_sender ON dm_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_participants_user ON dm_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_activity_feed_actor ON activity_feed(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller ON marketplace_listings(seller_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_group_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;

-- Events: Public events visible to all, private to members
CREATE POLICY "Public events visible" ON community_events FOR SELECT USING (is_public = true OR organizer_id = auth.uid());
CREATE POLICY "Organizers manage events" ON community_events FOR ALL USING (organizer_id = auth.uid());
CREATE POLICY "Users can RSVP" ON community_event_rsvps FOR ALL USING (user_id = auth.uid());

-- Groups: Public groups visible, private to members
CREATE POLICY "Public groups visible" ON community_groups FOR SELECT USING (is_public = true OR owner_id = auth.uid());
CREATE POLICY "Owners manage groups" ON community_groups FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Members see memberships" ON community_group_members FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM community_groups WHERE id = group_id AND is_public = true));
CREATE POLICY "Users manage own membership" ON community_group_members FOR ALL USING (user_id = auth.uid());

-- Group Posts: Visible to group members
CREATE POLICY "Group posts visible to members" ON community_group_posts FOR SELECT USING (
  EXISTS (SELECT 1 FROM community_group_members WHERE group_id = community_group_posts.group_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM community_groups WHERE id = community_group_posts.group_id AND is_public = true)
);
CREATE POLICY "Authors manage posts" ON community_group_posts FOR ALL USING (author_id = auth.uid());

-- Comments
CREATE POLICY "Comments visible with posts" ON community_group_post_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM community_group_posts WHERE id = post_id)
);
CREATE POLICY "Authors manage comments" ON community_group_post_comments FOR ALL USING (author_id = auth.uid());

-- DMs: Only participants can see
CREATE POLICY "Participants see conversations" ON dm_conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM dm_participants WHERE conversation_id = id AND user_id = auth.uid())
);
CREATE POLICY "Participants see participants" ON dm_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM dm_participants dp WHERE dp.conversation_id = conversation_id AND dp.user_id = auth.uid())
);
CREATE POLICY "Users manage own participation" ON dm_participants FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Participants see messages" ON dm_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM dm_participants WHERE conversation_id = dm_messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Senders manage messages" ON dm_messages FOR ALL USING (sender_id = auth.uid());

-- Notifications: Only own
CREATE POLICY "Own notifications" ON notifications FOR ALL USING (user_id = auth.uid());

-- Activity Feed: Public activities visible
CREATE POLICY "Public activities" ON activity_feed FOR SELECT USING (is_public = true OR actor_id = auth.uid());
CREATE POLICY "Own activities" ON activity_feed FOR INSERT WITH CHECK (actor_id = auth.uid());

-- Marketplace: Public listings visible
CREATE POLICY "Active listings visible" ON marketplace_listings FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "Sellers manage listings" ON marketplace_listings FOR ALL USING (seller_id = auth.uid());
CREATE POLICY "Reviews visible" ON marketplace_reviews FOR SELECT USING (true);
CREATE POLICY "Reviewers manage reviews" ON marketplace_reviews FOR ALL USING (reviewer_id = auth.uid());

-- ============================================
-- SEED DATA FOR EVENTS
-- ============================================

INSERT INTO community_events (title, description, event_type, start_date, end_date, location_type, location_url, max_attendees, status, is_featured, is_public) VALUES
  ('Career Development Workshop', 'Learn strategies for advancing your career in healthcare, skilled trades, and more.', 'workshop', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '2 hours', 'online', 'https://zoom.us/j/example', 50, 'upcoming', true, true),
  ('Monthly Networking Mixer', 'Connect with fellow members, mentors, and industry professionals in a casual setting.', 'networking', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '3 hours', 'hybrid', 'https://zoom.us/j/example', 120, 'upcoming', true, true),
  ('Resume Review Session', 'Get personalized feedback on your resume from career coaches and HR professionals.', 'workshop', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '1 hour', 'online', 'https://zoom.us/j/example', 30, 'upcoming', false, true),
  ('Industry Expert Q&A: Healthcare', 'Ask questions and get advice from experienced healthcare professionals.', 'qa', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days' + INTERVAL '1 hour', 'online', 'https://zoom.us/j/example', 100, 'upcoming', false, true),
  ('Job Search Strategies Webinar', 'Learn effective techniques for finding and landing your dream job.', 'webinar', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '1 hour', 'online', 'https://zoom.us/j/example', 200, 'upcoming', true, true),
  ('Success Stories: Graduate Panel', 'Hear from program graduates about their journey and career success.', 'panel', NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days' + INTERVAL '2 hours', 'online', 'https://zoom.us/j/example', 150, 'upcoming', false, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA FOR GROUPS
-- ============================================

INSERT INTO community_groups (name, slug, description, category, is_public, is_featured, member_count) VALUES
  ('Healthcare Career Network', 'healthcare-career-network', 'Connect with healthcare professionals and students pursuing medical careers. Share resources, job opportunities, and support each other.', 'healthcare', true, true, 234),
  ('Skilled Trades Alliance', 'skilled-trades-alliance', 'HVAC, electrical, plumbing, and construction professionals and apprentices. Discuss techniques, certifications, and career paths.', 'trades', true, true, 189),
  ('Barber & Cosmetology Students', 'barber-cosmetology-students', 'Study tips, exam prep, and networking for beauty industry students. Share your work and get feedback.', 'beauty', true, true, 156),
  ('WIOA Funding Recipients', 'wioa-funding-recipients', 'Support group for students receiving workforce development funding. Navigate the process together.', 'financial-aid', false, false, 98),
  ('Tech Career Changers', 'tech-career-changers', 'For those transitioning into technology careers. Share experiences, resources, and encouragement.', 'technology', true, false, 145),
  ('Alumni Success Network', 'alumni-success-network', 'Elevate program graduates sharing their career journeys and helping current students.', 'alumni', true, true, 312)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- DIRECT MESSAGING
-- ============================================

CREATE TABLE IF NOT EXISTS direct_message_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1_id, participant_2_id)
);

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES direct_message_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for direct messaging
CREATE INDEX IF NOT EXISTS idx_dm_conversations_participant_1 ON direct_message_conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_participant_2 ON direct_message_conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation ON direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_sender ON direct_messages(sender_id);

-- RLS for direct messaging
ALTER TABLE direct_message_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations" ON direct_message_conversations
  FOR SELECT USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can create conversations" ON direct_message_conversations
  FOR INSERT WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can view messages in their conversations" ON direct_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM direct_message_conversations 
      WHERE id = conversation_id 
      AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON direct_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM direct_message_conversations 
      WHERE id = conversation_id 
      AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update read status" ON direct_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM direct_message_conversations 
      WHERE id = conversation_id 
      AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
    )
  );
