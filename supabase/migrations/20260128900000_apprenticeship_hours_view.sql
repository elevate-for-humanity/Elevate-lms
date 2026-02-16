-- =====================================================
-- APPRENTICESHIP HOURS COMPATIBILITY VIEW
-- =====================================================
-- Canonical table: progress_entries
-- This VIEW provides backward compatibility for legacy API routes
-- that use different column names.
--
-- DEPLOYED: 2026-01-28
-- =====================================================

-- Drop existing objects for idempotency
DROP VIEW IF EXISTS apprenticeship_hours_summary;
DROP VIEW IF EXISTS apprenticeship_hours;
DROP FUNCTION IF EXISTS insert_apprenticeship_hours() CASCADE;
DROP FUNCTION IF EXISTS update_apprenticeship_hours() CASCADE;

-- Create compatibility view matching actual progress_entries schema
CREATE VIEW apprenticeship_hours AS
SELECT 
  pe.id,
  pe.apprentice_id AS student_id,
  pe.partner_id AS shop_id,
  pe.partner_id,
  pe.work_date AS date_worked,
  pe.work_date AS date,
  pe.week_ending,
  pe.hours_worked AS hours,
  pe.hours_worked,
  pe.program_id AS program_slug,
  pe.program_id,
  pe.tasks_completed AS category,
  pe.tasks_completed AS description,
  pe.notes,
  (pe.status = 'verified') AS approved,
  pe.verified_by AS approved_by,
  pe.verified_at AS approved_at,
  CASE WHEN pe.status = 'disputed' THEN pe.notes ELSE NULL END AS rejection_reason,
  pe.status,
  pe.submitted_by,
  pe.submitted_at,
  pe.created_at,
  pe.updated_at
FROM progress_entries pe;

-- INSERT trigger function
CREATE OR REPLACE FUNCTION insert_apprenticeship_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_partner_id UUID;
  v_program_id VARCHAR(100);
  v_status VARCHAR(20);
BEGIN
  v_program_id := UPPER(COALESCE(NEW.program_slug, NEW.program_id, 'APPRENTICESHIP'));
  v_partner_id := COALESCE(NEW.shop_id, NEW.partner_id, (SELECT id FROM partners LIMIT 1));
  
  IF NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason <> '' THEN
    v_status := 'disputed';
  ELSIF NEW.approved = true THEN
    v_status := 'verified';
  ELSE
    v_status := 'submitted';
  END IF;
  
  INSERT INTO progress_entries (
    apprentice_id, partner_id, program_id, work_date, week_ending, hours_worked,
    tasks_completed, notes, submitted_by, submitted_at,
    verified_by, verified_at, status, created_at, updated_at
  ) VALUES (
    NEW.student_id, 
    v_partner_id, 
    v_program_id,
    COALESCE(NEW.date_worked, NEW.date, CURRENT_DATE),
    COALESCE(NEW.week_ending, DATE_TRUNC('week', COALESCE(NEW.date_worked, NEW.date, CURRENT_DATE)) + INTERVAL '4 days'),
    COALESCE(NEW.hours, NEW.hours_worked, 0),
    COALESCE(NEW.category, NEW.description, ''),
    CASE WHEN v_status = 'disputed' THEN NEW.rejection_reason ELSE NEW.notes END,
    COALESCE(NEW.submitted_by, NEW.student_id),
    COALESCE(NEW.submitted_at, NOW()),
    CASE WHEN v_status = 'verified' THEN COALESCE(NEW.approved_by, auth.uid()) ELSE NULL END,
    CASE WHEN v_status = 'verified' THEN COALESCE(NEW.approved_at, NOW()) ELSE NULL END,
    v_status, 
    NOW(), 
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- UPDATE trigger function
CREATE OR REPLACE FUNCTION update_apprenticeship_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_status VARCHAR(20);
BEGIN
  IF NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason <> '' THEN
    v_status := 'disputed';
  ELSIF NEW.approved = true THEN
    v_status := 'verified';
  ELSIF OLD.approved = true AND NEW.approved = false THEN
    v_status := 'submitted';
  ELSE
    v_status := COALESCE(NEW.status, OLD.status, 'submitted');
  END IF;
  
  UPDATE progress_entries SET
    hours_worked = COALESCE(NEW.hours, NEW.hours_worked, OLD.hours_worked),
    tasks_completed = COALESCE(NEW.category, NEW.description, OLD.tasks_completed),
    notes = CASE WHEN v_status = 'disputed' THEN COALESCE(NEW.rejection_reason, NEW.notes) ELSE COALESCE(NEW.notes, OLD.notes) END,
    status = v_status,
    verified_by = CASE WHEN v_status = 'verified' THEN COALESCE(NEW.approved_by, auth.uid(), OLD.verified_by) ELSE NULL END,
    verified_at = CASE WHEN v_status = 'verified' THEN COALESCE(NEW.approved_at, NOW()) ELSE NULL END,
    updated_at = NOW()
  WHERE id = OLD.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER apprenticeship_hours_insert_trigger
  INSTEAD OF INSERT ON apprenticeship_hours
  FOR EACH ROW EXECUTE FUNCTION insert_apprenticeship_hours();

CREATE TRIGGER apprenticeship_hours_update_trigger
  INSTEAD OF UPDATE ON apprenticeship_hours
  FOR EACH ROW EXECUTE FUNCTION update_apprenticeship_hours();

-- Summary view
CREATE VIEW apprenticeship_hours_summary AS
SELECT 
  apprentice_id AS student_id,
  program_id AS program_slug,
  DATE_TRUNC('week', week_ending) AS week_start,
  SUM(hours_worked) AS total_hours,
  SUM(CASE WHEN status = 'verified' THEN hours_worked ELSE 0 END) AS approved_hours,
  SUM(CASE WHEN status IN ('submitted', 'draft') THEN hours_worked ELSE 0 END) AS pending_hours,
  SUM(CASE WHEN status = 'disputed' THEN hours_worked ELSE 0 END) AS disputed_hours,
  COUNT(*) AS entry_count
FROM progress_entries
GROUP BY apprentice_id, program_id, DATE_TRUNC('week', week_ending);
