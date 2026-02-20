
-- Add quiz_questions, topics, and content_type to the lessons VIEW
-- so the LMS lesson page can render quizzes inline.

-- Ensure columns exist on training_lessons
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'video';
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS quiz_id UUID;
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 70;
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS description TEXT;

-- Recreate lessons VIEW with quiz fields
DROP VIEW IF EXISTS lessons CASCADE;

CREATE VIEW lessons AS
SELECT
  id,
  COALESCE(course_id_uuid, id) AS course_id,
  title,
  content,
  description,
  video_url,
  lesson_number,
  order_index,
  duration_minutes,
  is_required,
  is_published,
  content_type,
  quiz_id,
  quiz_questions,
  passing_score,
  topics,
  created_at,
  updated_at
FROM training_lessons;

-- Restore writable rules
CREATE OR REPLACE RULE lessons_insert AS ON INSERT TO lessons
DO INSTEAD INSERT INTO training_lessons (
  course_id_uuid, title, content, description, video_url, lesson_number, order_index,
  duration_minutes, is_required, is_published, content_type, quiz_id, quiz_questions,
  passing_score, topics
) VALUES (
  NEW.course_id, NEW.title, NEW.content, NEW.description, NEW.video_url, NEW.lesson_number,
  NEW.order_index, NEW.duration_minutes, NEW.is_required, NEW.is_published, NEW.content_type,
  NEW.quiz_id, NEW.quiz_questions, NEW.passing_score, NEW.topics
);

CREATE OR REPLACE RULE lessons_update AS ON UPDATE TO lessons
DO INSTEAD UPDATE training_lessons SET
  title = NEW.title,
  content = NEW.content,
  description = NEW.description,
  video_url = NEW.video_url,
  lesson_number = NEW.lesson_number,
  order_index = NEW.order_index,
  duration_minutes = NEW.duration_minutes,
  is_required = NEW.is_required,
  is_published = NEW.is_published,
  content_type = NEW.content_type,
  quiz_id = NEW.quiz_id,
  quiz_questions = NEW.quiz_questions,
  passing_score = NEW.passing_score,
  topics = NEW.topics,
  updated_at = NOW()
WHERE id = OLD.id;

CREATE OR REPLACE RULE lessons_delete AS ON DELETE TO lessons
DO INSTEAD DELETE FROM training_lessons WHERE id = OLD.id;

-- Grant permissions
GRANT SELECT ON lessons TO authenticated;
GRANT SELECT ON lessons TO anon;
-- ============================================================
-- HVAC Technician Course — Sync Migration
-- 16 modules, 94 lessons with deterministic UUIDs
-- ETPL Program #10004322 | 20 weeks | Hybrid
--
-- Deterministic UUIDs generated via UUID v5 with namespace
-- a1b2c3d4-e5f6-7890-abcd-200000000001
-- This migration is idempotent (ON CONFLICT DO UPDATE).
--
-- Run in: Supabase SQL Editor (Dashboard)
-- ============================================================

