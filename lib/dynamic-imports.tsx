/**
 * Dynamic imports for heavy components
 * Use these to lazy-load components that aren't needed on initial render
 */

import dynamic from 'next/dynamic';

// Heavy chart components - only load when needed
export const DynamicLineChart = dynamic(() => import('recharts').then((mod) => mod.LineChart), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-100 animate-pulse rounded-lg" />,
});

export const DynamicBarChart = dynamic(() => import('recharts').then((mod) => mod.BarChart), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-100 animate-pulse rounded-lg" />,
});

export const DynamicPieChart = dynamic(() => import('recharts').then((mod) => mod.PieChart), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-100 animate-pulse rounded-lg" />,
});

// Video player - heavy component
// FIX: VideoPlayer uses named export
export const DynamicVideoPlayer = dynamic(
  () => import('@/components/VideoPlayer').then((m) => m.VideoPlayer),
  {
    ssr: false,
    loading: () => <div className="aspect-video bg-slate-900 animate-pulse rounded-lg" />,
  }
);

// Rich text editor - very heavy
// NOTE: components/RichTextEditor.tsx does not exist
const NullComponent = () => null;
export const DynamicRichTextEditor = dynamic(
  () => Promise.resolve(NullComponent),
  { ssr: false, loading: () => null }
);

// PDF viewer
// NOTE: components/PDFViewer.tsx does not exist
export const DynamicPDFViewer = dynamic(
  () => Promise.resolve(NullComponent),
  { ssr: false, loading: () => null }
);

// Calendar component - default export
export const DynamicCalendar = dynamic(() => import('@/components/Calendar'), {
  ssr: false,
  loading: () => <div className="h-80 bg-slate-100 animate-pulse rounded-lg" />,
});

// AI Chat component
// FIX: AIInstructorPanel uses named export
export const DynamicAIChat = dynamic(
  () => import('@/components/AIInstructorPanel').then((m) => m.AIInstructorPanel),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-slate-100 animate-pulse rounded-lg" />,
  }
);

// Confetti - only for success pages - default export
export const DynamicConfetti = dynamic(() => import('@/components/Confetti'), { ssr: false });

// Map component
// NOTE: components/Map.tsx does not exist
export const DynamicMap = dynamic(
  () => Promise.resolve(NullComponent),
  { ssr: false, loading: () => null }
);
