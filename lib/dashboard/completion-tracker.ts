/**
 * Dashboard Completion Tracker
 * Tracks user progress through required onboarding and program milestones
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type RoleType = 'student' | 'instructor' | 'employer' | 'program_holder' | 'admin';

export interface CompletionItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
  category: string;
  route?: string;
  weight: number; // Contribution to overall score
}

export interface CompletionStatus {
  itemId: string;
  completed: boolean;
  completedAt?: string;
  evidence?: string;
}

export interface CompletionScore {
  role: RoleType;
  totalItems: number;
  completedItems: number;
  requiredItems: number;
  requiredCompleted: number;
  percentage: number;
  requiredPercentage: number;
  items: CompletionStatus[];
  missingRequired: string[];
  categories: Record<string, { total: number; completed: number; percentage: number }>;
}

// =============================================================================
// COMPLETION CHECKLISTS BY ROLE
// =============================================================================

export const STUDENT_COMPLETION_CHECKLIST: CompletionItem[] = [
  // Enrollment
  { id: 'enrollment', label: 'Complete Enrollment', description: 'Submit application and get approved', required: true, category: 'Enrollment', route: '/programs/[slug]/apply', weight: 10 },
  
  // Funding
  { id: 'funding', label: 'Funding Verified', description: 'Confirm funding source or payment plan', required: true, category: 'Funding', route: '/dashboard/funding', weight: 10 },
  
  // Orientation
  { id: 'orientation', label: 'Complete Orientation', description: 'Watch orientation video and pass quiz', required: true, category: 'Orientation', route: '/programs/[slug]/orientation', weight: 10 },
  
  // Documents
  { id: 'documents', label: 'Submit Required Documents', description: 'Upload ID, proof of eligibility, etc.', required: true, category: 'Documents', route: '/dashboard/documents', weight: 10 },
  
  // Handbook
  { id: 'handbook', label: 'Acknowledge Student Handbook', description: 'Read and sign student handbook', required: true, category: 'Documents', route: '/dashboard/handbook', weight: 5 },
  
  // Schedule
  { id: 'schedule', label: 'View Program Schedule', description: 'Access your class schedule', required: false, category: 'Schedule', route: '/dashboard/schedule', weight: 5 },
  
  // Courses
  { id: 'courses', label: 'Start First Course', description: 'Begin your first module', required: true, category: 'Courses', route: '/lms/dashboard', weight: 15 },
  
  // Attendance
  { id: 'attendance', label: 'Clock In/Out', description: 'Use timeclock for attendance tracking', required: true, category: 'Attendance', route: '/timeclock', weight: 10 },
  
  // Grades
  { id: 'grades', label: 'View Grades', description: 'Check your progress and grades', required: false, category: 'Grades', route: '/dashboard/grades', weight: 5 },
  
  // Credentials
  { id: 'credentials', label: 'View Credentials', description: 'Access earned certificates and badges', required: false, category: 'Credentials', route: '/dashboard/credentials', weight: 5 },
  
  // Career
  { id: 'career', label: 'Visit Career Center', description: 'Explore career resources', required: false, category: 'Career', route: '/career', weight: 5 },
  
  // Resume
  { id: 'resume', label: 'Upload Resume', description: 'Add your resume for employer matching', required: false, category: 'Career', route: '/dashboard/resume', weight: 5 },
  
  // Job Matches
  { id: 'job_matches', label: 'Review Job Matches', description: 'See matched job opportunities', required: false, category: 'Career', route: '/dashboard/jobs', weight: 5 },
  
  // Graduation
  { id: 'graduation', label: 'Complete Program', description: 'Finish all requirements and graduate', required: true, category: 'Graduation', route: '/dashboard/graduation', weight: 0 }, // Special - marks completion
];

export const INSTRUCTOR_COMPLETION_CHECKLIST: CompletionItem[] = [
  { id: 'profile', label: 'Complete Instructor Profile', description: 'Add bio, photo, and credentials', required: true, category: 'Profile', route: '/instructor/profile', weight: 10 },
  { id: 'students', label: 'View Assigned Students', description: 'Access your student roster', required: true, category: 'Students', route: '/instructor/students', weight: 10 },
  { id: 'cohorts', label: 'Manage Cohorts', description: 'View and manage class cohorts', required: true, category: 'Cohorts', route: '/instructor/cohorts', weight: 15 },
  { id: 'rti', label: 'RTI Classes Scheduled', description: 'Schedule related technical instruction', required: true, category: 'RTI', route: '/instructor/rti', weight: 15 },
  { id: 'attendance', label: 'Take Attendance', description: 'Mark student attendance', required: true, category: 'Attendance', route: '/instructor/attendance', weight: 10 },
  { id: 'grades', label: 'Submit Grades', description: 'Enter student grades and evaluations', required: true, category: 'Grades', route: '/instructor/grades', weight: 15 },
  { id: 'compliance', label: 'Complete Compliance Training', description: 'FERPA, safety, etc.', required: true, category: 'Compliance', route: '/instructor/compliance', weight: 10 },
  { id: 'funding', label: 'Review Funding Reports', description: 'View student funding status', required: false, category: 'Funding', route: '/instructor/funding', weight: 5 },
  { id: 'payments', label: 'View Payment Records', description: 'Check student payment status', required: false, category: 'Payments', route: '/instructor/payments', weight: 5 },
  { id: 'outcomes', label: 'Track Outcomes', description: 'Monitor graduate placement', required: false, category: 'Outcomes', route: '/instructor/outcomes', weight: 5 },
];

export const EMPLOYER_COMPLETION_CHECKLIST: CompletionItem[] = [
  { id: 'profile', label: 'Complete Company Profile', description: 'Add company info and logo', required: true, category: 'Profile', route: '/employer/profile', weight: 10 },
  { id: 'mou', label: 'Sign MOU', description: 'Execute partnership agreement', required: true, category: 'Agreement', route: '/employer/mou', weight: 15 },
  { id: 'host_shop', label: 'Register Host Shop', description: 'Add shop locations', required: true, category: 'Host Shop', route: '/employer/host-shop', weight: 15 },
  { id: 'ojt_standards', label: 'Review OJT Standards', description: 'Understand on-the-job training requirements', required: true, category: 'OJT', route: '/employer/ojt-standards', weight: 10 },
  { id: 'apprentices', label: 'View Apprentice Matches', description: 'Review matched candidates', required: true, category: 'Apprentices', route: '/employer/apprentices', weight: 15 },
  { id: 'timeclock', label: 'Set Up Timeclock', description: 'Configure attendance tracking', required: true, category: 'Timeclock', route: '/employer/timeclock', weight: 10 },
  { id: 'competencies', label: 'Sign Off Competencies', description: 'Verify apprentice skill completion', required: true, category: 'Competencies', route: '/employer/competencies', weight: 10 },
  { id: 'reports', label: 'View Reports', description: 'Access compliance reports', required: false, category: 'Reports', route: '/employer/reports', weight: 5 },
  { id: 'payments', label: 'View Payment History', description: 'Check payroll and payment records', required: false, category: 'Payments', route: '/employer/payments', weight: 5 },
  { id: 'outcomes', label: 'Report Outcomes', description: 'Submit graduate employment data', required: true, category: 'Outcomes', route: '/employer/outcomes', weight: 5 },
];

export const PROGRAM_HOLDER_COMPLETION_CHECKLIST: CompletionItem[] = [
  { id: 'applicants', label: 'Review Applicants', description: 'Process incoming applications', required: true, category: 'Applicants', route: '/program-holder/applicants', weight: 10 },
  { id: 'cohorts', label: 'Manage Cohorts', description: 'Create and manage cohort schedules', required: true, category: 'Cohorts', route: '/program-holder/cohorts', weight: 15 },
  { id: 'instructors', label: 'Manage Instructors', description: 'Assign and manage instructors', required: true, category: 'Instructors', route: '/program-holder/instructors', weight: 10 },
  { id: 'rti', label: 'RTI Calendar', description: 'Schedule related technical instruction', required: true, category: 'RTI', route: '/program-holder/rti', weight: 10 },
  { id: 'attendance', label: 'Attendance Reports', description: 'Monitor student attendance', required: true, category: 'Attendance', route: '/program-holder/attendance', weight: 10 },
  { id: 'compliance', label: 'Compliance Dashboard', description: 'Track regulatory compliance', required: true, category: 'Compliance', route: '/program-holder/compliance', weight: 15 },
  { id: 'funding', label: 'Funding Management', description: 'Manage WIOA, grants, scholarships', required: true, category: 'Funding', route: '/program-holder/funding', weight: 10 },
  { id: 'payments', label: 'Payment Tracking', description: 'Monitor student payments', required: true, category: 'Payments', route: '/program-holder/payments', weight: 5 },
  { id: 'completion', label: 'Completion Reports', description: 'Track graduation rates', required: true, category: 'Completion', route: '/program-holder/completion', weight: 10 },
  { id: 'outcomes', label: 'Outcome Tracking', description: 'Monitor job placement rates', required: true, category: 'Outcomes', route: '/program-holder/outcomes', weight: 5 },
];

export const ADMIN_COMPLETION_CHECKLIST: CompletionItem[] = [
  { id: 'health', label: 'System Health', description: 'Monitor system health metrics', required: true, category: 'Health', route: '/admin/health', weight: 10 },
  { id: 'containers', label: 'Container Status', description: 'Check Northflank containers', required: true, category: 'Infrastructure', route: '/admin/containers', weight: 10 },
  { id: 'queue', label: 'Background Jobs', description: 'Monitor job queue status', required: true, category: 'Infrastructure', route: '/admin/queue', weight: 10 },
  { id: 'failed_alerts', label: 'Failed Alerts', description: 'Review and resolve failed alerts', required: true, category: 'Monitoring', route: '/admin/alerts', weight: 10 },
  { id: 'stripe', label: 'Stripe Dashboard', description: 'Monitor payment processing', required: true, category: 'Payments', route: '/admin/stripe', weight: 10 },
  { id: 'sendgrid', label: 'Email Status', description: 'Monitor email delivery', required: false, category: 'Communications', route: '/admin/email', weight: 5 },
  { id: 'twilio', label: 'SMS Status', description: 'Monitor SMS delivery', required: false, category: 'Communications', route: '/admin/sms', weight: 5 },
  { id: 'ai', label: 'AI Services', description: 'Monitor AI service health', required: false, category: 'AI', route: '/admin/ai', weight: 5 },
  { id: 'storage', label: 'Storage Usage', description: 'Monitor file storage', required: true, category: 'Infrastructure', route: '/admin/storage', weight: 5 },
  { id: 'database', label: 'Database Health', description: 'Monitor database performance', required: true, category: 'Infrastructure', route: '/admin/database', weight: 10 },
  { id: 'analytics', label: 'Analytics Overview', description: 'View platform analytics', required: false, category: 'Analytics', route: '/admin/analytics', weight: 5 },
];

// =============================================================================
// COMPLETION TRACKER SERVICE
// =============================================================================

export class CompletionTracker {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get the checklist for a specific role
   */
  getChecklist(role: RoleType): CompletionItem[] {
    switch (role) {
      case 'student':
        return STUDENT_COMPLETION_CHECKLIST;
      case 'instructor':
        return INSTRUCTOR_COMPLETION_CHECKLIST;
      case 'employer':
        return EMPLOYER_COMPLETION_CHECKLIST;
      case 'program_holder':
        return PROGRAM_HOLDER_COMPLETION_CHECKLIST;
      case 'admin':
        return ADMIN_COMPLETION_CHECKLIST;
      default:
        return [];
    }
  }

  /**
   * Get completion status for a user
   */
  async getCompletionStatus(userId: string, role: RoleType): Promise<CompletionScore> {
    const checklist = this.getChecklist(role);
    
    // Fetch completion records from database
    const { data: records, error } = await this.supabase
      .from('user_completion_status')
      .select('*')
      .eq('user_id', userId)
      .eq('role', role);

    if (error) {
      console.error('Error fetching completion status:', error);
    }

    // Create completion status map
    const completionMap = new Map<string, CompletionStatus>();
    (records || []).forEach((record) => {
      completionMap.set(record.checklist_item_id, {
        itemId: record.checklist_item_id,
        completed: record.completed,
        completedAt: record.completed_at,
        evidence: record.evidence,
      });
    });

    // Build completion items with status
    const items: CompletionStatus[] = checklist.map((item) => {
      return completionMap.get(item.id) || {
        itemId: item.id,
        completed: false,
      };
    });

    // Calculate scores
    const totalItems = checklist.length;
    const completedItems = items.filter((i) => i.completed).length;
    const requiredItems = checklist.filter((i) => i.required).length;
    const requiredCompleted = checklist
      .filter((i) => i.required)
      .filter((i) => completionMap.get(i.id)?.completed)
      .length;
    const missingRequired = checklist
      .filter((i) => i.required && !completionMap.get(i.id)?.completed)
      .map((i) => i.label);

    // Calculate category breakdown
    const categories: Record<string, { total: number; completed: number; percentage: number }> = {};
    checklist.forEach((item) => {
      if (!categories[item.category]) {
        categories[item.category] = { total: 0, completed: 0, percentage: 0 };
      }
      categories[item.category].total++;
      if (completionMap.get(item.id)?.completed) {
        categories[item.category].completed++;
      }
    });
    Object.values(categories).forEach((cat) => {
      cat.percentage = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
    });

    return {
      role,
      totalItems,
      completedItems,
      requiredItems,
      requiredCompleted,
      percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      requiredPercentage: requiredItems > 0 ? Math.round((requiredCompleted / requiredItems) * 100) : 100,
      items,
      missingRequired,
      categories,
    };
  }

  /**
   * Mark a completion item as done
   */
  async markComplete(
    userId: string,
    role: RoleType,
    itemId: string,
    evidence?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('user_completion_status')
      .upsert({
        user_id: userId,
        role,
        checklist_item_id: itemId,
        completed: true,
        completed_at: new Date().toISOString(),
        evidence,
      });

    if (error) {
      throw new Error(`Failed to mark completion: ${error.message}`);
    }
  }

  /**
   * Get next action for a user
   */
  async getNextAction(userId: string, role: RoleType): Promise<{ item: CompletionItem; route: string } | null> {
    const checklist = this.getChecklist(role);
    
    // Fetch incomplete items
    const { data: records } = await this.supabase
      .from('user_completion_status')
      .select('checklist_item_id')
      .eq('user_id', userId)
      .eq('role', role)
      .eq('completed', true);

    const completedIds = new Set((records || []).map((r) => r.checklist_item_id));

    // Find first incomplete required item
    for (const item of checklist) {
      if (item.required && !completedIds.has(item.id)) {
        return { item, route: item.route || '/lms/dashboard' };
      }
    }

    return null;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

let _trackerInstance: CompletionTracker | null = null;

export function getCompletionTracker(supabase?: SupabaseClient): CompletionTracker {
  if (!supabase) {
    const { createClient } = require('@/lib/supabase/client');
    supabase = createClient();
  }

  if (!_trackerInstance || process.env.NODE_ENV === 'test') {
    _trackerInstance = new CompletionTracker(supabase);
  }

  return _trackerInstance;
}

export default getCompletionTracker;
