-- Customer Service System
-- Tables for customer service protocols and ticket management

-- Customer Service Protocols Table
CREATE TABLE IF NOT EXISTS customer_service_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  dos TEXT[],
  donts TEXT[],
  examples JSONB DEFAULT '[]'::jsonb,
  escalation_rules TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Tickets Table
CREATE TABLE IF NOT EXISTS service_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  issue TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id),
  resolution TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_protocols_category ON customer_service_protocols(category);
CREATE INDEX IF NOT EXISTS idx_service_tickets_student ON service_tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_assigned ON service_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_service_tickets_status ON service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_service_tickets_priority ON service_tickets(priority);

-- RLS
ALTER TABLE customer_service_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY;

-- Staff can view protocols
CREATE POLICY "Staff can view protocols"
  ON customer_service_protocols FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'advisor')
    )
  );

-- Admin can manage protocols
CREATE POLICY "Admin can manage protocols"
  ON customer_service_protocols FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Staff can view tickets
CREATE POLICY "Staff can view tickets"
  ON service_tickets FOR SELECT
  USING (
    student_id = auth.uid()
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'advisor')
    )
  );

-- Staff can create tickets
CREATE POLICY "Staff can create tickets"
  ON service_tickets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'advisor')
    )
  );

-- Staff can update assigned tickets
CREATE POLICY "Staff can update tickets"
  ON service_tickets FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

COMMENT ON TABLE customer_service_protocols IS 'Customer service guidelines and protocols';
COMMENT ON TABLE service_tickets IS 'Customer service tickets';
