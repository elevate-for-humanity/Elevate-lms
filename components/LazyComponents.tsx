'use client';

import dynamic from 'next/dynamic';

// Loading component for heavy components
const LoadingPlaceholder = ({ height = 'h-64' }: { height?: string }) => (
  <div className={`animate-pulse bg-gray-200 w-full ${height} rounded-xl`} />
);

// Lazy load heavy components that are below the fold
export const LazyAILiveChat = dynamic(
  () => import('@/components/chat/AILiveChat'),
  {
    ssr: false,
    loading: () => null,
  }
);

export const LazyVideoPlayer = dynamic(
  () => import('@/components/VideoPlayer'),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder />,
  }
);

export const LazyInteractiveVideoPlayer = dynamic(
  () => import('@/components/InteractiveVideoPlayer'),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder />,
  }
);

export const LazyTikTokStyleVideoPlayer = dynamic(
  () => import('@/components/TikTokStyleVideoPlayer'),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder />,
  }
);

export const LazyCalendar = dynamic(
  () => import('@/components/Calendar'),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder height="h-96" />,
  }
);

export const LazyChart = dynamic(
  () => import('@/components/Chart'),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder />,
  }
);

export const LazyExcelChartGenerator = dynamic(
  () => import('@/components/ExcelChartGenerator'),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder height="h-96" />,
  }
);

export const LazyDiscussionForums = dynamic(
  () => import('@/components/DiscussionForums'),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder height="h-screen" />,
  }
);

export const LazyStudentPortfolio = dynamic(
  () => import('@/components/StudentPortfolio'),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder height="h-screen" />,
  }
);

export const LazyChatAssistant = dynamic(
  () => import('@/components/ChatAssistant'),
  {
    ssr: false,
    loading: () => null,
  }
);

export const LazyAdvancedQuizBuilder = dynamic(
  () => import('@/components/AdvancedQuizBuilder'),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder height="h-screen" />,
  }
);

export const LazyComprehensiveEnrollmentWizard = dynamic(
  () => import('@/components/ComprehensiveEnrollmentWizard'),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder height="h-screen" />,
  }
);

export const LazyVideoTestimonials = dynamic(
  () => import('@/components/VideoTestimonials'),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder height="h-96" />,
  }
);

export const LazyLeaderboard = dynamic(
  () => import('@/components/Leaderboard'),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder height="h-96" />,
  }
);

export const LazyDiscussionForum = dynamic(
  () => import('@/components/DiscussionForum'),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder height="h-screen" />,
  }
);

export const LazyLMSDiscussionForum = dynamic(
  () => import('@/components/lms/DiscussionForum').then(mod => ({ default: mod.DiscussionForum })),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder height="h-screen" />,
  }
);

export const LazyRealTimeCollaboration = dynamic(
  () => import('@/components/RealTimeCollaboration'),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder height="h-screen" />,
  }
);
