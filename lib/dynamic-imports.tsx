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
export const DynamicVideoPlayer = dynamic(() => import('@/components/VideoPlayer'), {
  ssr: false,
  loading: () => <div className="aspect-video bg-slate-900 animate-pulse rounded-lg" />,
});

// Rich text editor - very heavy
export const DynamicRichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-48 bg-slate-100 animate-pulse rounded-lg" />,
});

// PDF viewer
export const DynamicPDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => <div className="h-96 bg-slate-100 animate-pulse rounded-lg" />,
});

// Calendar component
export const DynamicCalendar = dynamic(() => import('@/components/Calendar'), {
  ssr: false,
  loading: () => <div className="h-80 bg-slate-100 animate-pulse rounded-lg" />,
});

// AI Chat component
export const DynamicAIChat = dynamic(() => import('@/components/AIInstructorPanel'), {
  ssr: false,
  loading: () => <div className="h-96 bg-slate-100 animate-pulse rounded-lg" />,
});

// Confetti - only for success pages
export const DynamicConfetti = dynamic(() => import('@/components/Confetti'), { ssr: false });

// Map component
export const DynamicMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-100 animate-pulse rounded-lg" />,
});
