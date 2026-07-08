'use client';

import dynamic from 'next/dynamic';

const AIChat = dynamic(() => import('@/components/studio/AIChat').then(m => m.default || m), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-white">Loading AI Assistant...</div>
    </div>
  ),
});

export default function AIChatPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <AIChat />
    </div>
  );
}

