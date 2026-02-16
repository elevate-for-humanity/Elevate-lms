-- Tenant RLS Policies
-- Enforce tenant isolation on all business tables

-- profiles (already has RLS, adding tenant policy)
CREATE POLICY "Users can only see profiles in their tenant"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- enrollments
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view enrollments in their tenant"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- programs
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view programs in their tenant"
  ON programs FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view courses in their tenant"
  ON courses FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- job_postings
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view job postings in their tenant"
  ON job_postings FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- employers
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view employers in their tenant"
  ON employers FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- program_holders
ALTER TABLE program_holders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view program holders in their tenant"
  ON program_holders FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Service role bypass (for admin operations)
CREATE POLICY "Service role can access all tenants"
  ON profiles FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role can access all enrollments"
  ON enrollments FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role can access all programs"
  ON programs FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role can access all courses"
  ON courses FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role can access all job_postings"
  ON job_postings FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role can access all employers"
  ON employers FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role can access all program_holders"
  ON program_holders FOR ALL
  TO service_role
  USING (true);
