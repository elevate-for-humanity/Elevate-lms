-- Seed Training Modules
-- Sample training content for staff

INSERT INTO training_modules (title, description, video_url, duration, quiz_questions, required, order_index) VALUES
(
  'Welcome to Elevate for Humanity',
  'Introduction to our mission, values, and organizational structure. Learn about our programs and how you contribute to student success.',
  'https://www.youtube.com/watch?v=example1',
  15,
  '[
    {"question": "What is our primary mission?", "options": ["Workforce development", "Tax preparation", "Both"], "correct": 2},
    {"question": "How many programs do we offer?", "options": ["5-10", "10-20", "20+"], "correct": 2}
  ]'::jsonb,
  true,
  1
),
(
  'Student Enrollment Process',
  'Step-by-step guide to enrolling students, from application to program placement. Covers eligibility requirements, documentation, and funding sources.',
  'https://www.youtube.com/watch?v=example2',
  25,
  '[
    {"question": "What documents are required for WIOA enrollment?", "options": ["ID only", "ID and proof of eligibility", "No documents needed"], "correct": 1},
    {"question": "Who approves funding?", "options": ["Staff", "Workforce board", "Student"], "correct": 1}
  ]'::jsonb,
  true,
  2
),
(
  'FERPA Compliance Training',
  'Understanding student privacy rights under FERPA. Learn what information can be shared, with whom, and how to handle sensitive data.',
  'https://www.youtube.com/watch?v=example3',
  20,
  '[
    {"question": "Can you share student grades with parents without consent?", "options": ["Yes, always", "No, never", "Only if student is dependent"], "correct": 2},
    {"question": "How long must FERPA records be retained?", "options": ["1 year", "3 years", "5 years"], "correct": 2}
  ]'::jsonb,
  true,
  3
),
(
  'Customer Service Excellence',
  'Best practices for supporting students, handling difficult situations, and maintaining professional communication.',
  'https://www.youtube.com/watch?v=example4',
  18,
  '[
    {"question": "What is the first step when a student is upset?", "options": ["Defend yourself", "Listen actively", "Transfer to manager"], "correct": 1},
    {"question": "How quickly should we respond to student emails?", "options": ["Same day", "Within 24 hours", "Within 48 hours"], "correct": 1}
  ]'::jsonb,
  true,
  4
),
(
  'Using Our LMS Platform',
  'Navigate the learning management system, track student progress, and generate reports.',
  'https://www.youtube.com/watch?v=example5',
  22,
  '[
    {"question": "Where do you find student completion rates?", "options": ["Dashboard", "Reports section", "Student profile"], "correct": 1},
    {"question": "Can students access courses before enrollment is complete?", "options": ["Yes", "No", "Only preview"], "correct": 1}
  ]'::jsonb,
  false,
  5
),
(
  'VITA Tax Preparation Basics',
  'Introduction to VITA program, IRS certification requirements, and volunteer coordination.',
  'https://www.youtube.com/watch?v=example6',
  30,
  '[
    {"question": "What IRS certification is required for VITA volunteers?", "options": ["Basic", "Advanced", "Military"], "correct": 0},
    {"question": "What is the income limit for VITA services?", "options": ["$30,000", "$50,000", "$64,000"], "correct": 2}
  ]'::jsonb,
  false,
  6
),
(
  'Grant Reporting and Compliance',
  'Understanding grant requirements, tracking outcomes, and preparing reports for funders.',
  'https://www.youtube.com/watch?v=example7',
  28,
  '[
    {"question": "How often are WIOA reports due?", "options": ["Monthly", "Quarterly", "Annually"], "correct": 1},
    {"question": "What metrics must be tracked?", "options": ["Enrollment only", "Completion only", "Enrollment, completion, and placement"], "correct": 2}
  ]'::jsonb,
  false,
  7
),
(
  'Safety and Emergency Procedures',
  'Workplace safety protocols, emergency evacuation procedures, and incident reporting.',
  'https://www.youtube.com/watch?v=example8',
  12,
  '[
    {"question": "Where are the emergency exits?", "options": ["Front only", "Front and back", "Multiple locations"], "correct": 2},
    {"question": "Who do you report incidents to?", "options": ["Manager", "HR", "Both"], "correct": 2}
  ]'::jsonb,
  true,
  8
);

COMMENT ON TABLE training_modules IS 'Seeded with 8 training modules covering essential staff topics';
