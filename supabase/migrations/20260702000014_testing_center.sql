-- Testing Center: seed upcoming slots in the existing testing_slots table.
-- testing_slots already exists — no schema changes needed.

INSERT INTO testing_slots (exam_type, start_time, end_time, capacity, location, notes, is_cancelled)
SELECT
  v.exam_type,
  (CURRENT_DATE + v.days_ahead)::timestamptz + v.start_offset,
  (CURRENT_DATE + v.days_ahead)::timestamptz + v.end_offset,
  v.capacity,
  'Elevate Testing Center — Indianapolis, IN',
  NULL,
  false
FROM (VALUES
  ('epa608',   1, INTERVAL '9 hours',  INTERVAL '12 hours', 10),
  ('epa608',   1, INTERVAL '13 hours', INTERVAL '16 hours', 10),
  ('nccer',    3, INTERVAL '9 hours',  INTERVAL '12 hours',  8),
  ('epa608',   5, INTERVAL '10 hours', INTERVAL '13 hours', 10),
  ('workkeys', 7, INTERVAL '9 hours',  INTERVAL '12 hours', 12)
) AS v(exam_type, days_ahead, start_offset, end_offset, capacity)
WHERE NOT EXISTS (
  SELECT 1 FROM testing_slots
  WHERE exam_type = v.exam_type
    AND start_time = (CURRENT_DATE + v.days_ahead)::timestamptz + v.start_offset
);
