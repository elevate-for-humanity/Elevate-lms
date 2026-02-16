-- ============================================================================
-- FAQ TABLE AND SEED DATA
-- ============================================================================

-- Create FAQs table
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  program_slug TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Public read policy
DROP POLICY IF EXISTS "Public can view active faqs" ON faqs;
CREATE POLICY "Public can view active faqs" ON faqs
  FOR SELECT USING (is_active = true);

-- Grant access
GRANT SELECT ON faqs TO anon;
GRANT SELECT ON faqs TO authenticated;

-- Index for performance
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS category TEXT;
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS is_active TEXT;
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active) WHERE is_active = true;

-- Seed FAQ data
INSERT INTO faqs (question, answer, category, display_order, is_active) VALUES
-- General
('What is Elevate for Humanity?', 'Elevate for Humanity is a workforce development organization that provides free, funded career training programs. We connect individuals with government-funded training opportunities in healthcare, skilled trades, technology, and more.', 'general', 1, true),
('Are the training programs really free?', 'Yes! Our programs are funded through WIOA (Workforce Innovation and Opportunity Act), state workforce grants, and other government funding sources. If you qualify, you pay nothing for tuition.', 'general', 2, true),
('Where are you located?', 'We are headquartered in Indianapolis, Indiana, and serve students throughout the state. Many of our programs are available both in-person and online.', 'general', 3, true),

-- Eligibility
('Who is eligible for free training?', 'Eligibility varies by program and funding source. Generally, you may qualify if you are unemployed, underemployed, a veteran, receiving public assistance, or meet certain income guidelines. Complete our eligibility screener to find out.', 'eligibility', 4, true),
('What is WIOA funding?', 'WIOA (Workforce Innovation and Opportunity Act) is federal funding that pays for job training for eligible individuals. If you qualify, WIOA can cover your entire tuition, plus provide support for transportation, childcare, and other needs.', 'eligibility', 5, true),
('Do I need a high school diploma to enroll?', 'Requirements vary by program. Some programs require a high school diploma or GED, while others do not. Contact us to discuss your specific situation.', 'eligibility', 6, true),

-- Programs
('What programs do you offer?', 'We offer training in Healthcare (CNA, Medical Assistant, Phlebotomy), Skilled Trades (HVAC, Electrical, Construction), CDL/Transportation, Barber Apprenticeship, and more. Visit our Programs page for the full list.', 'programs', 7, true),
('How long are the training programs?', 'Program length varies from 4 weeks to 16 weeks depending on the certification. Healthcare programs typically run 8-12 weeks, while skilled trades may be 10-16 weeks.', 'programs', 8, true),
('Do I get a certification when I complete training?', 'Yes! All our programs lead to industry-recognized certifications. For example, our healthcare program prepares you for the Indiana State CNA exam.', 'programs', 9, true),

-- Enrollment
('How do I apply?', 'Click the "Apply Now" button on our website to start your application. You will complete an eligibility screener, submit required documents, and schedule an orientation.', 'enrollment', 10, true),
('What documents do I need to apply?', 'Typically you will need: government-issued ID, Social Security card, proof of income (or unemployment), and proof of address. Additional documents may be required based on your funding source.', 'enrollment', 11, true),
('How long does the enrollment process take?', 'The enrollment process typically takes 1-2 weeks, depending on how quickly you can provide required documents and complete orientation.', 'enrollment', 12, true),

-- Career Services
('Do you help with job placement?', 'Yes! We provide career services including resume writing, interview preparation, job search assistance, and direct connections to hiring employers. Our goal is to help you get hired.', 'career', 13, true),
('What is the job placement rate?', 'Our job placement rate varies by program but averages over 80% within 90 days of graduation. Many students receive job offers before they even complete training.', 'career', 14, true),

-- Funding
('What if I do not qualify for WIOA?', 'We have multiple funding sources available. If you do not qualify for WIOA, you may qualify for other state grants, employer-sponsored training, or payment plans. We will work with you to find a solution.', 'funding', 15, true),
('Are there any hidden fees?', 'No hidden fees. If you qualify for funded training, your tuition is covered. We are transparent about any costs for uniforms, supplies, or certification exams, and many of these are also covered by funding.', 'funding', 16, true)

ON CONFLICT DO NOTHING;
