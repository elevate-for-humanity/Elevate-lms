import { createClient } from '@/lib/supabase/client';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: string; // Optional action button text
  skippable?: boolean;
}

export interface OnboardingFlow {
  id: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  steps: OnboardingStep[];
  completionReward?: {
    type: 'badge' | 'points';
    value: string | number;
  };
}

// Predefined onboarding flows
export const ONBOARDING_FLOWS: Record<string, OnboardingFlow> = {
  student_welcome: {
    id: 'student_welcome',
    name: 'Welcome to Your Learning Journey',
    role: 'student',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome! 👋',
        description: "Let's take a quick tour to help you get started with your learning journey.",
        skippable: true,
      },
      {
        id: 'dashboard',
        title: 'Your Dashboard',
        description:
          'This is your personal dashboard where you can see your enrolled courses, progress, and upcoming assignments.',
        target: '[data-onboarding="dashboard"]',
        position: 'bottom',
      },
      {
        id: 'browse_courses',
        title: 'Browse Courses',
        description:
          'Explore thousands of courses across various categories. Use filters to find exactly what you need.',
        target: '[data-onboarding="browse"]',
        position: 'bottom',
        action: 'Browse Courses',
      },
      {
        id: 'search',
        title: 'Search Functionality',
        description:
          "Use the search bar to quickly find courses, instructors, or topics you're interested in.",
        target: '[data-onboarding="search"]',
        position: 'bottom',
      },
      {
        id: 'profile',
        title: 'Your Profile',
        description:
          'Customize your profile, track achievements, and manage your learning preferences.',
        target: '[data-onboarding="profile"]',
        position: 'left',
      },
      {
        id: 'notifications',
        title: 'Stay Updated',
        description:
          'Get real-time notifications about course updates, assignments, and messages from instructors.',
        target: '[data-onboarding="notifications"]',
        position: 'bottom',
      },
      {
        id: 'complete',
        title: "You're All Set! 🎉",
        description:
          "You've completed the tour. Start exploring courses and begin your learning journey today!",
        action: 'Start Learning',
      },
    ],
    completionReward: {
      type: 'badge',
      value: 'onboarding_complete',
    },
  },

  student_first_course: {
    id: 'student_first_course',
    name: 'Your First Course',
    role: 'student',
    steps: [
      {
        id: 'course_overview',
        title: 'Course Overview',
        description:
          "Here you can see the course syllabus, instructor information, and what you'll learn.",
        target: '[data-onboarding="course-overview"]',
        position: 'top',
      },
      {
        id: 'video_player',
        title: 'Video Player Features',
        description:
          'Control playback speed, enable captions, adjust quality, and use keyboard shortcuts (Space to play/pause, ← → to skip).',
        target: '[data-onboarding="video-player"]',
        position: 'bottom',
      },
      {
        id: 'notes',
        title: 'Take Notes',
        description:
          'Take timestamped notes while watching. Click any note to jump back to that moment in the video.',
        target: '[data-onboarding="notes"]',
        position: 'left',
      },
      {
        id: 'discussions',
        title: 'Join Discussions',
        description:
          'Ask questions, share insights, and connect with fellow learners in the discussion forum.',
        target: '[data-onboarding="discussions"]',
        position: 'top',
      },
      {
        id: 'progress',
        title: 'Track Your Progress',
        description: 'See your completion percentage and mark lessons as complete as you go.',
        target: '[data-onboarding="progress"]',
        position: 'bottom',
      },
    ],
  },

  instructor_welcome: {
    id: 'instructor_welcome',
    name: 'Welcome Instructor',
    role: 'instructor',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome, Instructor! 👨‍🏫',
        description: "Let's set up your teaching environment and create your first course.",
        skippable: true,
      },
      {
        id: 'instructor_dashboard',
        title: 'Instructor Dashboard',
        description:
          'Manage all your courses, view student analytics, and track engagement from here.',
        target: '[data-onboarding="instructor-dashboard"]',
        position: 'bottom',
      },
      {
        id: 'create_course',
        title: 'Create Your First Course',
        description:
          'Click here to start creating a new course. Add videos, quizzes, assignments, and more.',
        target: '[data-onboarding="create-course"]',
        position: 'bottom',
        action: 'Create Course',
      },
      {
        id: 'course_builder',
        title: 'Course Builder',
        description:
          'Use our intuitive course builder to structure your content, upload materials, and set prerequisites.',
        target: '[data-onboarding="course-builder"]',
        position: 'right',
      },
      {
        id: 'student_management',
        title: 'Manage Students',
        description:
          'View enrolled students, grade assignments, and communicate directly with learners.',
        target: '[data-onboarding="students"]',
        position: 'left',
      },
      {
        id: 'analytics',
        title: 'Course Analytics',
        description:
          'Track student progress, engagement metrics, and course performance with detailed analytics.',
        target: '[data-onboarding="analytics"]',
        position: 'bottom',
      },
      {
        id: 'messaging',
        title: 'Student Communication',
        description:
          'Respond to student questions, send announcements, and provide personalized feedback.',
        target: '[data-onboarding="messaging"]',
        position: 'left',
      },
    ],
    completionReward: {
      type: 'badge',
      value: 'instructor_onboarded',
    },
  },

  admin_welcome: {
    id: 'admin_welcome',
    name: 'Admin Platform Tour',
    role: 'admin',
    steps: [
      {
        id: 'welcome',
        title: 'Admin Dashboard',
        description:
          'Welcome to the admin panel. Manage users, courses, and platform settings from here.',
        skippable: true,
      },
      {
        id: 'user_management',
        title: 'User Management',
        description:
          'View all users, manage roles, perform bulk operations, and handle user reports.',
        target: '[data-onboarding="users"]',
        position: 'bottom',
      },
      {
        id: 'course_moderation',
        title: 'Course Moderation',
        description:
          'Review and approve new courses, manage content quality, and handle reported content.',
        target: '[data-onboarding="moderation"]',
        position: 'bottom',
      },
      {
        id: 'analytics_admin',
        title: 'Platform Analytics',
        description:
          'Monitor platform health, user engagement, revenue metrics, and growth trends.',
        target: '[data-onboarding="admin-analytics"]',
        position: 'bottom',
      },
      {
        id: 'bulk_operations',
        title: 'Bulk Operations',
        description:
          'Perform mass enrollments, send notifications, export data, and manage users at scale.',
        target: '[data-onboarding="bulk-ops"]',
        position: 'left',
      },
      {
        id: 'audit_logs',
        title: 'Audit Logs',
        description: 'Track all admin actions, security events, and system changes for compliance.',
        target: '[data-onboarding="audit"]',
        position: 'bottom',
      },
    ],
  },
};

