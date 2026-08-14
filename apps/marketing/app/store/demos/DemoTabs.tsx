'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Briefcase,
  GraduationCap,
  BarChart3,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Layers3,
  Sparkles,
  Replace,
} from 'lucide-react';

const FALLBACK_VIDEO = 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/store-marketplace.mp4';

const DEMOS = [
  {
    id: 'admin',
    label: 'Admin Dashboard',
    icon: Shield,
    liveHref: '/store/demo/admin',
    video: '/videos/store/store-admin-demo.mp4',
    description: 'Run enrollment, courses, compliance, funding and intervention work from one operating view.',
    buyer: 'Training providers, schools, workforce organizations and multi-program operators',
    benefit: 'Staff can see application, enrollment, training, funding and compliance activity in one connected workspace.',
    differentiator: 'The operational record stays connected across admissions, learners, courses, funding, compliance and reporting.',
    replaces: 'Spreadsheets + separate SIS/LMS + compliance trackers + disconnected intake tools',
    features: ['Enrollment pipeline', 'Compliance workflows', 'Funding utilization', 'At-risk learner alerts', 'Application review'],
  },
  {
    id: 'employer',
    label: 'Employer Portal',
    icon: Briefcase,
    liveHref: '/store/demo/employer',
    video: '/videos/store/store-employer-demo.mp4',
    description: 'Give employers one place to find talent, manage apprenticeship participation and complete required documents.',
    buyer: 'Employers, apprenticeship host sites, workforce partners and business-services teams',
    benefit: 'Candidate, apprentice and program activity stays connected instead of being passed through email chains.',
    differentiator: 'The employer experience connects directly to learner, apprenticeship, workforce and compliance records.',
    replaces: 'Email chains + shared spreadsheets + separate recruiting/OJT/apprenticeship trackers',
    features: ['Candidate browsing', 'Apprenticeship hours', 'OJT contracts', 'Workforce incentives', 'MOU workflows'],
  },
  {
    id: 'learner',
    label: 'Student Portal',
    icon: GraduationCap,
    liveHref: '/store/demo/student',
    video: '/videos/store/store-student-demo.mp4',
    description: 'Give learners one guided place for courses, progress, apprenticeship activity, credentials and career support.',
    buyer: 'Career schools, training providers, apprenticeship sponsors and workforce programs',
    benefit: 'Learners keep their course work, hours, credentials and career steps in one place.',
    differentiator: 'LMS delivery is connected to the full workforce and apprenticeship pathway.',
    replaces: 'Standalone LMS + paper/hour logs + separate certificate folders + scattered career-service links',
    features: ['Video lessons', 'Progress tracking', 'Apprenticeship hours', 'Credential wallet', 'Career support'],
  },
  {
    id: 'workforce',
    label: 'Workforce Board',
    icon: BarChart3,
    liveHref: '/store/demo/institutional',
    video: '/videos/store/store-workforce-demo.mp4',
    description: 'Manage eligibility, funding, provider activity, compliance and outcomes from the same operating data.',
    buyer: 'Workforce boards, funded-program operators, agencies and provider networks',
    benefit: 'Eligibility, participant activity, funding and outcomes remain linked instead of reconciled manually later.',
    differentiator: 'The reporting layer is fed by the same intake, enrollment, training and employer workflows used every day.',
    replaces: 'Eligibility spreadsheets + provider trackers + manual funding logs + after-the-fact reporting files',
    features: ['Eligibility screening', 'ITA management', 'PIRL workflows', 'Provider oversight', 'Multi-source funding'],
  },
] as const;

export default function DemoTabs() {
  const [activeTab, setActiveTab] = useState('admin');
  const [videoKey, setVideoKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const active = useMemo(() => DEMOS.find((demo) => demo.id === activeTab) || DEMOS[0], [activeTab]);

  function switchTab(id: string) {
    setActiveTab(id);
    setVideoKey((value) => value + 1);
  }

  function useFallbackVideo() {
    const video = videoRef.current;
    if (!video || video.dataset.fallbackApplied === 'true') return;
    video.dataset.fallbackApplied = 'true';
    video.src = FALLBACK_VIDEO;
    video.load();
    void video.play().catch(() => undefined);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-2">
        {DEMOS.map((demo) => (
          <button
            key={demo.id}
            type="button"
            onClick={() => switchTab(demo.id)}
            className={`flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${activeTab === demo.id ? 'bg-slate-950 text-white shadow-md' : 'bg-white text-slate-800 hover:bg-slate-50'}`}
          >
            <demo.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{demo.label}</span>
            <span className="sm:hidden">{demo.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-7 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-2xl bg-slate-950 shadow-xl">
            <video
              key={`${active.id}-${videoKey}`}
              ref={videoRef}
              src={active.video}
              controls
              playsInline
              preload="metadata"
              onError={useFallbackVideo}
              className="aspect-video w-full bg-black object-contain"
              aria-label={`${active.label} video demo`}
            >
              Your browser does not support video playback.
            </video>
            <div className="flex flex-col gap-3 border-t border-white/10 bg-slate-950 p-4 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-red-300">Video walkthrough + live workspace</p>
                <h2 className="mt-1 text-xl font-black">{active.label}</h2>
              </div>
              <Link href={active.liveHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 text-sm font-black hover:bg-brand-red-500">
                <ExternalLink className="h-4 w-4" /> Open interactive demo
              </Link>
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
              <Link href={active.liveHref} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-red-700 py-3 font-black text-white transition hover:bg-brand-red-800">
                <ExternalLink className="h-4 w-4" /> Open Interactive Demo
              </Link>
              <Link href="/store/trial" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-400 py-3 font-bold text-slate-900 transition hover:bg-slate-50">
                Try it with your organization <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
