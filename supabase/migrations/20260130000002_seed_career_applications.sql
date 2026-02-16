-- Seed career_applications with test data for admin dashboard verification
-- Uses @example.com emails (reserved per RFC 2606)

DO $$
BEGIN
  -- Skip if there are already applications with non-example.com emails
  IF EXISTS (
    SELECT 1 FROM career_applications 
    WHERE email NOT LIKE '%@example.com'
    LIMIT 1
  ) THEN
    RAISE NOTICE 'Skipping seed: real applications exist';
    RETURN;
  END IF;

  INSERT INTO career_applications (
    email, phone,
    application_state, last_transition_at, state_history,
    address, city, state, zip_code,
    high_school, graduation_year, gpa,
    employment_status, years_experience,
    data
  ) VALUES
    ('maria.garcia@example.com', '555-0101',
     'submitted', NOW() - INTERVAL '2 days',
     '[{"state":"started","timestamp":"2026-01-25T10:00:00Z","action":"created"},{"state":"submitted","timestamp":"2026-01-28T11:00:00Z","action":"submitted"}]'::jsonb,
     '123 Main St', 'Indianapolis', 'IN', '46201',
     'Arsenal Technical High School', '2024', '3.5',
     'unemployed', '0',
     '{"first_name":"Maria","last_name":"Garcia"}'::jsonb),
     
    ('james.wilson@example.com', '555-0102',
     'review_ready', NOW() - INTERVAL '1 day',
     '[{"state":"started","timestamp":"2026-01-27T08:00:00Z","action":"created"},{"state":"review_ready","timestamp":"2026-01-29T15:00:00Z","action":"advanced"}]'::jsonb,
     '456 Oak Ave', 'Indianapolis', 'IN', '46202',
     'Shortridge High School', '2023', '3.8',
     'part_time', '1',
     '{"first_name":"James","last_name":"Wilson"}'::jsonb),
     
    ('aisha.johnson@example.com', '555-0103',
     'documents_complete', NOW() - INTERVAL '3 hours',
     '[{"state":"started","timestamp":"2026-01-29T09:00:00Z","action":"created"},{"state":"documents_complete","timestamp":"2026-01-29T21:00:00Z","action":"advanced"}]'::jsonb,
     '789 Pine Rd', 'Indianapolis', 'IN', '46203',
     'Crispus Attucks High School', '2025', '3.2',
     'student', '0',
     '{"first_name":"Aisha","last_name":"Johnson"}'::jsonb),
     
    ('carlos.martinez@example.com', '555-0104',
     'eligibility_complete', NOW() - INTERVAL '6 hours',
     '[{"state":"started","timestamp":"2026-01-29T18:00:00Z","action":"created"},{"state":"eligibility_complete","timestamp":"2026-01-29T22:00:00Z","action":"advanced"}]'::jsonb,
     '321 Elm St', 'Indianapolis', 'IN', '46204',
     'George Washington High School', '2024', '3.0',
     'full_time', '2',
     '{"first_name":"Carlos","last_name":"Martinez"}'::jsonb),
     
    ('emily.chen@example.com', '555-0105',
     'started', NOW(),
     '[{"state":"started","timestamp":"2026-01-30T00:00:00Z","action":"created"}]'::jsonb,
     NULL, NULL, NULL, NULL,
     NULL, NULL, NULL,
     NULL, NULL,
     '{"first_name":"Emily","last_name":"Chen"}'::jsonb)
  ON CONFLICT DO NOTHING;

END $$;
