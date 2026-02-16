-- Component Registry: Track all UI components for feature management
-- This enables feature flags, usage analytics, and dynamic component loading

CREATE TABLE IF NOT EXISTS component_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Component identification
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  file_path VARCHAR(500) NOT NULL,
  
  -- Categorization
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  
  -- Feature management
  is_enabled BOOLEAN DEFAULT true,
  is_beta BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  required_role VARCHAR(50), -- null = public, or: student, staff, admin, employer
  
  -- Metadata
  description TEXT,
  documentation_url VARCHAR(500),
  screenshot_url VARCHAR(500),
  
  -- Dependencies
  dependencies TEXT[] DEFAULT '{}', -- other component slugs this depends on
  required_packages TEXT[] DEFAULT '{}', -- npm packages required
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Versioning
  version VARCHAR(20) DEFAULT '1.0.0',
  deprecated BOOLEAN DEFAULT false,
  deprecated_message TEXT,
  replacement_slug VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_component_registry_category ON component_registry(category);
CREATE INDEX idx_component_registry_enabled ON component_registry(is_enabled);
CREATE INDEX idx_component_registry_tags ON component_registry USING GIN(tags);

-- Component usage tracking per page
CREATE TABLE IF NOT EXISTS component_page_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES component_registry(id) ON DELETE CASCADE,
  page_path VARCHAR(500) NOT NULL,
  props JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(component_id, page_path)
);

-- Feature flags for components
CREATE TABLE IF NOT EXISTS component_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES component_registry(id) ON DELETE CASCADE,
  flag_name VARCHAR(100) NOT NULL,
  flag_value BOOLEAN DEFAULT false,
  conditions JSONB DEFAULT '{}', -- e.g., {"user_role": "admin", "percentage": 50}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(component_id, flag_name)
);

-- A/B test variants for components
CREATE TABLE IF NOT EXISTS component_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES component_registry(id) ON DELETE CASCADE,
  variant_name VARCHAR(100) NOT NULL,
  variant_file_path VARCHAR(500) NOT NULL,
  traffic_percentage INTEGER DEFAULT 0 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
  is_active BOOLEAN DEFAULT false,
  metrics JSONB DEFAULT '{}', -- conversion rates, engagement, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE component_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_page_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_variants ENABLE ROW LEVEL SECURITY;

-- Public read access for component registry
CREATE POLICY "Public can view enabled components" ON component_registry
  FOR SELECT USING (is_enabled = true);

