'use client';

import dynamic from 'next/dynamic';

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

export const DynamicVideoPlayer = dynamic(() => import('@/components/VideoPlayer'), {
  ssr: false,
  loading: () => <div className="aspect-video bg-slate-900 animate-pulse rounded-lg" />,
});

export const DynamicRichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-48 bg-slate-100 animate-pulse rounded-lg" />,
});

export const DynamicPDFViewer = dynamic(
  () => import('@/components/PDFViewer').then((mod) => mod.PDFViewer),
  { ssr: false, loading: () => <div className="h-96 bg-slate-100 animate-pulse rounded-lg" /> },
);

export const DynamicCalendar = dynamic(() => import('@/components/Calendar'), {
  ssr: false,
  loading: () => <div className="h-80 bg-slate-100 animate-pulse rounded-lg" />,
});

export const DynamicAIChat = dynamic(
  () => import('@/components/AIInstructorPanel').then((mod) => mod.AIInstructorPanel),
  { ssr: false, loading: () => <div className="h-96 bg-slate-100 animate-pulse rounded-lg" /> },
);

export const DynamicConfetti = dynamic(() => import('@/components/Confetti'), { ssr: false });

export const DynamicMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-100 animate-pulse rounded-lg" />,
});