// Check if user has completed an onboarding flow
export async function hasCompletedOnboarding(userId: string, flowId: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error }: any = await supabase
    .from('user_onboarding')
    .select('completed')
    .eq('user_id', userId)
    .eq('flow_id', flowId)
    .maybeSingle();

  if (error || !data) return false;
  return data.completed;
}

// Get user's onboarding progress
export async function getOnboardingProgress(
  userId: string,
  flowId: string,
): Promise<{
  currentStep: number;
  completedSteps: string[];
  completed: boolean;
} | null> {
  const supabase = createClient();

  const { data, error }: any = await supabase
    .from('user_onboarding')
    .select('*')
    .eq('user_id', userId)
    .eq('flow_id', flowId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    currentStep: data.current_step,
    completedSteps: data.completed_steps || [],
    completed: data.completed,
  };
}

// Start an onboarding flow
export async function startOnboarding(userId: string, flowId: string): Promise<void> {
  const supabase = createClient();

  await supabase.from('user_onboarding').upsert({
    user_id: userId,
    flow_id: flowId,
    current_step: 0,
    completed_steps: [],
    completed: false,
    started_at: new Date().toISOString(),
  });
}

// Update onboarding progress
export async function updateOnboardingProgress(
  userId: string,
  flowId: string,
  stepId: string,
  stepIndex: number,
): Promise<void> {
  const supabase = createClient();

  // Get current progress
  const { data: current } = await supabase
    .from('user_onboarding')
    .select('completed_steps')
    .eq('user_id', userId)
    .eq('flow_id', flowId)
    .maybeSingle();

  const completedSteps = current?.completed_steps || [];
  if (!completedSteps.includes(stepId)) {
    completedSteps.push(stepId);
  }

  await supabase
    .from('user_onboarding')
    .update({
      current_step: stepIndex + 1,
      completed_steps: completedSteps,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('flow_id', flowId);
}

// Complete an onboarding flow
export async function completeOnboarding(userId: string, flowId: string): Promise<void> {
  const supabase = createClient();

  await supabase
    .from('user_onboarding')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('flow_id', flowId);

  // Award completion reward if applicable
  const flow = ONBOARDING_FLOWS[flowId];
  if (flow?.completionReward) {
    if (flow.completionReward.type === 'badge') {
      await awardBadge(userId, flow.completionReward.value as string);
    } else if (flow.completionReward.type === 'points') {
      await awardPoints(userId, flow.completionReward.value as number);
    }
  }
}

// Skip an onboarding flow
export async function skipOnboarding(userId: string, flowId: string): Promise<void> {
  const supabase = createClient();

  await supabase
    .from('user_onboarding')
    .update({
      completed: true,
      skipped: true,
      completed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('flow_id', flowId);
}

// Reset onboarding (for testing or user request)
export async function resetOnboarding(userId: string, flowId: string): Promise<void> {
  const supabase = createClient();

  await supabase.from('user_onboarding').delete().eq('user_id', userId).eq('flow_id', flowId);
}

// Helper functions for rewards
async function awardBadge(userId: string, badgeId: string): Promise<void> {
  const supabase = createClient();

  await supabase.from('user_achievements').insert({
    user_id: userId,
    achievement_id: badgeId,
    earned_at: new Date().toISOString(),
  });
}

async function awardPoints(userId: string, points: number): Promise<void> {
  const supabase = createClient();

  await supabase.rpc('increment_user_points', {
    user_id: userId,
    points_to_add: points,
  });
}

// Get recommended onboarding flows for a user
export async function getRecommendedOnboarding(
  userId: string,
  userRole: 'student' | 'instructor' | 'admin',
): Promise<OnboardingFlow[]> {
  const supabase = createClient();

  // Get completed flows
  const { data: completed } = await supabase
    .from('user_onboarding')
    .select('flow_id')
    .eq('user_id', userId)
    .eq('completed', true);

  const completedFlowIds = completed?.map((c) => c.flow_id) || [];

  // Return flows for user's role that haven't been completed
  return Object.values(ONBOARDING_FLOWS).filter(
    (flow) => flow.role === userRole && !completedFlowIds.includes(flow.id),
  );
}

// Interactive tutorial system
export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number; // in minutes
  steps: TutorialStep[];
  prerequisites?: string[];
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'video' | 'interactive' | 'quiz';
  media?: string; // URL for video or image
  action?: {
    type: 'click' | 'input' | 'navigate';
    target: string;
    validation?: string;
  };
}

export const TUTORIALS: Record<string, Tutorial> = {
  video_features: {
    id: 'video_features',
    title: 'Mastering the Video Player',
    description: 'Learn all the advanced features of our video player',
    category: 'Learning Tools',
    duration: 5,
    steps: [
      {
        id: 'playback_speed',
        title: 'Adjust Playback Speed',
        content:
          'Speed up or slow down videos to match your learning pace. Click the speed button and select from 0.5x to 2x.',
        type: 'interactive',
        action: {
          type: 'click',
          target: '[data-tutorial="speed-control"]',
        },
      },
      {
        id: 'quality_selector',
        title: 'Change Video Quality',
        content:
          'Adjust video quality based on your internet connection. Higher quality uses more bandwidth.',
        type: 'interactive',
        action: {
          type: 'click',
          target: '[data-tutorial="quality-selector"]',
        },
      },
      {
        id: 'captions',
        title: 'Enable Captions',
        content: 'Turn on captions for better comprehension. Multiple languages available.',
        type: 'interactive',
        action: {
          type: 'click',
          target: '[data-tutorial="captions"]',
        },
      },
      {
        id: 'keyboard_shortcuts',
        title: 'Keyboard Shortcuts',
        content: 'Space: Play/Pause | ← →: Skip 10s | ↑ ↓: Volume | F: Fullscreen | M: Mute',
        type: 'text',
      },
      {
        id: 'pip_mode',
        title: 'Picture-in-Picture',
        content: 'Watch videos while browsing other content. Click the PiP button to enable.',
        type: 'interactive',
        action: {
          type: 'click',
          target: '[data-tutorial="pip"]',
        },
      },
    ],
  },

  note_taking: {
    id: 'note_taking',
    title: 'Effective Note-Taking',
    description: 'Learn how to take and organize notes while learning',
    category: 'Learning Tools',
    duration: 3,
    steps: [
      {
        id: 'create_note',
        title: 'Create a Note',
        content: 'Click the note button while watching to create a timestamped note.',
        type: 'interactive',
        action: {
          type: 'click',
          target: '[data-tutorial="add-note"]',
        },
      },
      {
        id: 'format_note',
        title: 'Format Your Notes',
        content: 'Use the rich text editor to format notes with bold, italic, lists, and more.',
        type: 'interactive',
      },
      {
        id: 'jump_to_timestamp',
        title: 'Jump to Timestamp',
        content: 'Click any note to jump back to that moment in the video.',
        type: 'interactive',
      },
      {
        id: 'organize_notes',
        title: 'Organize Notes',
        content: 'Tag and categorize notes for easy searching and review.',
        type: 'text',
      },
    ],
  },

  course_creation: {
    id: 'course_creation',
    title: 'Creating Your First Course',
    description: 'Step-by-step guide to creating and publishing a course',
    category: 'Instructor',
    duration: 15,
    prerequisites: ['instructor_welcome'],
    steps: [
      {
        id: 'course_basics',
        title: 'Course Basics',
        content: 'Enter your course title, description, and select a category.',
        type: 'interactive',
        action: {
          type: 'input',
          target: '[data-tutorial="course-title"]',
          validation: 'required',
        },
      },
      {
        id: 'upload_video',
        title: 'Upload Course Content',
        content:
          'Upload videos, PDFs, and other learning materials. Videos are automatically processed.',
        type: 'interactive',
      },
      {
        id: 'create_sections',
        title: 'Organize into Sections',
        content: 'Structure your course with sections and lessons for better organization.',
        type: 'interactive',
      },
      {
        id: 'add_quiz',
        title: 'Add Quizzes',
        content: 'Create quizzes to test student knowledge and reinforce learning.',
        type: 'interactive',
      },
      {
        id: 'set_pricing',
        title: 'Set Course Pricing',
        content: 'Choose between free, one-time payment, or subscription pricing.',
        type: 'interactive',
      },
      {
        id: 'publish',
        title: 'Publish Your Course',
        content: 'Review everything and publish your course to make it available to students.',
        type: 'interactive',
        action: {
          type: 'click',
          target: '[data-tutorial="publish-course"]',
        },
      },
    ],
  },
};

// Get tutorial progress
export async function getTutorialProgress(
  userId: string,
  tutorialId: string,
): Promise<{
  currentStep: number;
  completedSteps: string[];
  completed: boolean;
} | null> {
  const supabase = createClient();

  const { data, error }: any = await supabase
    .from('user_tutorials')
    .select('*')
    .eq('user_id', userId)
    .eq('tutorial_id', tutorialId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    currentStep: data.current_step,
    completedSteps: data.completed_steps || [],
    completed: data.completed,
  };
}

// Update tutorial progress
export async function updateTutorialProgress(
  userId: string,
  tutorialId: string,
  stepId: string,
  stepIndex: number,
): Promise<void> {
  const supabase = createClient();

  const { data: current } = await supabase
    .from('user_tutorials')
    .select('completed_steps')
    .eq('user_id', userId)
    .eq('tutorial_id', tutorialId)
    .maybeSingle();

  const completedSteps = current?.completed_steps || [];
  if (!completedSteps.includes(stepId)) {
    completedSteps.push(stepId);
  }

  await supabase.from('user_tutorials').upsert({
    user_id: userId,
    tutorial_id: tutorialId,
    current_step: stepIndex + 1,
    completed_steps: completedSteps,
    updated_at: new Date().toISOString(),
  });
}

// Complete tutorial
export async function completeTutorial(userId: string, tutorialId: string): Promise<void> {
  const supabase = createClient();

  await supabase
    .from('user_tutorials')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('tutorial_id', tutorialId);
}
