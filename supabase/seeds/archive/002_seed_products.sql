-- Seed store products
INSERT INTO products (title, price, repo)
VALUES
  ('EFH LMS Full Codebase', 150000, 'elevateforhumanity/fix2'),
  ('EFH Dev Studio', 75000, 'elevateforhumanity/fix2-dev'),
  ('EFH Course Builder', 50000, 'elevateforhumanity/course-builder'),
  ('EFH Autopilot System', 100000, 'elevateforhumanity/autopilot')
ON CONFLICT DO NOTHING;
