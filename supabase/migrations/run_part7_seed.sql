-- Part 7: Seed essential data into new tables
-- Run AFTER parts 1-6 have been executed

-- Volunteer opportunities
INSERT INTO volunteer_opportunities (title, description, organization, location, commitment, is_active) VALUES
  ('Classroom Assistant', 'Help instructors with hands-on training sessions', 'Elevate for Humanity', 'Indianapolis, IN', '4 hours/week', true),
  ('Career Fair Coordinator', 'Organize and run quarterly career fairs for graduates', 'Elevate for Humanity', 'Indianapolis, IN', '10 hours/quarter', true),
  ('Mentorship Program', 'Guide new students through their first 90 days of training', 'Elevate for Humanity', 'Remote / Indianapolis', '2 hours/week', true),
  ('Community Outreach', 'Represent Elevate at community events and job fairs', 'Elevate for Humanity', 'Central Indiana', '5 hours/month', true);

-- Community groups
INSERT INTO community_groups (name, description, category, member_count, is_active) VALUES
  ('Healthcare Cohort', 'CNA, Medical Assistant, and Phlebotomy students and graduates', 'Healthcare', 45, true),
  ('Skilled Trades Network', 'HVAC, Electrical, Welding, and Plumbing professionals', 'Trades', 38, true),
  ('CDL Drivers Club', 'Current and former CDL training participants', 'Transportation', 22, true),
  ('Barber Apprentices', 'Active barber apprenticeship participants', 'Barbering', 31, true),
  ('Tech & Cybersecurity', 'IT Support and Cybersecurity program members', 'Technology', 19, true),
  ('Alumni Network', 'All Elevate graduates — job leads, networking, support', 'Alumni', 156, true);

-- Certificate templates
INSERT INTO certificate_templates (name, description, status) VALUES
  ('Program Completion', 'Standard certificate for completing a training program', 'active'),
  ('WIOA Credential', 'Certificate for WIOA-funded credential attainment', 'active'),
  ('Apprenticeship Completion', 'DOL Registered Apprenticeship completion certificate', 'active'),
  ('CPR/First Aid', 'HSI CPR and First Aid certification', 'active');

-- Onboarding resources
INSERT INTO onboarding_resources (title, description, resource_type, role, order_index, is_active) VALUES
  ('Student Handbook', 'Required reading — policies, expectations, and resources', 'document', 'student', 1, true),
  ('Enrollment Agreement', 'Review and sign your enrollment agreement', 'form', 'student', 2, true),
  ('Campus Tour Video', 'Virtual tour of training facilities', 'video', 'student', 3, true),
  ('Financial Aid Overview', 'WIOA, grants, and payment options explained', 'document', 'student', 4, true),
  ('Program Schedule', 'Your class schedule and important dates', 'document', 'student', 5, true),
  ('Partner Onboarding Guide', 'How to set up your partner account and manage apprentices', 'document', 'partner', 1, true),
  ('Instructor Portal Guide', 'How to create courses, grade assignments, and track attendance', 'document', 'instructor', 1, true);

-- Waitlist (empty but ready)
-- No seed data needed — waitlist entries come from user signups

-- Support ticket categories (via a sample)
INSERT INTO support_tickets (subject, description, status, priority) VALUES
  ('How do I reset my password?', 'Sample FAQ-style ticket for reference', 'resolved', 'low');

-- Library resources
INSERT INTO library_resources (title, description, resource_type, is_public) VALUES
  ('OSHA 10 Study Guide', 'Preparation materials for OSHA 10-Hour certification', 'document', true),
  ('Resume Writing Workshop', 'Step-by-step guide to building a professional resume', 'document', true),
  ('Interview Preparation', 'Common interview questions and best practices', 'document', true),
  ('Financial Literacy Basics', 'Budgeting, saving, and credit fundamentals', 'document', true);

-- Videos
INSERT INTO videos (title, description, category, published, duration_seconds) VALUES
  ('Welcome to Elevate', 'Introduction to Elevate for Humanity and our mission', 'orientation', true, 180),
  ('Campus Tour', 'Virtual tour of our Indianapolis training facility', 'orientation', true, 300),
  ('WIOA Funding Explained', 'How WIOA covers your tuition and training costs', 'funding', true, 240),
  ('Student Success Stories', 'Hear from graduates who launched new careers', 'testimonials', true, 360);

-- CRM leads (sample)
INSERT INTO crm_leads (name, email, source, status) VALUES
  ('Sample Lead', 'sample@example.com', 'website', 'new');

-- Email campaign templates
INSERT INTO email_campaigns (name, subject, status) VALUES
  ('Welcome Series', 'Welcome to Elevate for Humanity!', 'draft'),
  ('Program Reminder', 'Your training starts next week', 'draft'),
  ('Graduate Follow-Up', 'How is your new career going?', 'draft');

-- Job opportunities
INSERT INTO job_opportunities (title, description, location, salary_range, job_type, status) VALUES
  ('CNA - Sunrise Senior Living', 'Certified Nursing Assistant position at local senior care facility', 'Indianapolis, IN', '$16-20/hr', 'full-time', 'open'),
  ('HVAC Technician - Service Experts', 'Entry-level HVAC technician for residential service calls', 'Indianapolis, IN', '$18-24/hr', 'full-time', 'open'),
  ('CDL Driver - XPO Logistics', 'Class A CDL driver for regional routes', 'Central Indiana', '$55,000-65,000/yr', 'full-time', 'open'),
  ('Barber - Great Clips', 'Licensed barber position at busy salon', 'Indianapolis, IN', '$15-22/hr + tips', 'full-time', 'open'),
  ('IT Support Specialist - Salesforce', 'Help desk and desktop support role', 'Indianapolis, IN (Hybrid)', '$45,000-55,000/yr', 'full-time', 'open');
