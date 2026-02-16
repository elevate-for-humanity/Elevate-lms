-- =====================================================
-- EVENTS MANAGEMENT CORE
-- Migration: 20241118_events_management.sql
-- =====================================================

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50), -- webinar, info_session, workshop, graduation, job_fair
  location_type VARCHAR(50), -- in_person, virtual, hybrid
  location_address TEXT,
  virtual_link TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  capacity INTEGER,
  status VARCHAR(50) DEFAULT 'published', -- draft, published, cancelled, completed
  allow_waitlist BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Registrations Table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'registered', -- registered, waitlisted, cancelled, attended, no_show
  checked_in_at TIMESTAMPTZ,
  answers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_profile_id ON event_registrations(profile_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_email ON event_registrations(email);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Events
-- Anyone can view published events
CREATE POLICY "Anyone can view published events"
  ON events FOR SELECT
  USING (status = 'published');

-- Admin can manage all events
CREATE POLICY "Admin can manage events"
  ON events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'marketing_admin')
    )
  );

-- RLS Policies for Registrations
-- Users can view their own registrations
CREATE POLICY "Users can view own registrations"
  ON event_registrations FOR SELECT
  USING (
    profile_id = auth.uid()
    OR email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Anyone can register for events
CREATE POLICY "Anyone can register for events"
  ON event_registrations FOR INSERT
  WITH CHECK (true);

-- Admin can view all registrations
CREATE POLICY "Admin can view all registrations"
  ON event_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'marketing_admin')
    )
  );

-- Admin can manage all registrations
CREATE POLICY "Admin can manage registrations"
  ON event_registrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'marketing_admin')
    )
  );

-- Comments
COMMENT ON TABLE events IS 'Events for webinars, info sessions, workshops, graduations, job fairs';
COMMENT ON TABLE event_registrations IS 'Event registrations and attendance tracking';
