'use client';

import React from 'react';
import Link from 'next/link';

import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

interface Reel {
  id: string;
  video_url: string;
  title: string;
  description: string;
  likes: number;
  views: number;
}

export default function ReelsFeed({ reels }: { reels: Reel[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [shareNotice, setShareNotice] = useState('');
  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem('efh_saved_reels') || '{}'));
    } catch {
      /* Saved state is optional when browser storage is unavailable. */
    }
  }, []);
  function toggleSaved(id: string) {
    setSaved((current) => {
      const next = { ...current, [id]: !current[id] };
      try {
        localStorage.setItem('efh_saved_reels', JSON.stringify(next));
      } catch {
        /* Saved state is optional when browser storage is unavailable. */
      }
      return next;
    });
  }
  async function shareReel(reel: Reel) {
    const url = new URL('/reels', window.location.origin);
    url.hash = `reel-${reel.id}`;
    try {
      if (navigator.share) await navigator.share({ title: reel.title, url: url.href });
      else {
        await navigator.clipboard.writeText(url.href);
        setShareNotice('Reel link copied.');
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError'))
        setShareNotice('Sharing is unavailable. Copy the page address to share this reel.');
    }
  }
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = window.innerHeight;
      const newIndex = Math.round(scrollTop / itemHeight);
      setCurrentIndex(newIndex);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  if (reels.length === 0) {
    return (
      <section className="bg-slate-950 px-4 py-20 text-center text-white">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-8">
          <h1 className="text-4xl font-black">Elevate Reels</h1>
          <p className="mt-4 leading-7 text-slate-300">
            No reels are published right now. New career-training, apprenticeship, and community
            videos will appear here when they are released.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <p role="status" aria-live="polite" className="sr-only">
        {shareNotice}
      </p>
      {reels.map((reel, index) => (
        <div
          key={reel.id}
          id={`reel-${reel.id}`}
          className="h-screen snap-start relative flex items-center justify-center"
        >
          <video
            src={reel.video_url}
            className="w-full h-full object-contain"
            loop
            muted
            controls
            aria-label={reel.title}
            autoPlay={index === currentIndex}
            playsInline
          />

          <div className="absolute bottom-20 left-6 right-20 text-white">
            <h3 className="text-xl font-bold mb-2">{reel.title}</h3>
            <p className="text-sm opacity-90">{reel.description}</p>
          </div>

          <div className="absolute right-4 bottom-32 flex flex-col gap-6">
            <div className="flex flex-col items-center" aria-label={`${reel.likes} likes`}>
              <Heart className="w-8 h-8 text-white" />
              <span className="text-white text-xs mt-1">{reel.likes}</span>
            </div>
            <Link
              href="/contact"
              aria-label="Ask about training"
              className="flex min-h-11 min-w-11 flex-col items-center"
            >
              <MessageCircle className="w-8 h-8 text-white" />
              <span className="mt-1 text-xs text-white">Ask</span>
            </Link>
            <button
              type="button"
              onClick={() => void shareReel(reel)}
              aria-label={`Share ${reel.title}`}
              className="flex min-h-11 min-w-11 flex-col items-center"
            >
              <Share2 className="w-8 h-8 text-white" />
            </button>
            <button
              type="button"
              onClick={() => toggleSaved(reel.id)}
              aria-label={`Save ${reel.title} on this device`}
              aria-pressed={Boolean(saved[reel.id])}
              className="flex min-h-11 min-w-11 flex-col items-center"
            >
              <Bookmark className="w-8 h-8 text-white" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
