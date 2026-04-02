'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield, Briefcase, GraduationCap, BarChart3,
  ArrowRight, Play, Pause, Volume2, VolumeX,
  ExternalLink,
} from 'lucide-react';

const DEMOS = [
  {
    id: 'admin',
    label: 'Admin Dashboard',
    icon: Shield,
    video: '/videos/dashboard-admin-narrated.mp4',
    liveHref: '/demo/admin',
    description: 'Search students, review applications, track compliance, generate WIOA reports.',
    features: [
      'Enrollment pipeline with real-time status',
      'Compliance tracking and PIRL reporting',
      'Funding utilization across WIOA, WRG, Job Ready Indy',
      'At-risk student alerts and intervention tools',
      'Application review and approval workflow',
    ],
  },
  {
    id: 'employer',
    label: 'Employer Portal',
    icon: Briefcase,
    video: '/videos/dashboard-employer-narrated.mp4',
    liveHref: '/demo/employer',
    description: 'Find trained candidates, track apprentices, manage OJT reimbursements and WOTC credits.',
    features: [
      'Browse pre-screened candidates with credentials',
      'Apprenticeship hour tracking and wage progression',
      'OJT contract management and reimbursement tracking',
      'WOTC tax credit documentation',
      'MOU and compliance document signing',
    ],
  },
  {
    id: 'learner',
    label: 'Student Portal',
    icon: GraduationCap,
    video: '/videos/dashboard-student-narrated.mp4',
    liveHref: '/demo/learner',
    description: 'Course modules, progress tracking, apprenticeship hours, certificates earned.',
    features: [
      'Course modules with video lessons and quizzes',
      'Progress bars and completion tracking',
      'Apprenticeship hour logging from mobile',
      'Earned certificates and credential wallet',
      'Career services and job placement tools',
    ],
  },
  {
    id: 'workforce',
    label: 'Workforce Board',
    icon: BarChart3,
    video: '/videos/dashboard-analytics-narrated.mp4',
    liveHref: '/demo/admin/wioa',
    description: 'WIOA eligibility, ITA tracking, PIRL reporting, provider network management.',
    features: [
      'WIOA eligibility screening with document verification',
      'ITA management and funding allocation',
      'Automated PIRL reporting and quarterly performance',
      'Provider network oversight and outcomes',
      'Multi-source funding tracking (WIOA, state, employer)',
    ],
  },
];

export default function DemoTabs() {
  const [activeTab, setActiveTab] = useState('admin');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const active = DEMOS.find(d => d.id === activeTab) || DEMOS[0];

  const switchTab = useCallback((id: string) => {
    setActiveTab(id);
    setIsPlaying(false);
    setIsMuted(true);
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
      video.muted = true;
    }
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  return (
    <div>
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 bg-white rounded-xl p-1 mb-6">
        {DEMOS.map(demo => (
          <button
            key={demo.id}
            onClick={() => switchTab(demo.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-1 min-w-[140px] justify-center ${
              activeTab === demo.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <demo.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{demo.label}</span>
            <span className="sm:hidden">{demo.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Video + info */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Video player — 3 cols */}
        <div className="lg:col-span-3">
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video shadow-xl">
            <video
              ref={videoRef}
              key={active.video}
              className="absolute inset-0 w-full h-full object-cover"
              src={active.video}
              muted
              playsInline
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Play overlay */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 hover:bg-black/50 transition-colors cursor-pointer"
                aria-label="Play demo walkthrough"
              >
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg mb-3">
                  <Play className="w-7 h-7 text-brand-red-600 ml-1" />
                </div>
                <span className="text-white text-sm font-semibold">Watch Narrated Walkthrough</span>
              </button>
            )}

            {/* Controls */}
            {isPlaying && (
              <div className="absolute bottom-3 left-3 z-20 flex gap-2">
                <button
                  onClick={togglePlay}
                  className="p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                  title="Pause"
                >
                  <Pause className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={toggleMute}
                  className="p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                </button>
              </div>
            )}

            {/* Label */}
            <div className="absolute top-3 left-3 z-10">
              <span className="bg-black/70 text-white text-xs font-medium rounded px-2 py-1 backdrop-blur-sm">
                {active.label} Demo
              </span>
            </div>
          </div>
        </div>

        {/* Info panel — 2 cols */}
        <div className="lg:col-span-2 flex flex-col">
          <h2 className="text-xl font-bold text-slate-900 mb-2">{active.label}</h2>
          <p className="text-slate-600 mb-4">{active.description}</p>

          <ul className="space-y-2 mb-6 flex-1">
            {active.features.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-brand-red-500 mt-0.5 flex-shrink-0">&#10003;</span>
                {f}
              </li>
            ))}
          </ul>

          <div className="space-y-2">
            <Link
              href={active.liveHref}
              className="flex items-center justify-center gap-2 w-full bg-brand-red-600 text-white py-3 rounded-lg font-bold hover:bg-brand-red-700 transition"
            >
              <ExternalLink className="w-4 h-4" />
              Open Interactive Demo
            </Link>
            <Link
              href="/store/trial"
              className="flex items-center justify-center gap-2 w-full border border-slate-300 text-slate-700 py-3 rounded-lg font-semibold hover:bg-white transition"
            >
              Start 14-Day Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-xs text-slate-400 mt-3 text-center">
            Guided video walkthrough. Nothing affects any real system.
          </p>
        </div>
      </div>
    </div>
  );
}
