'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const AIChat = dynamic(() => import('@/components/studio/AIChat'), {
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
