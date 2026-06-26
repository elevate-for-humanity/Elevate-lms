-- ============================================
-- ADD DEVIN SWANSON PAYMENT PLAN & WORKBOOKS
-- ============================================

-- 1. ADD PAYMENT PLAN - DEVIN SWANSON
-- Tuition: $4,980 | Down: $400 (due in 2 weeks) | Weekly: $150 | Increases at end
INSERT INTO barber_subscriptions (
  user_id,
  full_tuition_amount,
  amount_paid_at_checkout,
  weekly_payment_cents,
  remaining_balance,
  payment_status,
  stripe_subscription_id,
  fully_paid,
  setup_fee_paid,
  next_payment_date,
  enrollment_date,
  created_at
)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'Dawgchopz@icloud.com'),
  498000,          -- $4,980 total tuition (in cents)
  0,               -- $0 paid at checkout (paying in 2 weeks)
  15000,           -- $150 weekly payment (in cents)
  498000,          -- $4,980 remaining (will subtract $400 down payment when received)
  'pending_payment_method',  -- waiting for payment setup
  NULL,            -- no stripe subscription yet
  false,           -- not fully paid
  false,           -- setup fee not paid yet (will pay $400 in 2 weeks)
  '2026-07-10',   -- next payment date: 2 weeks from Monday 6/29
  '2026-06-29',   -- start date: Monday
  NOW()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'Dawgchopz@icloud.com')
AND NOT EXISTS (SELECT 1 FROM barber_subscriptions WHERE user_id = (SELECT id FROM auth.users WHERE email = 'Dawgchopz@icloud.com'));

-- 2. ADD BARBER WORKBOOK ACCESS FOR DEVIN
-- The barber apprenticeship requires completing 2000 hours with specific competencies
INSERT INTO barber_workbook_progress (
  user_id,
  section_1_haircutting_completed,
  section_1_haircutting_notes,
  section_2_shaving_completed,
  section_2_shaving_notes,
  section_3_styling_completed,
  section_3_styling_notes,
  section_4_chemicals_completed,
  section_4_chemicals_notes,
  section_5_sanitation_completed,
  section_5_sanitation_notes,
  section_6_customer_service_completed,
  section_6_customer_service_notes,
  total_hours_logged,
  mentor_verified_hours,
  status,
  created_at
)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'Dawgchopz@icloud.com'),
  false, NULL,
  false, NULL,
  false, NULL,
  false, NULL,
  false, NULL,
  false, NULL,
  0,  -- starting hours
  0,  -- no verified hours yet
  'in_progress',
  NOW()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'Dawgchopz@icloud.com')
AND NOT EXISTS (SELECT 1 FROM barber_workbook_progress WHERE user_id = (SELECT id FROM auth.users WHERE email = 'Dawgchopz@icloud.com'));

-- 3. ADD REQUIRED WORKBOOK SECTIONS (if not exists)
-- These are the DOL Appendix A required competencies
DO $$
BEGIN
  -- Section 1: Haircutting (1500 hours required)
  INSERT INTO workbook_sections (name, description, required_hours, category, sort_order)
  VALUES ('Haircutting & Styling', 'Basic to advanced haircutting techniques', 1500, 'barber', 1)
  ON CONFLICT DO NOTHING;
  
  -- Section 2: Shaving & Facial Hair
  INSERT INTO workbook_sections (name, description, required_hours, category, sort_order)
  VALUES ('Shaving & Facial Hair', 'Classic shaving and beard grooming', 200, 'barber', 2)
  ON CONFLICT DO NOTHING;
  
  -- Section 3: Chemical Services
  INSERT INTO workbook_sections (name, description, required_hours, category, sort_order)
  VALUES ('Chemical Services', 'Hair coloring, perms, and relaxing', 150, 'barber', 3)
  ON CONFLICT DO NOTHING;
  
  -- Section 4: Sanitation & Safety
  INSERT INTO workbook_sections (name, description, required_hours, category, sort_order)
  VALUES ('Sanitation & Safety', 'infection control and safety protocols', 50, 'barber', 4)
  ON CONFLICT DO NOTHING;
  
  -- Section 5: Customer Service
  INSERT INTO workbook_sections (name, description, required_hours, category, sort_order)
  VALUES ('Customer Service', 'Professional conduct and client relations', 100, 'barber', 5)
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Workbook sections created';
END $$;

-- 4. ENROLL DEVIN IN BARBER COURSE (if courses table exists)
INSERT INTO course_enrollments (
  user_id,
  course_id,
  status,
  enrolled_at,
  progress_percent
)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'Dawgchopz@icloud.com'),
  (SELECT id FROM courses WHERE slug ILIKE '%barber%' LIMIT 1),
  'active',
  NOW(),
  0
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'Dawgchopz@icloud.com')
AND EXISTS (SELECT 1 FROM courses WHERE slug ILIKE '%barber%')
AND NOT EXISTS (
  SELECT 1 FROM course_enrollments 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'Dawgchopz@icloud.com')
);

-- 5. ADD NOTIFICATION ABOUT PAYMENT
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  action_url,
  action_label,
  metadata,
  created_at
)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'Dawgchopz@icloud.com'),
  'payment_reminder',
  'Payment Due in 2 Weeks',
  'Your $400 down payment is due on July 10, 2026. After that, weekly payments of $150 will begin. Payments will increase towards the end of your program.',
  '/apprentice/billing',
  'Setup Payment',
  '{"payment_type": "down_payment", "amount": 400, "due_date": "2026-07-10"}'::jsonb,
  NOW()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'Dawgchopz@icloud.com');

-- 6. VERIFY EVERYTHING
SELECT '=== DEVIN SWANSON - COMPLETE SETUP ===' as section;
SELECT 
  p.full_name as name, 
  p.email, 
  s.name as shop,
  bs.full_tuition_amount / 100 as tuition_total,
  bs.weekly_payment_cents / 100 as weekly_payment,
  'Due: July 10, 2026' as down_payment_due,
  bw.status as workbook_status
FROM profiles p
JOIN apprentices a ON a.user_id = p.id
JOIN shops s ON s.id = a.shop_id
LEFT JOIN barber_subscriptions bs ON bs.user_id = p.id
LEFT JOIN barber_workbook_progress bw ON bw.user_id = p.id
WHERE p.email = 'Dawgchopz@icloud.com';
