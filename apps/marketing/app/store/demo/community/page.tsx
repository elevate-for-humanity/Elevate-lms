import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { InteractiveCommunityDemo } from '@/components/store/InteractiveCommunityDemo';

export const metadata: Metadata = {
  title: 'Try the Community Hub | Elevate Store Demo',
  description: 'Build a sample community, group, course, AI response and membership offer in a persistent Elevate sales sandbox.',
  robots: { index: false, follow: false },
};

export default function CommunityDemoPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <Link href="/store/add-ons/community-hub" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-violet-800 hover:text-violet-950">
          <ArrowLeft className="h-4 w-4" /> Community Hub
        </Link>
        <InteractiveCommunityDemo />
      </div>
    </main>
  );
}
