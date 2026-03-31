'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX } from 'lucide-react';

const PROGRAMS = [
  {
    tag: 'Healthcare',
    full: 'Certified Nursing Assistant',
    duration: '4–8 weeks',
    salary: '$28–$42K/yr',
    // CNA is not on Indiana ETPL — not WIOA/WorkOne funded.
    funding: 'Fee-Based',
    fundingColor: 'text-slate-300',
    video: '/videos/cna-hero.mp4',
    href: '/programs/cna',
  },
  {
    tag: 'Skilled Trades',
    full: 'HVAC Technician',
    duration: '12 weeks',
    salary: '$40–$80K/yr',
    funding: 'WIOA / WRG Eligible',
    fundingColor: 'text-green-400',
    video: '/videos/hvac-hero-final.mp4',
    href: '/programs/hvac-technician',
  },
  {
    tag: 'Transportation',
    full: 'CDL Class A',
    duration: 'Weeks, not years',
    salary: '$50–$80K/yr',
    funding: 'WIOA / WRG Eligible',
    fundingColor: 'text-green-400',
    video: '/videos/cdl-hero.mp4',
    href: '/programs/cdl-training',
  },
  {
    tag: 'Apprenticeship',
    full: 'Barber Apprenticeship',
    duration: '15–17 months',
    salary: '$35–$65K+/yr',
    funding: 'Fee-Based · $4,980',
    fundingColor: 'text-slate-300',
    video: '/videos/barber-training.mp4',
    href: '/programs/barber-apprenticeship',
  },
];

function ProgramCard({ prog }: { prog: typeof PROGRAMS[number] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  // Play only when the card is visible — not all 4 on page load
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  function toggleSound(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  }

  return (
    <Link href={prog.href} className="group relative rounded-2xl overflow-hidden block" style={{ aspectRatio: '9/14' }}>
      <video
        ref={videoRef}
        src={prog.video}
        muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

      {/* Sound toggle */}
      <button
        onClick={toggleSound}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
      >
        {muted
          ? <VolumeX className="w-4 h-4 text-white" />
          : <Volume2 className="w-4 h-4 text-white" />
        }
      </button>

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-1">{prog.tag}</p>
        <h3 className="font-extrabold text-white text-base leading-snug mb-3">{prog.full}</h3>
        <div className="space-y-1">
          <p className="text-xs text-slate-300">{prog.duration}</p>
          <p className="text-sm font-bold text-green-400">{prog.salary}</p>
          <p className={`text-xs font-semibold ${prog.fundingColor}`}>{prog.funding}</p>
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors">
          View Program →
        </div>
      </div>
    </Link>
  );
}

export function ProgramVideoCards() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {PROGRAMS.map((prog) => (
        <ProgramCard key={prog.full} prog={prog} />
      ))}
    </div>
  );
}