-- 1. Upsert the HVAC course into training_courses
INSERT INTO training_courses (
  id, course_name, title, description, is_active, category, created_at
) VALUES (
  'f0593164-55be-5867-98e7-8a86770a8dd0',
  'HVAC Technician',
  'HVAC Technician',
  'Complete HVAC training: heating, cooling, refrigeration, EPA 608 Universal certification, OSHA 30, and residential HVAC certifications. ETPL Program #10004322. 20-week hybrid program.',
  true,
  'Skilled Trades',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  course_name = EXCLUDED.course_name,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  category = EXCLUDED.category,
  updated_at = NOW();

-- 2. Delete existing HVAC lessons for this course to avoid duplicates
DELETE FROM training_lessons WHERE course_id_uuid = 'f0593164-55be-5867-98e7-8a86770a8dd0';

-- 3. Insert all 94 lessons (basic content only)
-- For full quiz questions and content_type, use the sync API:
-- POST /api/admin/sync-course-definitions { slug: "hvac-technician" }
-- The sync API reads quiz data from lib/courses/hvac-quizzes.ts
INSERT INTO training_lessons (
  id, course_id_uuid, lesson_number, order_index, title, content, duration_minutes, is_published, is_required, created_at
) VALUES
  ('2f172cb2-4657-5460-9b93-f9b062ad8dd2', 'f0593164-55be-5867-98e7-8a86770a8dd0', 1, 101, 'Welcome to HVAC Technician Training', '<h2>Lesson Overview</h2><p>Program structure, schedule, credentials earned, and career outlook</p>', 20, true, true, NOW()),
  ('96576bf0-cbd5-581f-99aa-f36e48e694fd', 'f0593164-55be-5867-98e7-8a86770a8dd0', 2, 102, 'WIOA Funding, Attendance & Support Services', '<h2>Reading</h2><p>Understanding workforce funding, attendance requirements, and available support</p>', NULL, true, true, NOW()),
  ('5c5b516c-2e7c-5cae-8231-1f4483c1a912', 'f0593164-55be-5867-98e7-8a86770a8dd0', 3, 103, 'HVAC Career Pathways', '<h2>Lesson Overview</h2><p>Residential, commercial, industrial HVAC — career progression from apprentice to master</p>', 15, true, true, NOW()),
  ('4097148b-7a06-5784-9807-5e3470d4c091', 'f0593164-55be-5867-98e7-8a86770a8dd0', 4, 104, 'Orientation Quiz', '<p>Confirm understanding of program requirements and expectations</p>', 10, true, true, NOW()),
  ('ee8c4e3a-b1c6-51bf-acd5-2836c8b16e56', 'f0593164-55be-5867-98e7-8a86770a8dd0', 5, 201, 'How HVAC Systems Work', '<h2>Lesson Overview</h2><p>Heating cycle, cooling cycle, ventilation, and air distribution basics</p>', 40, true, true, NOW()),
  ('fea2c0e6-ac93-518e-ae22-9528daa1ec3f', 'f0593164-55be-5867-98e7-8a86770a8dd0', 6, 202, 'HVAC Tools & Equipment', '<h2>Lesson Overview</h2><p>Gauges, manifolds, vacuum pumps, recovery machines, hand tools, and meters</p>', 30, true, true, NOW()),
  ('f2878977-fe02-568e-afdf-7d6fcf67b375', 'f0593164-55be-5867-98e7-8a86770a8dd0', 7, 203, 'PPE & Shop Safety', '<h2>Reading</h2><p>Personal protective equipment, electrical safety, refrigerant safety, and lockout/tagout</p>', NULL, true, true, NOW()),
  ('317fd364-2d8c-5d5f-9ade-e096ec30ab26', 'f0593164-55be-5867-98e7-8a86770a8dd0', 8, 204, 'System Components Identification', '<h2>Lab Exercise</h2><p>Identify compressor, condenser, evaporator, metering device, and airflow components</p><p><strong>Type:</strong> Hands-on lab</p>', 60, true, true, NOW()),
  ('b38d2dfa-ad67-5664-98a1-f831d3d7ea07', 'f0593164-55be-5867-98e7-8a86770a8dd0', 9, 205, 'HVAC Fundamentals Quiz', '<p>Test knowledge of HVAC principles, components, and safety</p>', 15, true, true, NOW()),
  ('dba03432-fb85-5f6f-bc69-4cc785a7904a', 'f0593164-55be-5867-98e7-8a86770a8dd0', 10, 301, 'Voltage, Current, Resistance & Ohm''''s Law', '<h2>Lesson Overview</h2><p>Fundamental electrical concepts every HVAC tech must know</p>', 45, true, true, NOW()),
  ('ba8f7e3f-af6b-50bc-9564-f2bb0b303349', 'f0593164-55be-5867-98e7-8a86770a8dd0', 11, 302, 'Reading Wiring Diagrams & Schematics', '<h2>Lesson Overview</h2><p>Ladder diagrams, pictorial diagrams, and schematic symbols</p>', 35, true, true, NOW()),
  ('598c6f54-1ea9-5e73-ac5b-f8e29a556110', 'f0593164-55be-5867-98e7-8a86770a8dd0', 12, 303, 'Multimeter & Amp Clamp Lab', '<h2>Lab Exercise</h2><p>Hands-on practice measuring voltage, amperage, resistance, and capacitance</p><p><strong>Type:</strong> Hands-on lab</p>', 90, true, true, NOW()),
  ('1020f5bf-0d4f-5f87-b43b-da658cb24fab', 'f0593164-55be-5867-98e7-8a86770a8dd0', 13, 304, 'Capacitors, Contactors & Relays', '<h2>Lesson Overview</h2><p>How electrical components control HVAC system operation</p>', 30, true, true, NOW()),
  ('b23ca62f-295e-5c2c-aa00-783f16e91ed9', 'f0593164-55be-5867-98e7-8a86770a8dd0', 14, 305, 'Electrical Basics Quiz', '<p>Assessment of electrical fundamentals for HVAC</p>', 15, true, true, NOW()),
  ('baed04b3-35ae-51c7-a325-c678fbd0e725', 'f0593164-55be-5867-98e7-8a86770a8dd0', 15, 401, 'Gas Furnace Operation', '<h2>Lesson Overview</h2><p>Gas valve, ignition systems, heat exchangers, blower operation, and safety controls</p>', 45, true, true, NOW()),
  ('9bfa7972-4169-5360-9b82-84aef75ce4d4', 'f0593164-55be-5867-98e7-8a86770a8dd0', 16, 402, 'Electric Heat & Heat Strips', '<h2>Lesson Overview</h2><p>Sequencers, heating elements, and electric furnace operation</p>', 25, true, true, NOW()),
  ('b84ebdfa-ff58-53c2-96eb-5975e584cbc1', 'f0593164-55be-5867-98e7-8a86770a8dd0', 17, 403, 'Heat Pump Heating Mode', '<h2>Lesson Overview</h2><p>Reversing valve, defrost cycle, auxiliary heat, and balance point</p>', 35, true, true, NOW()),
  ('26bfd436-bfa9-587a-a98a-93a89ae0af22', 'f0593164-55be-5867-98e7-8a86770a8dd0', 18, 404, 'Combustion Analysis', '<h2>Lab Exercise</h2><p>CO testing, draft measurement, gas pressure checks, and temperature rise</p><p><strong>Type:</strong> Hands-on lab</p>', 60, true, true, NOW()),
  ('9a82e78f-eb1c-5592-a013-c7fe58033531', 'f0593164-55be-5867-98e7-8a86770a8dd0', 19, 405, 'Furnace Inspection Lab', '<h2>Lab Exercise</h2><p>Complete furnace inspection, tune-up, and safety check procedure</p><p><strong>Type:</strong> Hands-on lab</p>', 90, true, true, NOW()),
  ('ca5df4d7-f2c4-5f91-aa9a-a4d9b2730c03', 'f0593164-55be-5867-98e7-8a86770a8dd0', 20, 406, 'Heating Systems Quiz', '<p>Test knowledge of heating system operation and maintenance</p>', 15, true, true, NOW()),
  ('3b753cee-2a4f-5702-9661-23d48f475b7b', 'f0593164-55be-5867-98e7-8a86770a8dd0', 21, 501, 'The Refrigeration Cycle', '<h2>Lesson Overview</h2><p>Compression, condensation, expansion, evaporation — the four stages explained</p>', 45, true, true, NOW()),
  ('cad2cb2e-8551-56ed-95ed-bfc0d6cb9c27', 'f0593164-55be-5867-98e7-8a86770a8dd0', 22, 502, 'Pressure-Temperature Relationship', '<h2>Lesson Overview</h2><p>PT charts, saturation, superheat, and subcooling — the foundation of HVAC diagnostics</p>', 30, true, true, NOW()),
  ('866b89da-dbff-58c5-9fd3-2d3c8ccffa4a', 'f0593164-55be-5867-98e7-8a86770a8dd0', 23, 503, 'Compressor Types & Operation', '<h2>Lesson Overview</h2><p>Reciprocating, scroll, and rotary compressors</p>', 25, true, true, NOW()),
  ('41d3a7f1-2d0d-5034-96d6-fa0f44b58182', 'f0593164-55be-5867-98e7-8a86770a8dd0', 24, 504, 'Metering Devices', '<h2>Lesson Overview</h2><p>TXV, fixed orifice, capillary tube — how each controls refrigerant flow</p>', 25, true, true, NOW()),
  ('daf39e52-5588-5643-9638-3e990ddd4fda', 'f0593164-55be-5867-98e7-8a86770a8dd0', 25, 505, 'Superheat & Subcooling Lab', '<h2>Lab Exercise</h2><p>Measure and calculate superheat and subcooling on a live system</p><p><strong>Type:</strong> Hands-on lab</p>', 90, true, true, NOW()),
  ('8e4dbcd2-39b0-5bbc-a8eb-a7f880335a2c', 'f0593164-55be-5867-98e7-8a86770a8dd0', 26, 506, 'Cooling Systems Quiz', '<p>Test knowledge of refrigeration cycle and AC system operation</p>', 15, true, true, NOW()),
  ('785652db-1125-5e78-a1c9-de65f2aa331a', 'f0593164-55be-5867-98e7-8a86770a8dd0', 27, 601, 'Ozone Layer & Environmental Impact', '<h2>Lesson Overview</h2><p>How CFCs and HCFCs deplete the ozone layer, Montreal Protocol, and phase-out schedules</p>', 30, true, true, NOW()),
  ('e732905c-bd0a-5232-b019-9cd5c77273b7', 'f0593164-55be-5867-98e7-8a86770a8dd0', 28, 602, 'Clean Air Act — Section 608', '<h2>Reading</h2><p>Federal regulations on refrigerant handling, venting prohibition, and penalties</p>', NULL, true, true, NOW()),
  ('6bbfccf1-ca8b-5167-b911-33780e89c4cc', 'f0593164-55be-5867-98e7-8a86770a8dd0', 29, 603, 'Refrigerant Safety', '<h2>Lesson Overview</h2><p>Toxicity, flammability, oxygen displacement, frostbite, and cylinder safety</p>', 25, true, true, NOW()),
  ('3325947e-f78e-5157-94f1-bb4b466cc2e4', 'f0593164-55be-5867-98e7-8a86770a8dd0', 30, 604, 'Refrigerant Types & Classifications', '<h2>Reading</h2><p>CFC, HCFC, HFC, HFO refrigerants — R-22, R-410A, R-134a, R-404A, and their properties</p>', NULL, true, true, NOW()),
  ('725fb861-b9ea-5e47-8de5-208923ed315a', 'f0593164-55be-5867-98e7-8a86770a8dd0', 31, 605, 'Pressure-Temperature Fundamentals', '<h2>Lesson Overview</h2><p>Saturation temperature, gauge vs absolute pressure, and PT chart usage</p>', 20, true, true, NOW()),
  ('ad1bdab2-b5b3-525a-bcff-8baecc08a99f', 'f0593164-55be-5867-98e7-8a86770a8dd0', 32, 606, 'Recovery, Recycling & Reclamation', '<h2>Lesson Overview</h2><p>Definitions, equipment requirements, and when each is required by law</p>', 30, true, true, NOW()),
  ('f9bba6db-e8f3-5abe-b1bf-7a193851bd7b', 'f0593164-55be-5867-98e7-8a86770a8dd0', 33, 607, 'Refrigerant Sales Restrictions', '<h2>Reading</h2><p>Who can purchase refrigerant, record-keeping requirements, and certification verification</p>', NULL, true, true, NOW()),
  ('23fe3eb2-9acf-5deb-a5e1-ecfb100564f3', 'f0593164-55be-5867-98e7-8a86770a8dd0', 34, 608, 'EPA 608 Core Practice Exam', '<p>25-question practice test matching EPA 608 Core exam format and difficulty</p>', 30, true, true, NOW()),
  ('6116718a-264f-5d03-8e12-8b141debcd9d', 'f0593164-55be-5867-98e7-8a86770a8dd0', 35, 701, 'Small Appliance Systems', '<h2>Lesson Overview</h2><p>Window AC, PTAC, household refrigerators, vending machines, and water coolers</p>', 25, true, true, NOW()),
  ('4699611d-28a6-51ea-ad08-71715ef53a7b', 'f0593164-55be-5867-98e7-8a86770a8dd0', 36, 702, 'Type I Recovery Requirements', '<h2>Lesson Overview</h2><p>90% recovery for systems with operating charge, 80% for non-operating, and when 0% applies</p>', 20, true, true, NOW()),
  ('597e92fe-4690-530f-839e-73099714e96e', 'f0593164-55be-5867-98e7-8a86770a8dd0', 37, 703, 'Self-Contained Recovery Equipment', '<h2>Reading</h2><p>System-dependent vs self-contained recovery, equipment certification, and procedures</p>', NULL, true, true, NOW()),
  ('c858274b-b270-5362-9203-25ee6d79398a', 'f0593164-55be-5867-98e7-8a86770a8dd0', 38, 704, 'Leak Repair Exemptions', '<h2>Reading</h2><p>Small appliance leak repair requirements and disposal procedures</p>', NULL, true, true, NOW()),
  ('d0a9f517-8ed8-59ac-8ab0-4dc5c5b249a6', 'f0593164-55be-5867-98e7-8a86770a8dd0', 39, 705, 'EPA 608 Type I Practice Exam', '<p>25-question practice test matching EPA 608 Type I exam format</p>', 25, true, true, NOW()),
  ('97b819f5-81ff-5e3a-a165-911b207121d5', 'f0593164-55be-5867-98e7-8a86770a8dd0', 40, 801, 'High-Pressure System Overview', '<h2>Lesson Overview</h2><p>Residential AC, commercial refrigeration, heat pumps, and automotive AC systems</p>', 30, true, true, NOW()),
  ('6e675133-b0f8-5a85-ab4c-d0cf7bbf9f8e', 'f0593164-55be-5867-98e7-8a86770a8dd0', 41, 802, 'Type II Recovery Requirements', '<h2>Lesson Overview</h2><p>Required recovery levels: 0 psig for systems <200 lbs, 10 inches Hg vacuum for >200 lbs</p>', 25, true, true, NOW()),
  ('380699d9-f6a0-5d7e-a09a-2b69bb4aff76', 'f0593164-55be-5867-98e7-8a86770a8dd0', 42, 803, 'Leak Detection Methods', '<h2>Lesson Overview</h2><p>Electronic leak detectors, UV dye, soap bubbles, standing pressure test, and nitrogen</p>', 20, true, true, NOW()),
  ('6fd12be2-26ff-5def-be3c-82af250b6441', 'f0593164-55be-5867-98e7-8a86770a8dd0', 43, 804, 'Evacuation Procedures', '<h2>Lesson Overview</h2><p>Vacuum pump operation, micron gauge, triple evacuation, and dehydration</p>', 25, true, true, NOW()),
  ('c0d9690c-2ba4-5c77-944f-83bc18d076a8', 'f0593164-55be-5867-98e7-8a86770a8dd0', 44, 805, 'Leak Repair Requirements', '<h2>Reading</h2><p>Comfort cooling 10% leak rate trigger, commercial 20%, mandatory repair timelines</p>', NULL, true, true, NOW()),
  ('22f4cbd7-49ea-5fb4-99d0-5d70a9cb876c', 'f0593164-55be-5867-98e7-8a86770a8dd0', 45, 806, 'Recovery Equipment Lab', '<h2>Lab Exercise</h2><p>Hands-on refrigerant recovery from a high-pressure system using certified equipment</p><p><strong>Type:</strong> Hands-on lab</p>', 90, true, true, NOW()),
  ('bdb91a6e-6f15-5f4c-bb28-fd7260525f57', 'f0593164-55be-5867-98e7-8a86770a8dd0', 46, 807, 'EPA 608 Type II Practice Exam', '<p>25-question practice test matching EPA 608 Type II exam format</p>', 25, true, true, NOW()),
  ('68964a49-cfe1-5a4a-8e57-41a1dc3290e2', 'f0593164-55be-5867-98e7-8a86770a8dd0', 47, 901, 'Low-Pressure System Overview', '<h2>Lesson Overview</h2><p>Centrifugal chillers, R-11, R-123 systems, and how they differ from high-pressure</p>', 25, true, true, NOW()),
  ('45de4da6-e35e-531f-bfc5-bc99501e7acd', 'f0593164-55be-5867-98e7-8a86770a8dd0', 48, 902, 'Type III Recovery Requirements', '<h2>Lesson Overview</h2><p>Required recovery levels: 0 psig for systems <200 lbs, 0 psig for >200 lbs</p>', 20, true, true, NOW()),
  ('cffd498d-d142-59c7-ac7d-fda4bab63015', 'f0593164-55be-5867-98e7-8a86770a8dd0', 49, 903, 'Purge Units & Air Removal', '<h2>Lesson Overview</h2><p>Why low-pressure systems operate in vacuum, purge unit function, and leak prevention</p>', 20, true, true, NOW()),
  ('bdde231a-d6e5-5ab6-9e59-1369423d23b0', 'f0593164-55be-5867-98e7-8a86770a8dd0', 50, 904, 'Water in Low-Pressure Systems', '<h2>Reading</h2><p>Freeze-up risks, hydrolysis, acid formation, and dehydration procedures</p>', NULL, true, true, NOW()),
  ('29c86322-2428-55f6-b6b3-2c8044dfa00d', 'f0593164-55be-5867-98e7-8a86770a8dd0', 51, 905, 'Rupture Disc & Pressure Relief', '<h2>Reading</h2><p>Safety devices on low-pressure systems and when they activate</p>', NULL, true, true, NOW()),
  ('585091b8-0a4f-5074-9374-1b552d98c413', 'f0593164-55be-5867-98e7-8a86770a8dd0', 52, 906, 'EPA 608 Type III Practice Exam', '<p>25-question practice test matching EPA 608 Type III exam format</p>', 25, true, true, NOW()),
  ('1482eb8f-9259-5f81-9871-50ba2998593d', 'f0593164-55be-5867-98e7-8a86770a8dd0', 53, 1001, 'Core Section Review', '<h2>Lesson Overview</h2><p>Quick review of key Core concepts, common exam traps, and memory aids</p>', 20, true, true, NOW()),
  ('a5da3faf-794d-5829-b0e2-e327c2fa021f', 'f0593164-55be-5867-98e7-8a86770a8dd0', 54, 1002, 'Type I, II, III Comparison Chart', '<h2>Reading</h2><p>Side-by-side comparison of recovery requirements, leak rates, and equipment rules</p>', NULL, true, true, NOW()),
  ('e17d20d8-9499-5e2b-b07a-ea14491a6872', 'f0593164-55be-5867-98e7-8a86770a8dd0', 55, 1003, 'Full-Length Practice Exam — Core', '<p>Timed 25-question Core practice exam under test conditions</p>', 30, true, true, NOW()),
  ('89bf59f3-5aaa-5df2-83f3-5d32c91b5d83', 'f0593164-55be-5867-98e7-8a86770a8dd0', 56, 1004, 'Full-Length Practice Exam — Type I', '<p>Timed 25-question Type I practice exam under test conditions</p>', 25, true, true, NOW()),
  ('a59e3c1a-7b8e-5ddd-8bc0-17ec3cdf5c34', 'f0593164-55be-5867-98e7-8a86770a8dd0', 57, 1005, 'Full-Length Practice Exam — Type II', '<p>Timed 25-question Type II practice exam under test conditions</p>', 25, true, true, NOW()),
  ('b31efdba-26b4-56f0-8138-43822d35ae81', 'f0593164-55be-5867-98e7-8a86770a8dd0', 58, 1006, 'Full-Length Practice Exam — Type III', '<p>Timed 25-question Type III practice exam under test conditions</p>', 25, true, true, NOW()),
  ('efae33d2-641f-56bc-9ad2-784129db4516', 'f0593164-55be-5867-98e7-8a86770a8dd0', 59, 1007, 'EPA 608 Universal Full Practice Exam', '<p>Complete 100-question timed practice exam — all 4 sections combined. Pass = 70% per section.</p>', 60, true, true, NOW()),
  ('0f05573b-f248-5a46-8089-fecbdb568ed9', 'f0593164-55be-5867-98e7-8a86770a8dd0', 60, 1101, 'Refrigerant Charging Methods', '<h2>Lesson Overview</h2><p>Subcooling method, superheat method, weigh-in method, and manufacturer specifications</p>', 35, true, true, NOW()),
  ('de9cc92e-d9cf-5e65-bc33-e6be44c0d0d2', 'f0593164-55be-5867-98e7-8a86770a8dd0', 61, 1102, 'System Diagnostics with Gauges', '<h2>Lesson Overview</h2><p>Reading manifold gauges, identifying overcharge, undercharge, restrictions, and non-condensables</p>', 40, true, true, NOW()),
  ('14d196dc-5ed3-54c7-8ac7-5657ccc4abdf', 'f0593164-55be-5867-98e7-8a86770a8dd0', 62, 1103, 'Leak Detection Lab', '<h2>Lab Exercise</h2><p>Practice electronic leak detection, nitrogen pressure test, and standing vacuum test</p><p><strong>Type:</strong> Hands-on lab</p>', 60, true, true, NOW()),
  ('09b1654c-b197-5edb-abc1-97b1481f5cd6', 'f0593164-55be-5867-98e7-8a86770a8dd0', 63, 1104, 'Recovery & Evacuation Lab', '<h2>Lab Exercise</h2><p>Recover refrigerant, pull vacuum to 500 microns, and charge system to spec</p><p><strong>Type:</strong> Hands-on lab</p>', 90, true, true, NOW()),
  ('570baadf-be07-57b7-8d5b-bcb8f8c23dfe', 'f0593164-55be-5867-98e7-8a86770a8dd0', 64, 1105, 'Refrigeration Diagnostics Quiz', '<p>Diagnose system problems from gauge readings and symptoms</p>', 20, true, true, NOW()),
  ('d14effbf-eb31-5686-aa9c-a83a6e4c9ce9', 'f0593164-55be-5867-98e7-8a86770a8dd0', 65, 1201, 'Ductwork Design & Installation', '<h2>Lesson Overview</h2><p>Supply, return, duct sizing, static pressure, and airflow measurement</p>', 35, true, true, NOW()),
  ('25fbe08b-6111-54ef-911c-d753dd71d748', 'f0593164-55be-5867-98e7-8a86770a8dd0', 66, 1202, 'Equipment Sizing — Manual J Basics', '<h2>Lesson Overview</h2><p>Heat load calculation concepts, equipment selection, and matching indoor/outdoor units</p>', 30, true, true, NOW()),
  ('42151711-0da4-5579-99e2-0fa907d88a5c', 'f0593164-55be-5867-98e7-8a86770a8dd0', 67, 1203, 'Brazing & Soldering', '<h2>Lab Exercise</h2><p>Hands-on brazing copper tubing with nitrogen purge, soldering techniques</p><p><strong>Type:</strong> Hands-on lab</p>', 90, true, true, NOW()),
  ('60d1c15b-56c9-59cd-bda0-cdb6c1490e55', 'f0593164-55be-5867-98e7-8a86770a8dd0', 68, 1204, 'Line Set Installation', '<h2>Lab Exercise</h2><p>Measure, cut, flare, and connect refrigerant line sets</p><p><strong>Type:</strong> Hands-on lab</p>', 60, true, true, NOW()),
  ('15c1c957-28df-5cb2-bb8a-dd8f0792468f', 'f0593164-55be-5867-98e7-8a86770a8dd0', 69, 1205, 'System Startup Procedures', '<h2>Lesson Overview</h2><p>Pre-startup checklist, initial charge, airflow verification, and performance test</p>', 25, true, true, NOW()),
  ('f5222938-3bf3-5cc8-8e5f-764043881d89', 'f0593164-55be-5867-98e7-8a86770a8dd0', 70, 1206, 'Installation Quiz', '<p>Test knowledge of installation procedures and best practices</p>', 15, true, true, NOW()),
  ('9b8de967-157d-5a9f-b3a5-f64ec6ca306d', 'f0593164-55be-5867-98e7-8a86770a8dd0', 71, 1301, 'Systematic Troubleshooting Method', '<h2>Lesson Overview</h2><p>Step-by-step approach: verify complaint, gather data, isolate, test, repair, verify</p>', 30, true, true, NOW()),
  ('3c9f427e-001c-557e-b777-eb488fbcea8a', 'f0593164-55be-5867-98e7-8a86770a8dd0', 72, 1302, 'Common AC Failures', '<h2>Lesson Overview</h2><p>Bad capacitor, failed compressor, frozen coil, dirty condenser, low charge, restriction</p>', 35, true, true, NOW()),
  ('7d0523bb-3662-5d4f-ba73-c7080059d8a2', 'f0593164-55be-5867-98e7-8a86770a8dd0', 73, 1303, 'Common Heating Failures', '<h2>Lesson Overview</h2><p>Ignition failure, cracked heat exchanger, bad gas valve, thermostat issues, blower problems</p>', 30, true, true, NOW()),
  ('d574fdc2-314c-5f22-9c84-1e4658a93bf5', 'f0593164-55be-5867-98e7-8a86770a8dd0', 74, 1304, 'Troubleshooting Scenarios Lab', '<h2>Lab Exercise</h2><p>Diagnose and repair multiple system faults on training equipment</p><p><strong>Type:</strong> Hands-on lab</p>', 120, true, true, NOW()),
  ('5d6a053f-0690-567a-93e3-2ca9642f04ac', 'f0593164-55be-5867-98e7-8a86770a8dd0', 75, 1305, 'Customer Communication', '<h2>Lesson Overview</h2><p>Explaining repairs to homeowners, providing estimates, and professional conduct</p>', 15, true, true, NOW()),
  ('b1c254a5-4216-5700-a420-f9c114265fbd', 'f0593164-55be-5867-98e7-8a86770a8dd0', 76, 1306, 'Troubleshooting Quiz', '<p>Diagnose system problems from described symptoms and readings</p>', 20, true, true, NOW()),
  ('ce416471-0243-53cb-99af-8f4cb883c9f5', 'f0593164-55be-5867-98e7-8a86770a8dd0', 77, 1401, 'OSHA 30 Overview & Worker Rights', '<h2>Lesson Overview</h2><p>OSHA standards, worker rights, employer responsibilities, and how to file a complaint</p>', 30, true, true, NOW()),
  ('8677ede9-251e-5f3d-b7e6-677c1740bffd', 'f0593164-55be-5867-98e7-8a86770a8dd0', 78, 1402, 'Fall Protection', '<h2>Lesson Overview</h2><p>Ladder safety, scaffolding, guardrails, personal fall arrest systems</p>', 45, true, true, NOW()),
  ('90fadab8-d9ba-57d5-92e2-8ba2d8b7bb99', 'f0593164-55be-5867-98e7-8a86770a8dd0', 79, 1403, 'Electrical Safety', '<h2>Lesson Overview</h2><p>Lockout/tagout, arc flash, ground fault protection, and safe work practices</p>', 30, true, true, NOW()),
  ('798b6baa-28aa-5a06-b981-c88312fa4b1d', 'f0593164-55be-5867-98e7-8a86770a8dd0', 80, 1404, 'Hazard Communication (HazCom)', '<h2>Reading</h2><p>GHS labels, Safety Data Sheets, chemical hazards, and right-to-know</p>', NULL, true, true, NOW()),
  ('23576f29-5103-59f8-ae9e-05e0a8013aee', 'f0593164-55be-5867-98e7-8a86770a8dd0', 81, 1405, 'PPE Selection & Use', '<h2>Lesson Overview</h2><p>Hard hats, safety glasses, gloves, respirators, and hearing protection</p>', 20, true, true, NOW()),
  ('58ff8848-0bcf-5a64-88b6-8c51dcd9057e', 'f0593164-55be-5867-98e7-8a86770a8dd0', 82, 1406, 'Confined Spaces & Excavations', '<h2>Lesson Overview</h2><p>Permit-required confined spaces, atmospheric testing, and trench safety</p>', 25, true, true, NOW()),
  ('e46831ad-a473-5d6a-b189-ae287ce02f42', 'f0593164-55be-5867-98e7-8a86770a8dd0', 83, 1407, 'Fire Prevention & Welding Safety', '<h2>Reading</h2><p>Hot work permits, fire extinguisher types, and brazing safety for HVAC</p>', NULL, true, true, NOW()),
  ('cacd86ff-f6f0-5919-918b-94ce7f37a621', 'f0593164-55be-5867-98e7-8a86770a8dd0', 84, 1408, 'OSHA 30 Final Exam', '<p>Comprehensive OSHA 30 assessment — must pass to earn OSHA 30 card</p>', 45, true, true, NOW()),
  ('93ae75c1-65e2-57cd-99a3-3a3f91cd5733', 'f0593164-55be-5867-98e7-8a86770a8dd0', 85, 1501, 'CPR & AED — Adult', '<h2>Lesson Overview</h2><p>Chest compressions, rescue breathing, AED operation for adults</p>', 30, true, true, NOW()),
  ('685318ed-cfd1-5381-b546-4cdeec132928', 'f0593164-55be-5867-98e7-8a86770a8dd0', 86, 1502, 'First Aid Basics', '<h2>Lesson Overview</h2><p>Bleeding control, shock, burns, heat/cold emergencies, and when to call 911</p>', 25, true, true, NOW()),
  ('30d609ca-1605-57ab-8864-8d81fc9f5707', 'f0593164-55be-5867-98e7-8a86770a8dd0', 87, 1503, 'CPR Skills Assessment', '<h2>Lab Exercise</h2><p>Hands-on CPR and AED practice on manikins — must demonstrate competency</p><p><strong>Type:</strong> Hands-on lab</p>', 45, true, true, NOW()),
  ('b7d10a5e-6896-524f-847c-f6e9978b144b', 'f0593164-55be-5867-98e7-8a86770a8dd0', 88, 1504, 'Rise Up — Customer Service & Sales', '<h2>Reading</h2><p>NRF Retail Industry Fundamentals: customer service, selling, and workplace skills</p>', NULL, true, true, NOW()),
  ('a7af0014-c14c-53c3-84df-cd3c0398e017', 'f0593164-55be-5867-98e7-8a86770a8dd0', 89, 1505, 'Rise Up Assessment', '<p>NRF Rise Up certification exam</p>', 30, true, true, NOW()),
  ('15d76752-0478-53f3-85c5-31c201cc9b09', 'f0593164-55be-5867-98e7-8a86770a8dd0', 90, 1601, 'HVAC Resume Workshop', '<h2>Assignment</h2><p>Build a trade-specific resume highlighting certifications, skills, and training hours</p>', NULL, true, true, NOW()),
  ('8c59f3f2-0ef4-5db2-a9fb-4ed571ae4d05', 'f0593164-55be-5867-98e7-8a86770a8dd0', 91, 1602, 'Interview Skills for Trades', '<h2>Lesson Overview</h2><p>Common HVAC interview questions, how to discuss certifications, and salary negotiation</p>', 20, true, true, NOW()),
  ('40da8479-1a3a-560c-bfce-16937d1b94db', 'f0593164-55be-5867-98e7-8a86770a8dd0', 92, 1603, 'Employer Partner Introductions', '<h2>Reading</h2><p>Overview of employer partners, OJT internship expectations, and placement process</p>', NULL, true, true, NOW()),
  ('b9bceecd-9ea5-5665-90e7-d5e01b3f7c7c', 'f0593164-55be-5867-98e7-8a86770a8dd0', 93, 1604, 'OJT Internship Orientation', '<h2>Lesson Overview</h2><p>What to expect during your employer internship, hour logging, and supervisor expectations</p>', 15, true, true, NOW()),
  ('ec1cbfea-55f5-5083-9a28-8d59248b676a', 'f0593164-55be-5867-98e7-8a86770a8dd0', 94, 1605, 'Program Completion Checklist', '<h2>Assignment</h2><p>Verify all certifications earned, hours logged, and placement readiness</p>', NULL, true, true, NOW());

-- 4. Verify
SELECT COUNT(*) AS lesson_count FROM training_lessons WHERE course_id_uuid = 'f0593164-55be-5867-98e7-8a86770a8dd0';
-- Expected: 94

-- 5. Verify lessons VIEW works
SELECT COUNT(*) AS view_count FROM lessons WHERE course_id = 'f0593164-55be-5867-98e7-8a86770a8dd0';
-- Expected: 94

