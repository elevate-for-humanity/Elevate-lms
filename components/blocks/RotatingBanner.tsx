'use client';

/**
 * RotatingBanner — cycles through 3–6 short value statements.
 * Solid background, no gradients. Subtle fade transition.
 * Auto-advances every 4 seconds. Pauses on hover.
 */

import { useEffect, useRef, useState } from 'react';

interface Props {
  lines: string[];
  /** Default: slate-900 */
  variant?: 'dark' | 'red' | 'blue';
  intervalMs?: number;
}

export default function RotatingBanner({ lines, variant = 'dark', intervalMs = 4000 }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % lines.length);
    }, intervalMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, lines.length, intervalMs]);

  const bg =
    variant === 'red'  ? 'bg-brand-red-600' :
    variant === 'blue' ? 'bg-brand-blue-700' :
                         'bg-slate-900';
  const textColor = 'text-white';

  return (
    <section
      className={`${bg} py-5 px-4`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-6">
        {/* Prev/next dots */}
        <div className="flex gap-1.5">
          {lines.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to statement ${i + 1}`}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white scale-125' : 'bg-white/40'}`}
            />
          ))}
        </div>

        {/* Text */}
        <p
          key={current}
          className={`${textColor} font-bold text-sm sm:text-base text-center flex-1 animate-fade-in`}
          style={{ animation: 'fadeIn 0.3s ease' }}
        >
          {lines[current]}
        </p>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease; }
      `}</style>
    </section>
  );
}
