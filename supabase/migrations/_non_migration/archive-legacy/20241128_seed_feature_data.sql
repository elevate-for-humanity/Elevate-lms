-- ============================================================================
-- SEED DATA FOR CRITICAL LMS FEATURES
-- ============================================================================

-- ============================================================================
-- FORUM CATEGORIES
-- ============================================================================
INSERT INTO forum_categories (name, description, icon, order_index, is_active) VALUES
  ('General Discussion', 'General topics, introductions, and community chat', '💬', 1, true),
  ('Program Questions', 'Questions about specific training programs', '📚', 2, true),
  ('Technical Support', 'Get help with platform issues and technical problems', '🔧', 3, true),
  ('Success Stories', 'Share your achievements and inspire others', '🎉', 4, true),
  ('Career Advice', 'Job search tips, interview prep, and career guidance', '💼', 5, true),
  ('Study Groups', 'Find study partners and form learning groups', '👥', 6, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- BADGE DEFINITIONS
-- ============================================================================
INSERT INTO badge_definitions (name, description, icon_url, badge_type, criteria, points_reward, rarity, is_active) VALUES
  ('First Steps', 'Complete your first lesson', '/badges/first-steps.svg', 'completion', '{"lessons_completed": 1}', 10, 'common', true),
  ('Quick Learner', 'Complete 10 lessons', '/badges/quick-learner.svg', 'completion', '{"lessons_completed": 10}', 50, 'common', true),
  ('Dedicated Student', 'Complete 50 lessons', '/badges/dedicated.svg', 'completion', '{"lessons_completed": 50}', 200, 'rare', true),
  ('Week Warrior', 'Maintain a 7-day learning streak', '/badges/week-warrior.svg', 'streak', '{"streak_days": 7}', 50, 'rare', true),
  ('Month Master', 'Maintain a 30-day learning streak', '/badges/month-master.svg', 'streak', '{"streak_days": 30}', 300, 'epic', true),
  ('Quiz Ace', 'Score 100% on your first quiz', '/badges/quiz-ace.svg', 'mastery', '{"perfect_quizzes": 1}', 25, 'common', true),
  ('Quiz Master', 'Score 100% on 5 quizzes', '/badges/quiz-master.svg', 'mastery', '{"perfect_quizzes": 5}', 100, 'epic', true),
  ('Community Helper', 'Get 10 upvotes on forum replies', '/badges/helper.svg', 'social', '{"upvotes": 10}', 50, 'rare', true),
  ('Discussion Leader', 'Create 5 forum threads', '/badges/leader.svg', 'social', '{"threads_created": 5}', 75, 'rare', true),
  ('Course Completer', 'Complete your first program', '/badges/completer.svg', 'completion', '{"programs_completed": 1}', 500, 'epic', true),
  ('Career Ready', 'Complete 3 programs', '/badges/career-ready.svg', 'completion', '{"programs_completed": 3}', 1000, 'legendary', true),
  ('Early Bird', 'Log in before 7 AM', '/badges/early-bird.svg', 'special', '{"early_logins": 1}', 15, 'common', true),
  ('Night Owl', 'Log in after 10 PM', '/badges/night-owl.svg', 'special', '{"late_logins": 1}', 15, 'common', true),
  ('Resource Hunter', 'Download 20 resources', '/badges/resource-hunter.svg', 'completion', '{"resources_downloaded": 20}', 40, 'common', true),
  ('Peer Reviewer', 'Complete 5 peer reviews', '/badges/peer-reviewer.svg', 'social', '{"peer_reviews": 5}', 100, 'rare', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LEARNING PATHS
-- ============================================================================
INSERT INTO learning_paths (name, description, path_type, programs, estimated_weeks, difficulty, is_featured) VALUES
  (
    'Healthcare Career Track',
    'Start as a CNA and progress to advanced healthcare roles with this comprehensive pathway',
    'career_track',
    '["prog-cna", "prog-medical-assistant"]'::jsonb,
    16,
    'beginner',
    true
  ),
  (
    'Skilled Trades Mastery',
    'Master multiple skilled trades for maximum employability and earning potential',
    'career_track',
    '["prog-hvac", "prog-building-tech", "prog-electrical"]'::jsonb,
    32,
    'intermediate',
    true
  ),
  (
    'Beauty Professional Path',
    'Complete pathway from barber apprentice to licensed beauty educator',
    'career_track',
    '["prog-barber", "prog-nail-tech", "prog-esthetician"]'::jsonb,
    24,
    'beginner',
    true
  ),
  (
    'Business Essentials',
    'Build foundational business skills for office and administrative careers',
    'skill_based',
    '["prog-customer-service", "prog-it-support"]'::jsonb,
    12,
    'beginner',
    false
  ),
  (
    'Transportation Career',
    'Get your CDL and start a high-paying transportation career',
    'career_track',
    '["prog-cdl"]'::jsonb,
    8,
    'beginner',
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MILESTONES
-- ============================================================================
INSERT INTO milestones (name, description, milestone_type, criteria, celebration_message, animation_type, reward_points) VALUES
  (
    'Welcome Aboard',
    'Complete your profile',
    'first_lesson',
    '{"profile_completed": true}',
    '🎉 Welcome to Elevate! Your learning journey begins now!',
    'confetti',
    10
  ),
  (
    'First Lesson Complete',
    'Finish your first lesson',
    'first_lesson',
    '{"lessons_completed": 1}',
    '🎓 Great job! You completed your first lesson!',
    'celebration',
    25
  ),
  (
    'First Quiz Passed',
    'Pass your first quiz',
    'first_quiz',
    '{"quizzes_passed": 1}',
    '✅ Excellent! You passed your first quiz!',
    'success',
    25
  ),
  (
    'Week One Complete',
    'Learn for 7 consecutive days',
    'streak',
    '{"streak_days": 7}',
    '🔥 Amazing! You have a 7-day streak!',
    'fire',
    50
  ),
  (
    'Halfway There',
    'Complete 50% of a program',
    'completion',
    '{"progress_percentage": 50}',
    '🎯 You are halfway through! Keep going!',
    'progress',
    100
  ),
  (
    'Program Complete',
    'Finish your first program',
    'completion',
    '{"programs_completed": 1}',
    '🏆 Congratulations! You completed a program!',
    'trophy',
    500
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- RESUME TEMPLATES
-- ============================================================================
INSERT INTO resume_templates (name, description, preview_url, template_data, is_active) VALUES
  (
    'Professional',
    'Clean and professional template suitable for all industries',
    '/templates/professional-preview.jpg',
    '{"layout": "single-column", "font": "Arial", "colors": {"primary": "#2563eb", "secondary": "#64748b"}}'::jsonb,
    true
  ),
  (
    'Modern',
    'Contemporary design with bold headers and accent colors',
    '/templates/modern-preview.jpg',
    '{"layout": "two-column", "font": "Helvetica", "colors": {"primary": "#f97316", "secondary": "#475569"}}'::jsonb,
    true
  ),
  (
    'Classic',
    'Traditional format preferred by conservative industries',
    '/templates/classic-preview.jpg',
    '{"layout": "single-column", "font": "Times New Roman", "colors": {"primary": "#1e293b", "secondary": "#64748b"}}'::jsonb,
    true
  ),
  (
    'Creative',
    'Eye-catching design for creative professionals',
    '/templates/creative-preview.jpg',
    '{"layout": "two-column", "font": "Montserrat", "colors": {"primary": "#8b5cf6", "secondary": "#6366f1"}}'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE FORUM THREADS (for demonstration)
-- ============================================================================
-- Note: These would normally be created by users, but we'll add a few examples
-- You'll need to replace 'sample-user-id' with actual user IDs after users are created

-- ============================================================================
-- INSTRUCTOR PROFILES (for demonstration)
-- ============================================================================
-- Note: These would be created when instructors sign up
-- Example structure for reference:
-- INSERT INTO instructor_profiles (user_id, display_name, bio, specializations, is_active) VALUES
--   ('instructor-user-id', 'Jane Smith', 'Experienced CNA instructor with 10 years in healthcare', ARRAY['Healthcare', 'CNA', 'Patient Care'], true);

-- ============================================================================
-- COMPLETION MESSAGES
-- ============================================================================
COMMENT ON TABLE milestones IS 'Defines achievement milestones that trigger celebrations';
COMMENT ON TABLE badge_definitions IS 'Defines all available badges students can earn';
COMMENT ON TABLE learning_paths IS 'Curated sequences of programs for career progression';
COMMENT ON TABLE forum_categories IS 'Categories for organizing community discussions';
COMMENT ON TABLE resume_templates IS 'Pre-designed resume templates for students';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Feature seed data loaded successfully!';
  RAISE NOTICE '📊 Loaded:';
  RAISE NOTICE '   - 6 Forum Categories';
  RAISE NOTICE '   - 15 Badge Definitions';
  RAISE NOTICE '   - 5 Learning Paths';
  RAISE NOTICE '   - 6 Milestones';
  RAISE NOTICE '   - 4 Resume Templates';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your LMS is now ready with all critical features!';
END $$;
