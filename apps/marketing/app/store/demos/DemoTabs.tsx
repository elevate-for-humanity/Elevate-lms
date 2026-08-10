'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield,
  Briefcase,
  GraduationCap,
  BarChart3,
  ArrowRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  CheckCircle2,
  Layers3,
  Sparkles,
  Replace,
} from 'lucide-react';

const DEMOS = [
  {
    id: 'admin',
    label: 'Admin Dashboard',
    icon: Shield,
    video: '/videos/dashboard-admin-narrated.mp4',
    liveHref: '/store/demo/admin',
    description:
      'Run enrollment, courses, compliance, funding and intervention work from one operating view instead of bouncing between disconnected systems.',
    buyer: 'Training providers, schools, workforce organizations and multi-program operators',
    benefit:
      'Staff can see what is happening from first application through enrollment, training, funding and compliance without rebuilding the same record in multiple places.',
    differentiator:
      'Elevate connects the operational record across admissions, learners, courses, funding, compliance and reporting. The dashboard is not a reporting shell sitting on top of separate products.',
    replaces: 'Spreadsheets + separate SIS/LMS + compliance trackers + disconnected intake tools',
    features: [
      'Enrollment pipeline with application and status visibility',
      'Compliance tracking and workforce reporting workflows',
      'Funding utilization across supported workforce programs',
      'At-risk learner alerts and intervention workflows',
      'Application review and approval from the same platform record',
    ],
  },
  {
    id: 'employer',
    label: 'Employer Portal',
    icon: Briefcase,
    video: '/videos/dashboard-employer-narrated.mp4',
    liveHref: '/store/demo/employer',
    description:
      'Give employers one place to find talent, manage apprenticeship participation, review workforce activity and complete required documents.',
    buyer: 'Employers, apprenticeship host sites, workforce partners and business-services teams',
    benefit:
      'Employers spend less time emailing documents and status questions back and forth because candidate, apprentice and program activity is connected to the same operating system.',
    differentiator:
      'The employer experience is connected to the learner, apprenticeship, workforce and compliance records behind the scenes—not a standalone job board with another login and another database.',
    replaces: 'Email chains + shared spreadsheets + separate recruiting/OJT/apprenticeship trackers',
    features: [
      'Browse candidates with training and credential context',
      'Apprenticeship hour and wage-progression workflows',
      'OJT contract and reimbursement tracking',
      'Workforce incentive and documentation workflows',
      'MOU and compliance-document workflows',
    ],
  },
  {
    id: 'learner',
    label: 'Student Portal',
    icon: GraduationCap,
    video: '/videos/dashboard-student-narrated.mp4',
    liveHref: '/store/demo/student',
    description:
      'Give learners one guided place for courses, progress, apprenticeship activity, credentials and next-step career support.',
    buyer: 'Career schools, training providers, apprenticeship sponsors and workforce programs',
    benefit:
      'Learners do not have to figure out which system holds the class, which form tracks hours, or where credentials live. Their training journey stays together.',
    differentiator:
      'Elevate combines LMS delivery with workforce and apprenticeship context. The learner portal can reflect the full career pathway, not only course completion.',
    replaces: 'Standalone LMS + paper/hour logs + separate certificate folders + scattered career-service links',
    features: [
      'Course modules with video lessons and quizzes',
      'Progress and completion tracking',
      'Apprenticeship hour logging from mobile',
      'Earned certificates and credential records',
      'Career-service and job-placement workflows',
    ],
  },
  {
    id: 'workforce',
    label: 'Workforce Board',
    icon: BarChart3,
    video: '/videos/dashboard-analytics-narrated.mp4',
    liveHref: '/store/demo/admin?view=workforce',
    description:
      'Manage eligibility, funding, provider activity, compliance and outcomes from the same data used to operate programs day to day.',
    buyer: 'Workforce boards, funded-program operators, agencies and provider networks',
    benefit:
      'Program teams can reduce manual reconciliation because eligibility, participant activity, funding and outcomes are linked instead of reported from disconnected files after the fact.',
    differentiator:
      'Elevate is designed around the operating workflow behind workforce reporting. Data can originate in intake, enrollment, training and employer activity before it becomes a report.',
    replaces: 'Eligibility spreadsheets + separate provider trackers + manual funding logs + after-the-fact reporting files',
    features: [
      'Eligibility screening with document-verification workflows',
      'ITA and funding-allocation management',
      'PIRL-oriented reporting workflows and performance views',
      'Provider-network oversight and outcomes',
      'Multi-source funding tracking across supported programs',
    ],
  },
];

