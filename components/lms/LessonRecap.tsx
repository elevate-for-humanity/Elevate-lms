'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle } from 'lucide-react';

export interface RecapTopic {
  title: string;
  description: string;
}

interface Props {
  topics: RecapTopic[];
  lessonTitle: string;
}

/**
 * Post-video recap: topics fade in one at a time with descriptions.
 * Shown between the video/transcript and the quiz.
 */
export default function LessonRecap({ topics, lessonTitle }: Props) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Start animation when component scrolls into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [started]);

  // Fade in topics one by one
  useEffect(() => {
    if (!started) return;
    if (visibleCount >= topics.length) return;

    const timer = setTimeout(() => {
      setVisibleCount(c => c + 1);
    }, 800);

    return () => clearTimeout(timer);
  }, [started, visibleCount, topics.length]);

  return (
    <div ref={containerRef} className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-slate-800 text-white">
        <h2 className="text-xl font-bold">Lesson Recap</h2>
        <p className="text-sm text-slate-300 mt-1">
          Review these key topics before starting the quiz
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        {topics.map((topic, i) => {
          const isVisible = i < visibleCount;
          return (
            <div
              key={i}
              className={`flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all duration-700 ${
                isVisible
                  ? 'opacity-100 translate-y-0 border-brand-green-200 bg-brand-green-50/30'
                  : 'opacity-0 translate-y-4 border-transparent'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                isVisible ? 'bg-brand-green-100' : 'bg-slate-100'
              }`}>
                <CheckCircle className={`w-5 h-5 transition-colors duration-500 ${
                  isVisible ? 'text-brand-green-600' : 'text-slate-300'
                }`} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{topic.title}</h3>
                <p className="text-slate-600 mt-1 leading-relaxed">{topic.description}</p>
              </div>
            </div>
          );
        })}

        {visibleCount >= topics.length && (
          <div className="mt-4 pt-4 border-t border-slate-200 text-center animate-in fade-in duration-500">
            <p className="text-lg font-semibold text-slate-800">
              Ready? Start the quiz below.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
