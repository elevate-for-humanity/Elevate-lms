// Client-safe types and constants for onboarding
// No server imports allowed here

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
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

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  steps: TutorialStep[];
  prerequisites?: string[];
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'video' | 'interactive' | 'quiz';
  media?: string;
  action?: {
    type: 'click' | 'input' | 'navigate';
    target: string;
    validation?: string;
  };
}

// Predefined onboarding flows (client-safe)
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
};

// Tutorials (client-safe)
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
};
