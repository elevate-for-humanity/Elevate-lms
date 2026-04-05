"use client";

import React from 'react';

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

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {reels.map((reel, index) => (
        <div
          key={reel.id}
          className="h-screen snap-start relative flex items-center justify-center"
        >
          <video
            src={reel.video_url}
            className="w-full h-full object-cover"
            loop
            muted={index !== currentIndex}
            autoPlay={index === currentIndex}
            playsInline
          />

          <div className="absolute bottom-20 left-6 right-20 text-white">
            <h3 className="text-xl font-bold mb-2">{reel.title}</h3>
            <p className="text-sm opacity-90">{reel.description}</p>
          </div>

          <div className="absolute right-4 bottom-32 flex flex-col gap-6">
            <button className="flex flex-col items-center">
              <Heart className="w-8 h-8 text-white" />
              <span className="text-white text-xs mt-1">{reel.likes}</span>
            </button>
            <button className="flex flex-col items-center">
              <MessageCircle className="w-8 h-8 text-white" />
            </button>
            <button className="flex flex-col items-center">
              <Share2 className="w-8 h-8 text-white" />
            </button>
            <button className="flex flex-col items-center">
              <Bookmark className="w-8 h-8 text-white" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
