import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Get unused tables from previous analysis
const unusedTables = [
  'forum_categories',
  'forum_threads',
  'forum_posts',
  'forum_replies',
  'forum_votes',
  'badges',
  'badge_definitions',
  'leaderboards',
  'achievements',
  'streaks',
  'peer_reviews',
  'peer_review_assignments',
  'peer_review_rubrics',
  'study_groups',
  'study_group_members',
  'study_group_sessions',
  'instructor_qa',
  'qa_questions',
  'qa_answers',
  'qa_votes',
  'resource_downloads',
  'resource_library',
  'resource_categories',
  'ojt_logs',
  'ojt_hours',
  'ojt_supervisors',
  'ojt_evaluations',
  'sso_providers',
  'sso_connections',
  'sso_login_attempts',
  'apprentice_hours_log',
  'apprentice_notifications',
  'apprentice_payroll',
  'academic_integrity_violations',
  'accessibility_settings',
  'adaptive_learning_paths',
  'ai_chat_messages',
  'ai_chat_context',
  'alert_notifications',
  'alert_thresholds',
  'api_request_logs',
  'assignment_submissions',
  'assignments',
  'attendance_records',
  'benefits_enrollments',
  'benefits_plans',
  'billing_cycles',
  'call_requests',
  'callback_requests',
  'chat_conversations',
  'chat_messages',
  'cobra_enrollments',
  'competencies',
  'competency_evidence',
  'complaints',
  'content_library',
  'course_recommendations',
  'course_syllabi',
  'course_templates',
  'credentialing_partners',
  'credentials',
  'credentials_attained',
  'cross_tenant_access',
  'daily_activities',
  'data_retention_policies',
  'departments',
  'direct_deposit_accounts',
  'dmca_takedown_requests',
  'ecr_snapshots',
  'email_notifications',
  'employee_documents',
  'employee_goals',
  'employees',
  'employment_outcomes',
  'event_registrations',
  'events',
  'external_lms_enrollments',
  'external_module_progress',
  'failed_login_attempts',
  'gamification_rules',
  'goal_templates',
  'grade_appeals',
  'grading_rubrics',
];

// Group by feature category
const features = {
  'Forum System': {
    tables: ['forum_categories', 'forum_threads', 'forum_posts', 'forum_replies', 'forum_votes'],
    priority: 'HIGH',
    effort: '2-3 weeks',
    value: 'Student engagement, peer learning',
  },
  Gamification: {
    tables: ['badges', 'badge_definitions', 'leaderboards', 'achievements', 'streaks'],
    priority: 'HIGH',
    effort: '2-3 weeks',
    value: 'Increase completion rates, motivation',
  },
  'Peer Reviews': {
    tables: ['peer_reviews', 'peer_review_assignments', 'peer_review_rubrics'],
    priority: 'MEDIUM',
    effort: '1-2 weeks',
    value: 'Collaborative learning, assessment',
  },
  'Study Groups': {
    tables: ['study_groups', 'study_group_members', 'study_group_sessions'],
    priority: 'MEDIUM',
    effort: '1-2 weeks',
    value: 'Peer support, retention',
  },
  'Instructor Q&A': {
    tables: ['instructor_qa', 'qa_questions', 'qa_answers', 'qa_votes'],
    priority: 'HIGH',
    effort: '1-2 weeks',
    value: 'Student support, reduce instructor load',
  },
  'Resource Library': {
    tables: ['resource_downloads', 'resource_library', 'resource_categories'],
    priority: 'MEDIUM',
    effort: '1 week',
    value: 'Additional learning materials',
  },
  'OJT Tracking': {
    tables: ['ojt_logs', 'ojt_hours', 'ojt_supervisors', 'ojt_evaluations'],
    priority: 'HIGH',
    effort: '2 weeks',
    value: 'Apprenticeship compliance, tracking',
  },
  'SSO/Authentication': {
    tables: ['sso_providers', 'sso_connections', 'sso_login_attempts'],
    priority: 'LOW',
    effort: '2-3 weeks',
    value: 'Enterprise integration',
  },
  'Apprentice Management': {
    tables: ['apprentice_hours_log', 'apprentice_notifications', 'apprentice_payroll'],
    priority: 'HIGH',
    effort: '3-4 weeks',
    value: 'Apprenticeship program management',
  },
  'Assignments & Grading': {
    tables: ['assignments', 'assignment_submissions', 'grading_rubrics', 'grade_appeals'],
    priority: 'HIGH',
    effort: '2-3 weeks',
    value: 'Assessment, feedback',
  },
  'Chat/Messaging': {
    tables: ['chat_conversations', 'chat_messages'],
    priority: 'MEDIUM',
    effort: '2 weeks',
    value: 'Real-time communication',
  },
  'Benefits/HR': {
    tables: [
      'benefits_enrollments',
      'benefits_plans',
      'cobra_enrollments',
      'employees',
      'employee_documents',
    ],
    priority: 'LOW',
    effort: '3-4 weeks',
    value: 'HR management',
  },
  Accessibility: {
    tables: ['accessibility_settings', 'accessibility_preferences'],
    priority: 'MEDIUM',
    effort: '1-2 weeks',
    value: 'ADA compliance, inclusivity',
  },
  'Analytics & Reporting': {
    tables: ['alert_notifications', 'alert_thresholds', 'api_request_logs', 'daily_activities'],
    priority: 'MEDIUM',
    effort: '2 weeks',
    value: 'Insights, monitoring',
  },
};

let totalEffortWeeks = 0;
const highPriority = [];
const mediumPriority = [];
const lowPriority = [];

for (const [name, data] of Object.entries(features)) {
  const effort = parseInt(data.effort.match(/\d+/)[0]);
  totalEffortWeeks += effort;

  const item = { name, ...data };
  if (data.priority === 'HIGH') highPriority.push(item);
  else if (data.priority === 'MEDIUM') mediumPriority.push(item);
  else lowPriority.push(item);
}

highPriority.forEach((f) => {});

mediumPriority.forEach((f) => {});

lowPriority.forEach((f) => {});

// Save detailed report
writeFileSync(
  'missing-features-assessment.json',
  JSON.stringify(
    {
      summary: {
        totalFeatures: Object.keys(features).length,
        highPriority: highPriority.length,
        mediumPriority: mediumPriority.length,
        lowPriority: lowPriority.length,
        totalEffortWeeks,
        estimatedMonths: Math.ceil(totalEffortWeeks / 4),
      },
      features,
      highPriority,
      mediumPriority,
      lowPriority,
    },
    null,
    2,
  ),
);
