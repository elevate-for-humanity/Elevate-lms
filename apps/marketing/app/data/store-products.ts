// Platform Apps (Modular Components) - Marketing site data
export interface PlatformApp {
  id: string;
  key: string;
  name: string;
  description: string;
  enabledByDefault: boolean;
  icon?: string;
}

export const PLATFORM_APPS: PlatformApp[] = [
  {
    id: 'lms',
    key: 'lms',
    name: 'Learning Management System',
    description: 'Courses, SCORM, certifications, progress tracking, quizzes, and assignments.',
    enabledByDefault: true,
    icon: '📚',
  },
  {
    id: 'enrollment',
    key: 'enrollment',
    name: 'Enrollment System',
    description: 'Applications, intake forms, document uploads, and enrollment tracking.',
    enabledByDefault: true,
    icon: '📝',
  },
  {
    id: 'payments',
    key: 'payments',
    name: 'Payment Processing',
    description: 'Stripe integration for tuition, subscriptions, and product purchases.',
    enabledByDefault: true,
    icon: '💳',
  },
  {
    id: 'case-management',
    key: 'case-management',
    name: 'Case Management',
    description: 'Track student progress, notes, communications, and outcomes.',
    enabledByDefault: false,
    icon: '📋',
  },
];
