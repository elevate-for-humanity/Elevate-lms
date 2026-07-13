CREATE TABLE IF NOT EXISTS marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  category TEXT,
  rating DECIMAL(3,1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed marketplace items
INSERT INTO marketplace_items (id, title, description, price, category, rating, reviews_count, is_active, created_at) VALUES
  (gen_random_uuid(), 'CNA Study Guide Bundle', 'Comprehensive study materials for CNA certification exam including practice tests, flashcards, and study notes.', 29.99, 'Study Materials', 4.8, 124, true, NOW()),
  (gen_random_uuid(), 'HVAC Fundamentals eBook', 'Complete guide to HVAC systems, maintenance, and troubleshooting for beginners and professionals.', 19.99, 'eBooks', 4.6, 89, true, NOW()),
  (gen_random_uuid(), 'Resume Template Pack', 'Professional resume templates designed for healthcare, trades, and technology careers. Includes cover letter templates.', 14.99, 'Career Resources', 4.9, 256, true, NOW()),
  (gen_random_uuid(), 'Interview Prep Course', 'Video course covering common interview questions, body language tips, and salary negotiation strategies.', 49.99, 'Courses', 4.7, 178, true, NOW()),
  (gen_random_uuid(), 'Medical Terminology Flashcards', 'Digital flashcard set with 500+ medical terms, definitions, and pronunciation guides.', 9.99, 'Study Materials', 4.5, 312, true, NOW()),
  (gen_random_uuid(), 'Electrical Code Reference Guide', 'Quick reference guide for NEC electrical codes with diagrams and examples.', 24.99, 'Reference', 4.8, 67, true, NOW()),
  (gen_random_uuid(), 'Tax Preparation Workbook', 'Practice workbook with sample tax returns and step-by-step instructions for tax preparers.', 34.99, 'Workbooks', 4.6, 145, true, NOW()),
  (gen_random_uuid(), 'IT Certification Practice Tests', 'Practice exams for CompTIA A+, Network+, and Security+ certifications with detailed explanations.', 39.99, 'Practice Tests', 4.9, 423, true, NOW())
ON CONFLICT DO NOTHING;