-- Admin full access
CREATE POLICY "Admins can manage components" ON component_registry
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage page usage" ON component_page_usage
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage feature flags" ON component_feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage variants" ON component_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_component_usage(component_slug VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE component_registry 
  SET usage_count = usage_count + 1,
      last_used_at = NOW(),
      updated_at = NOW()
  WHERE slug = component_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert all components into registry
INSERT INTO component_registry (name, slug, file_path, category, subcategory, description, tags) VALUES

-- AI Components
('AI Assistant Bubble', 'ai-assistant-bubble', 'components/AIAssistantBubble.tsx', 'ai', 'assistant', 'Floating AI chat assistant bubble', ARRAY['ai', 'chat', 'assistant']),
('AI Career Counseling', 'ai-career-counseling', 'components/AICareerCounseling.tsx', 'ai', 'career', 'AI-powered career guidance and recommendations', ARRAY['ai', 'career', 'counseling']),
('AI Instructor', 'ai-instructor', 'components/AIInstructor.tsx', 'ai', 'learning', 'AI instructor for course content', ARRAY['ai', 'instructor', 'learning']),
('AI Instructor Panel', 'ai-instructor-panel', 'components/AIInstructorPanel.tsx', 'ai', 'learning', 'Panel interface for AI instructor', ARRAY['ai', 'instructor', 'panel']),
('AI Instructor Widget', 'ai-instructor-widget', 'components/AIInstructorWidget.tsx', 'ai', 'learning', 'Compact AI instructor widget', ARRAY['ai', 'instructor', 'widget']),
('AI Page Builder', 'ai-page-builder', 'components/AIPageBuilder.tsx', 'ai', 'builder', 'AI-assisted page creation tool', ARRAY['ai', 'builder', 'pages']),
('AR Training Modules', 'ar-training-modules', 'components/ARTrainingModules.tsx', 'ai', 'training', 'Augmented reality training experiences', ARRAY['ar', 'training', 'immersive']),

-- Analytics Components
('Analytics Dashboard', 'analytics-dashboard', 'components/AnalyticsDashboard.tsx', 'analytics', 'dashboard', 'Main analytics dashboard', ARRAY['analytics', 'dashboard', 'metrics']),
('Admin Reporting Dashboard', 'admin-reporting-dashboard', 'components/AdminReportingDashboard.tsx', 'analytics', 'admin', 'Administrative reporting interface', ARRAY['analytics', 'admin', 'reports']),
('Student Engagement Analytics', 'student-engagement-analytics', 'components/StudentEngagementAnalytics.tsx', 'analytics', 'engagement', 'Track student engagement metrics', ARRAY['analytics', 'engagement', 'students']),
('Learning Analytics Dashboard', 'learning-analytics-dashboard', 'components/LearningAnalyticsDashboard.tsx', 'analytics', 'learning', 'Learning progress analytics', ARRAY['analytics', 'learning', 'progress']),
('Instructor Performance Dashboard', 'instructor-performance-dashboard', 'components/InstructorPerformanceDashboard.tsx', 'analytics', 'instructor', 'Instructor performance metrics', ARRAY['analytics', 'instructor', 'performance']),

-- Authentication Components
('Protected Route', 'protected-route', 'components/auth/ProtectedRoute.tsx', 'auth', 'routing', 'Route protection wrapper', ARRAY['auth', 'routing', 'security']),
('Require Role', 'require-role', 'components/auth/RequireRole.tsx', 'auth', 'authorization', 'Role-based access control', ARRAY['auth', 'role', 'access']),
('Loading Timeout', 'loading-timeout', 'components/auth/LoadingTimeout.tsx', 'auth', 'loading', 'Auth loading state with timeout', ARRAY['auth', 'loading', 'timeout']),

-- Certificate Components
('Certificate Download', 'certificate-download', 'components/CertificateDownload.tsx', 'certificates', 'download', 'Download certificate as PDF', ARRAY['certificate', 'download', 'pdf']),
('Certificate Generator', 'certificate-generator', 'components/CertificateGenerator.tsx', 'certificates', 'generator', 'Generate completion certificates', ARRAY['certificate', 'generator', 'completion']),
('Blockchain Credential Verification', 'blockchain-credential-verification', 'components/BlockchainCredentialVerification.tsx', 'certificates', 'blockchain', 'Verify credentials on blockchain', ARRAY['certificate', 'blockchain', 'verification']),
('Micro Credentials Badges', 'micro-credentials-badges', 'components/MicroCredentialsBadges.tsx', 'certificates', 'badges', 'Display micro-credential badges', ARRAY['certificate', 'badges', 'micro-credentials']),

-- Communication Components
('Announcements System', 'announcements-system', 'components/communication/AnnouncementsSystem.tsx', 'communication', 'announcements', 'System-wide announcements', ARRAY['communication', 'announcements', 'notifications']),
('Live Chat Support', 'live-chat-support', 'components/LiveChatSupport.tsx', 'communication', 'chat', 'Real-time chat support', ARRAY['communication', 'chat', 'support']),
('Notification Center', 'notification-center', 'components/NotificationCenter.tsx', 'communication', 'notifications', 'User notification center', ARRAY['communication', 'notifications', 'alerts']),
('SMS Notification System', 'sms-notification-system', 'components/SMSNotificationSystem.tsx', 'communication', 'sms', 'SMS notification delivery', ARRAY['communication', 'sms', 'notifications']),
('Email Campaign Manager', 'email-campaign-manager', 'components/EmailCampaignManager.tsx', 'communication', 'email', 'Email campaign management', ARRAY['communication', 'email', 'campaigns']),

-- Compliance Components
('Compliance Badges', 'compliance-badges', 'components/ComplianceBadges.tsx', 'compliance', 'badges', 'Display compliance certifications', ARRAY['compliance', 'badges', 'certifications']),
('Pathway Disclosure', 'pathway-disclosure', 'components/compliance/PathwayDisclosure.tsx', 'compliance', 'disclosure', 'Program pathway disclosures', ARRAY['compliance', 'disclosure', 'pathways']),
('WIOA Compliance Dashboard', 'wioa-compliance-dashboard', 'components/admin/WIOAComplianceDashboard.tsx', 'compliance', 'wioa', 'WIOA compliance tracking', ARRAY['compliance', 'wioa', 'workforce']),
('Cookie Consent Banner', 'cookie-consent-banner', 'components/compliance/CookieConsentBanner.tsx', 'compliance', 'privacy', 'GDPR cookie consent', ARRAY['compliance', 'cookies', 'gdpr']),

-- Course Components
('Course Catalog', 'course-catalog', 'components/CourseCatalog.tsx', 'course', 'catalog', 'Browse available courses', ARRAY['course', 'catalog', 'browse']),
('Course Progress', 'course-progress', 'components/CourseProgress.tsx', 'course', 'progress', 'Track course completion', ARRAY['course', 'progress', 'tracking']),
('Course Reviews', 'course-reviews', 'components/CourseReviews.tsx', 'course', 'reviews', 'Student course reviews', ARRAY['course', 'reviews', 'ratings']),
('Course Completion Tracking', 'course-completion-tracking', 'components/CourseCompletionTracking.tsx', 'course', 'completion', 'Track course completions', ARRAY['course', 'completion', 'tracking']),
('Course Prerequisite Management', 'course-prerequisite-management', 'components/CoursePrerequisiteManagement.tsx', 'course', 'prerequisites', 'Manage course prerequisites', ARRAY['course', 'prerequisites', 'requirements']),
('Universal Course Player', 'universal-course-player', 'components/UniversalCoursePlayer.tsx', 'course', 'player', 'Multi-format course player', ARRAY['course', 'player', 'video']),
('SCORM Player', 'scorm-player', 'components/scorm/SCORMPlayer.tsx', 'course', 'scorm', 'SCORM content player', ARRAY['course', 'scorm', 'player']),

-- Dashboard Components
('Activity Feed', 'activity-feed', 'components/dashboard/ActivityFeed.tsx', 'dashboard', 'feed', 'Recent activity stream', ARRAY['dashboard', 'activity', 'feed']),
('Progress Chart', 'progress-chart', 'components/dashboard/ProgressChart.tsx', 'dashboard', 'charts', 'Visual progress charts', ARRAY['dashboard', 'progress', 'charts']),
('Dashboard Stats Grid', 'dashboard-stats-grid', 'components/dashboard/DashboardStatsGrid.tsx', 'dashboard', 'stats', 'Key metrics grid', ARRAY['dashboard', 'stats', 'metrics']),
('Global Leaderboard', 'global-leaderboard', 'components/dashboard/GlobalLeaderboard.tsx', 'dashboard', 'gamification', 'Platform-wide leaderboard', ARRAY['dashboard', 'leaderboard', 'gamification']),
('Upcoming Calendar', 'upcoming-calendar', 'components/dashboard/UpcomingCalendar.tsx', 'dashboard', 'calendar', 'Upcoming events calendar', ARRAY['dashboard', 'calendar', 'events']),
('Enhanced Dashboard', 'enhanced-dashboard', 'components/EnhancedDashboard.tsx', 'dashboard', 'main', 'Feature-rich dashboard', ARRAY['dashboard', 'enhanced', 'main']),

-- Employer Components
('Employer Talent Pipeline', 'employer-talent-pipeline', 'components/EmployerTalentPipeline.tsx', 'employer', 'talent', 'Talent pipeline management', ARRAY['employer', 'talent', 'pipeline']),
('Employer Workforce Analytics', 'employer-workforce-analytics', 'components/EmployerWorkforceAnalytics.tsx', 'employer', 'analytics', 'Workforce analytics for employers', ARRAY['employer', 'analytics', 'workforce']),
('Industry Partnership Portal', 'industry-partnership-portal', 'components/IndustryPartnershipPortal.tsx', 'employer', 'partnerships', 'Industry partner management', ARRAY['employer', 'partnerships', 'industry']),
('Virtual Career Fair', 'virtual-career-fair', 'components/VirtualCareerFair.tsx', 'employer', 'careers', 'Virtual career fair platform', ARRAY['employer', 'careers', 'virtual']),
('Job Placement Tracking', 'job-placement-tracking', 'components/JobPlacementTracking.tsx', 'employer', 'placement', 'Track job placements', ARRAY['employer', 'placement', 'jobs']),

-- Enrollment Components
('Application Form', 'application-form', 'components/ApplicationForm.tsx', 'enrollment', 'application', 'Program application form', ARRAY['enrollment', 'application', 'form']),
('Eligibility Checker', 'eligibility-checker', 'components/for-you/EligibilityChecker.tsx', 'enrollment', 'eligibility', 'Check program eligibility', ARRAY['enrollment', 'eligibility', 'checker']),
('Enrollment Process', 'enrollment-process', 'components/EnrollmentProcess.tsx', 'enrollment', 'process', 'Step-by-step enrollment', ARRAY['enrollment', 'process', 'steps']),
('Quick Enrollment Form', 'quick-enrollment-form', 'components/QuickEnrollmentForm.tsx', 'enrollment', 'quick', 'Simplified enrollment form', ARRAY['enrollment', 'quick', 'form']),
('Financial Aid Calculator', 'financial-aid-calculator', 'components/FinancialAidCalculator.tsx', 'enrollment', 'financial', 'Calculate financial aid', ARRAY['enrollment', 'financial', 'calculator']),
('Grant Scholarship Application', 'grant-scholarship-application', 'components/GrantScholarshipApplication.tsx', 'enrollment', 'scholarships', 'Apply for scholarships', ARRAY['enrollment', 'scholarships', 'grants']),

-- Form Components
('Signature Pad', 'signature-pad', 'components/SignaturePad.tsx', 'forms', 'signature', 'Digital signature capture', ARRAY['forms', 'signature', 'input']),
('Advanced File Upload', 'advanced-file-upload', 'components/upload/AdvancedFileUpload.tsx', 'forms', 'upload', 'Multi-file upload with preview', ARRAY['forms', 'upload', 'files']),
('Captcha', 'captcha', 'components/Captcha.tsx', 'forms', 'security', 'Bot protection captcha', ARRAY['forms', 'captcha', 'security']),
('Turnstile Widget', 'turnstile-widget', 'components/forms/TurnstileWidget.tsx', 'forms', 'security', 'Cloudflare Turnstile captcha', ARRAY['forms', 'turnstile', 'security']),

-- Gamification Components
('Achievements Badges', 'achievements-badges', 'components/AchievementsBadges.tsx', 'gamification', 'achievements', 'Display earned achievements', ARRAY['gamification', 'achievements', 'badges']),
('Leaderboard', 'leaderboard', 'components/Leaderboard.tsx', 'gamification', 'leaderboard', 'Competition leaderboard', ARRAY['gamification', 'leaderboard', 'competition']),
('Competency Tracking', 'competency-tracking', 'components/CompetencyTracking.tsx', 'gamification', 'competency', 'Track skill competencies', ARRAY['gamification', 'competency', 'skills']),
('Confetti', 'confetti', 'components/Confetti.tsx', 'gamification', 'celebration', 'Celebration confetti effect', ARRAY['gamification', 'confetti', 'celebration']),

-- Layout Components
('Site Header', 'site-header', 'components/layout/SiteHeader.tsx', 'layout', 'header', 'Main site header', ARRAY['layout', 'header', 'navigation']),
('Site Footer', 'site-footer', 'components/layout/SiteFooter.tsx', 'layout', 'footer', 'Main site footer', ARRAY['layout', 'footer', 'links']),
('Conditional Layout', 'conditional-layout', 'components/layout/ConditionalLayout.tsx', 'layout', 'conditional', 'Context-aware layout', ARRAY['layout', 'conditional', 'responsive']),
('Admin Nav', 'admin-nav', 'components/AdminNav.tsx', 'layout', 'navigation', 'Admin navigation menu', ARRAY['layout', 'admin', 'navigation']),

-- LMS Components
('Content Library', 'content-library', 'components/lms/ContentLibrary.tsx', 'lms', 'content', 'Course content library', ARRAY['lms', 'content', 'library']),
('Attendance Tracker', 'attendance-tracker', 'components/lms/AttendanceTracker.tsx', 'lms', 'attendance', 'Track student attendance', ARRAY['lms', 'attendance', 'tracking']),
('Discussion Forum', 'discussion-forum', 'components/DiscussionForum.tsx', 'lms', 'discussion', 'Course discussion forums', ARRAY['lms', 'discussion', 'forum']),
('Peer Review', 'peer-review', 'components/PeerReview.tsx', 'lms', 'peer', 'Peer review assignments', ARRAY['lms', 'peer', 'review']),
('Real Time Collaboration', 'real-time-collaboration', 'components/RealTimeCollaboration.tsx', 'lms', 'collaboration', 'Real-time document collaboration', ARRAY['lms', 'collaboration', 'realtime']),
('Assignment Submission', 'assignment-submission', 'components/AssignmentSubmission.tsx', 'lms', 'assignments', 'Submit assignments', ARRAY['lms', 'assignments', 'submission']),
('Note Taking', 'note-taking', 'components/NoteTaking.tsx', 'lms', 'notes', 'In-course note taking', ARRAY['lms', 'notes', 'study']),
('Tutorial System', 'tutorial-system', 'components/TutorialSystem.tsx', 'lms', 'tutorials', 'Interactive tutorials', ARRAY['lms', 'tutorials', 'learning']),

-- Marketing Components
('Hero Banner', 'hero-banner', 'components/HeroBanner.tsx', 'marketing', 'hero', 'Page hero banner', ARRAY['marketing', 'hero', 'banner']),
('Video Hero Banner', 'video-hero-banner', 'components/VideoHeroBanner.tsx', 'marketing', 'hero', 'Video background hero', ARRAY['marketing', 'hero', 'video']),
('Testimonial Carousel', 'testimonial-carousel', 'components/TestimonialCarousel.tsx', 'marketing', 'testimonials', 'Rotating testimonials', ARRAY['marketing', 'testimonials', 'carousel']),
('Trust Badges', 'trust-badges', 'components/TrustBadges.tsx', 'marketing', 'trust', 'Trust and certification badges', ARRAY['marketing', 'trust', 'badges']),
('Social Proof', 'social-proof', 'components/SocialProof.tsx', 'marketing', 'social', 'Social proof indicators', ARRAY['marketing', 'social', 'proof']),
('Newsletter Signup', 'newsletter-signup', 'components/NewsletterSignup.tsx', 'marketing', 'newsletter', 'Email newsletter signup', ARRAY['marketing', 'newsletter', 'email']),
('Video Testimonials', 'video-testimonials', 'components/VideoTestimonials.tsx', 'marketing', 'testimonials', 'Video testimonial player', ARRAY['marketing', 'testimonials', 'video']),

-- Mobile Components
('Bottom Nav', 'bottom-nav', 'components/BottomNav.tsx', 'mobile', 'navigation', 'Mobile bottom navigation', ARRAY['mobile', 'navigation', 'bottom']),
('Offline Banner', 'offline-banner', 'components/mobile/OfflineBanner.tsx', 'mobile', 'offline', 'Offline status indicator', ARRAY['mobile', 'offline', 'pwa']),
('Mobile Course Card', 'mobile-course-card', 'components/mobile/MobileCourseCard.tsx', 'mobile', 'course', 'Mobile-optimized course card', ARRAY['mobile', 'course', 'card']),
('Mobile Video Player', 'mobile-video-player', 'components/mobile/MobileVideoPlayer.tsx', 'mobile', 'video', 'Mobile video player', ARRAY['mobile', 'video', 'player']),
('Video Download Button', 'video-download-button', 'components/mobile/VideoDownloadButton.tsx', 'mobile', 'download', 'Download video for offline', ARRAY['mobile', 'download', 'offline']),

-- Payment Components
('Enrollment Payment Widget', 'enrollment-payment-widget', 'components/EnrollmentPaymentWidget.tsx', 'payment', 'enrollment', 'Payment during enrollment', ARRAY['payment', 'enrollment', 'checkout']),
('Subscription Manager', 'subscription-manager', 'components/SubscriptionManager.tsx', 'payment', 'subscription', 'Manage subscriptions', ARRAY['payment', 'subscription', 'billing']),
('Buy Now Button', 'buy-now-button', 'components/BuyNowButton.tsx', 'payment', 'purchase', 'Quick purchase button', ARRAY['payment', 'purchase', 'button']),
('Stripe Pay Now', 'stripe-pay-now', 'components/payments/StripePayNow.tsx', 'payment', 'stripe', 'Stripe payment button', ARRAY['payment', 'stripe', 'checkout']),

-- Scheduling Components
('Calendar Widget', 'calendar-widget', 'components/CalendarWidget.tsx', 'scheduling', 'calendar', 'Interactive calendar', ARRAY['scheduling', 'calendar', 'widget']),
('Calendar Integration', 'calendar-integration', 'components/CalendarIntegration.tsx', 'scheduling', 'integration', 'External calendar sync', ARRAY['scheduling', 'calendar', 'integration']),
('Google Classroom Sync', 'google-classroom-sync', 'components/GoogleClassroomSync.tsx', 'scheduling', 'google', 'Google Classroom integration', ARRAY['scheduling', 'google', 'classroom']),

-- Social Components
('Social Learning Community', 'social-learning-community', 'components/SocialLearningCommunity.tsx', 'social', 'community', 'Learning community features', ARRAY['social', 'community', 'learning']),
('Peer Tutoring Marketplace', 'peer-tutoring-marketplace', 'components/PeerTutoringMarketplace.tsx', 'social', 'tutoring', 'Peer tutoring connections', ARRAY['social', 'tutoring', 'marketplace']),
('Referral Dashboard', 'referral-dashboard', 'components/ReferralDashboard.tsx', 'social', 'referrals', 'Track referrals', ARRAY['social', 'referrals', 'dashboard']),

-- Support Components
('Feedback Widget', 'feedback-widget', 'components/FeedbackWidget.tsx', 'support', 'feedback', 'User feedback collection', ARRAY['support', 'feedback', 'widget']),
('Support Ticket Form', 'support-ticket-form', 'components/support/SupportTicketForm.tsx', 'support', 'tickets', 'Submit support tickets', ARRAY['support', 'tickets', 'form']),
('Live Chat Widget', 'live-chat-widget', 'components/support/LiveChatWidget.tsx', 'support', 'chat', 'Live chat support widget', ARRAY['support', 'chat', 'live']),

-- Video Components
('Advanced Video Player', 'advanced-video-player', 'components/AdvancedVideoPlayer.tsx', 'video', 'player', 'Feature-rich video player', ARRAY['video', 'player', 'advanced']),
('Video Background', 'video-background', 'components/VideoBackground.tsx', 'video', 'background', 'Video background element', ARRAY['video', 'background', 'hero']),
('Video Conferencing Integration', 'video-conferencing-integration', 'components/VideoConferencingIntegration.tsx', 'video', 'conferencing', 'Video call integration', ARRAY['video', 'conferencing', 'calls']),
('Live Streaming Classroom', 'live-streaming-classroom', 'components/LiveStreamingClassroom.tsx', 'video', 'streaming', 'Live class streaming', ARRAY['video', 'streaming', 'live']),
('Voiceover Player', 'voiceover-player', 'components/VoiceoverPlayer.tsx', 'video', 'voiceover', 'Audio voiceover player', ARRAY['video', 'voiceover', 'audio']),

-- Workforce Components
('Skills Gap Analysis', 'skills-gap-analysis', 'components/SkillsGapAnalysis.tsx', 'workforce', 'skills', 'Identify skill gaps', ARRAY['workforce', 'skills', 'analysis']),
('Program Outcomes Tracker', 'program-outcomes-tracker', 'components/ProgramOutcomesTracker.tsx', 'workforce', 'outcomes', 'Track program outcomes', ARRAY['workforce', 'outcomes', 'tracking']),
('Student Success Coaching', 'student-success-coaching', 'components/StudentSuccessCoaching.tsx', 'workforce', 'coaching', 'Success coaching tools', ARRAY['workforce', 'coaching', 'success']),
('Adaptive Learning', 'adaptive-learning', 'components/AdaptiveLearning.tsx', 'workforce', 'adaptive', 'Personalized learning paths', ARRAY['workforce', 'adaptive', 'personalized']),
('Adaptive Learning Path', 'adaptive-learning-path', 'components/AdaptiveLearningPath.tsx', 'workforce', 'adaptive', 'Dynamic learning pathways', ARRAY['workforce', 'adaptive', 'pathways'])

ON CONFLICT (slug) DO UPDATE SET
  file_path = EXCLUDED.file_path,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  updated_at = NOW();

-- Create view for easy component lookup
CREATE OR REPLACE VIEW component_catalog AS
SELECT 
  cr.id,
  cr.name,
  cr.slug,
  cr.file_path,
  cr.category,
  cr.subcategory,
  cr.description,
  cr.tags,
  cr.is_enabled,
  cr.is_beta,
  cr.is_premium,
  cr.required_role,
  cr.usage_count,
  cr.last_used_at,
  cr.version,
  cr.deprecated,
  COUNT(cpu.id) as pages_using,
  ARRAY_AGG(DISTINCT cpu.page_path) FILTER (WHERE cpu.page_path IS NOT NULL) as used_on_pages
FROM component_registry cr
LEFT JOIN component_page_usage cpu ON cr.id = cpu.component_id
GROUP BY cr.id;

-- Grant access to the view
GRANT SELECT ON component_catalog TO authenticated;
GRANT SELECT ON component_catalog TO anon;
