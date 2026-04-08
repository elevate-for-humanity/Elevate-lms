'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import dynamic from 'next/dynamic';

const SocialLinksModal = dynamic(() => import('@/components/social/SocialLinksModal'), {
  ssr: false,
});

export default function SocialMediaHighlight() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="py-20 relative overflow-hidden bg-slate-800">
        {/* Background dot pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '30px 30px',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Follow Our Journey
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-10">
            See daily success stories, training updates, and community impact. Follow our mission to elevate communities.
          </p>

          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-3 bg-white text-slate-900 font-bold text-lg px-8 py-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-white/50"
            aria-haspopup="dialog"
          >
            <Users className="w-5 h-5" />
            Connect With Us
          </button>

          <p className="mt-4 text-sm text-white/60">
            Facebook · Instagram · LinkedIn · YouTube
          </p>
        </div>
      </section>

      <SocialLinksModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