export default function DemoTabs() {
  const [activeTab, setActiveTab] = useState('admin');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const active = DEMOS.find((demo) => demo.id === activeTab) || DEMOS[0];

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
      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-2">
        {DEMOS.map((demo) => (
          <button
            key={demo.id}
            type="button"
            onClick={() => switchTab(demo.id)}
            className={`flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
              activeTab === demo.id
                ? 'bg-slate-950 text-white shadow-md'
                : 'bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            <demo.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{demo.label}</span>
            <span className="sm:hidden">{demo.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-7 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-950 shadow-xl">
            <video
              ref={videoRef}
              key={active.video}
              className="absolute inset-0 h-full w-full object-cover"
              src={active.video}
              muted
              playsInline
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />

            {!isPlaying && (
              <button
                type="button"
                onClick={togglePlay}
                className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center bg-black/55 transition-colors hover:bg-black/65"
                aria-label={`Play ${active.label} narrated walkthrough`}
              >
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
                  <Play className="ml-1 h-7 w-7 text-brand-red-700" />
                </div>
                <span className="text-sm font-bold text-white">Watch the benefit-focused walkthrough</span>
              </button>
            )}

            {isPlaying && (
              <div className="absolute bottom-3 left-3 z-20 flex gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="rounded-full bg-black/75 p-2 transition-colors hover:bg-black"
                  aria-label="Pause demo"
                >
                  <Pause className="h-5 w-5 text-white" />
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="rounded-full bg-black/75 p-2 transition-colors hover:bg-black"
                  aria-label={isMuted ? 'Turn demo sound on' : 'Turn demo sound off'}
                >
                  {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
                </button>
              </div>
            )}

            <div className="absolute left-3 top-3 z-10">
              <span className="rounded bg-black/80 px-2.5 py-1 text-xs font-bold text-white">
                {active.label} Demo
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              <p className="mt-3 text-xs font-black uppercase tracking-wide text-emerald-800">Business benefit</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{active.benefit}</p>
            </div>
            <div className="rounded-2xl border border-brand-red-200 bg-brand-red-50 p-5">
              <Sparkles className="h-5 w-5 text-brand-red-700" />
              <p className="mt-3 text-xs font-black uppercase tracking-wide text-brand-red-800">Why Elevate is different</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{active.differentiator}</p>
            </div>
            <div className="rounded-2xl border border-slate-300 bg-slate-100 p-5">
              <Replace className="h-5 w-5 text-slate-800" />
              <p className="mt-3 text-xs font-black uppercase tracking-wide text-slate-700">What it can replace</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{active.replaces}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-brand-red-700">
              <Layers3 className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-[0.16em]">Built for</span>
            </div>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-800">{active.buyer}</p>

            <h2 className="mt-5 text-2xl font-black text-slate-950">{active.label}</h2>
            <p className="mt-2 text-base leading-7 text-slate-700">{active.description}</p>

            <h3 className="mt-6 text-sm font-black uppercase tracking-wide text-slate-700">What you will see</h3>
            <ul className="mt-3 flex-1 space-y-3">
              {active.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm font-medium leading-6 text-slate-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-7 space-y-2">
              <Link
                href={active.liveHref}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-red-700 py-3 font-black text-white transition hover:bg-brand-red-800"
              >
                <ExternalLink className="h-4 w-4" />
                Open Interactive Demo
              </Link>
              <Link
                href="/store/trial"
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-400 py-3 font-bold text-slate-900 transition hover:bg-slate-50"
              >
                Try it with your organization <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="mt-3 text-center text-xs font-medium text-slate-600">
              Sample-data environment. Demo actions do not change production records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
