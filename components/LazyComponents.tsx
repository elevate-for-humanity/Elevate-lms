'use client';

import dynamic from 'next/dynamic';

// Loading component for heavy components
const LoadingPlaceholder = ({ height = 'h-64' }: { height?: string }) => (
  <div className={`animate-pulse bg-slate-200 w-full ${height} rounded-xl`} />
);

// Lazy load heavy components that are below the fold
// FIX: Using .then(m => m.default || m) to handle both default and named exports
export const LazyAILiveChat = dynamic(
  () => import('@/components/chat/AILiveChat').then(m => m.default || m),
  { ssr: false, loading: () => null }
);

export const LazyVideoPlayer = dynamic(
  () => import('@/components/VideoPlayer').then((m) => m.VideoPlayer),
  { ssr: false, loading: () => <LoadingPlaceholder /> }
);

export const LazyInteractiveVideoPlayer = dynamic(
  () => import('@/components/InteractiveVideoPlayer').then(m => m.default || m),
  { ssr: false, loading: () => <LoadingPlaceholder /> }
);

export const LazyTikTokStyleVideoPlayer = dynamic(
  () => import('@/components/TikTokStyleVideoPlayer').then(m => m.default || m),
  { ssr: false, loading: () => <LoadingPlaceholder /> }
);

export const LazyCalendar = dynamic(
  () => import('@/components/Calendar').then(m => m.default || m),
  { ssr: false, loading: () => <LoadingPlaceholder height="h-96" /> }
);

export const LazyExcelChartGenerator = dynamic(
  () => import('@/components/ExcelChartGenerator').then(m => m.default || m),
  { ssr: false, loading: () => <LoadingPlaceholder height="h-96" /> }
);

export const LazyDiscussionForums = dynamic(
  () => import('@/components/DiscussionForums').then(m => m.default || m),
  { ssr: false, loading: () => <LoadingPlaceholder height="h-screen" /> }
);

export const LazyStudentPortfolio = dynamic(
  () => import('@/components/StudentPortfolio').then((m) => m.StudentPortfolio),
  { ssr: false, loading: () => <LoadingPlaceholder height="h-screen" /> }
);

export const LazyAdvancedQuizBuilder = dynamic(
  () => import('@/components/AdvancedQuizBuilder').then(m => m.default || m),
  { ssr: false, loading: () => <LoadingPlaceholder height="h-screen" /> }
);

export const LazyComprehensiveEnrollmentWizard = dynamic(
  () => import('@/components/ComprehensiveEnrollmentWizard').then(m => m.default || m),
  { ssr: false, loading: () => <LoadingPlaceholder height="h-screen" /> }
);

export const LazyVideoTestimonials = dynamic(
  () => import('@/components/VideoTestimonials').then(m => m.default || m),
  { ssr: false, loading: () => <LoadingPlaceholder height="h-96" /> }
);

export const LazyLeaderboard = dynamic(
  () => import('@/components/Leaderboard').then((m) => m.Leaderboard),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder height="h-96" />,
  }
);

export const LazyDiscussionForum = dynamic(
  () => import('@/components/DiscussionForum').then((m) => m.DiscussionForum),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder height="h-screen" />,
  }
);

export const LazyLMSDiscussionForum = dynamic(
  () => import('@/components/lms/DiscussionForum').then((m) => m.DiscussionForum),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder height="h-screen" />,
  },
);

export const LazyRealTimeCollaboration = dynamic(
  () => import('@/components/RealTimeCollaboration').then((m) => m.RealTimeCollaboration),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder height="h-screen" />,
  }
);
