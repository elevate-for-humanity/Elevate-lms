ALTER TABLE forum_categories ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
-- Seed forum categories
INSERT INTO forum_categories (id, name, slug, description, sort_order) VALUES
  (gen_random_uuid(), 'General Discussion', 'general-discussion', 'General topics and community conversations', 1),
  (gen_random_uuid(), 'Healthcare Programs', 'healthcare-programs', 'Discuss CNA, Medical Assistant, Phlebotomy and other healthcare training', 2),
  (gen_random_uuid(), 'Skilled Trades', 'skilled-trades', 'HVAC, Electrical, Plumbing, Welding discussions', 3),
  (gen_random_uuid(), 'Technology', 'technology', 'IT Support, Cybersecurity, and tech career discussions', 4),
  (gen_random_uuid(), 'Job Search & Career', 'job-search-career', 'Resume tips, interview prep, job opportunities', 5),
  (gen_random_uuid(), 'Student Support', 'student-support', 'Get help with coursework, funding, and student services', 6)
ON CONFLICT (slug) DO NOTHING;
