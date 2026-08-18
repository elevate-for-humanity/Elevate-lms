'use client';

/**
 * TemplateGallery — Durable-style course template picker.
 *
 * Shows all registered blueprints + curated starter templates.
 * Clicking "Use Template" seeds a real course via the blueprint seeder API.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Loader2,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Stethoscope,
  Wrench,
  Truck,
  Scissors,
  Laptop,
  DollarSign,
  Heart,
  Shield,
  Zap,
  Star,
  ChevronDown,
  ChevronUp,
  Play,
} from 'lucide-react';
import { runCourseFactoryPipeline } from './runCourseFactoryPipeline';

// ── Template data ─────────────────────────────────────────────────────────────

export interface CourseTemplate {
  id: string;
  blueprintId?: string; // if backed by a real blueprint
  name: string;
  tagline: string;
  category: string;
  credential?: string;
  modules: number;
  lessons: number;
  durationWeeks: number;
  fundingEligible: boolean;
  color: string; // tailwind bg class for card accent
  icon: React.ElementType;
  features: string[];
  previewModules: string[]; // first 3 module titles for preview
  isBlueprint: boolean; // true = real blueprint, false = starter scaffold
}

const TEMPLATES: CourseTemplate[] = [
  // ── Real blueprints ──────────────────────────────────────────────────────
  {
    id: 'bookkeeping-quickbooks',
    blueprintId: 'bookkeeping-quickbooks-v1',
    name: 'Bookkeeping & QuickBooks',
    tagline: 'Full bookkeeping certification with QuickBooks Online',
    category: 'Business',
    credential: 'QuickBooks Certified User',
    modules: 8,
    lessons: 48,
    durationWeeks: 10,
    fundingEligible: true,
    color: 'bg-blue-500',
    icon: DollarSign,
    features: ['QuickBooks Online', 'Payroll basics', 'Financial statements', 'Checkpoint quizzes'],
    previewModules: [
      'Accounting Fundamentals',
      'QuickBooks Setup & Navigation',
      'Invoicing & Payments',
    ],
    isBlueprint: true,
  },
  {
    id: 'barber-apprenticeship',
    blueprintId: 'barber-apprenticeship-v1',
    name: 'Barber Apprenticeship',
    tagline: 'DOL-registered apprenticeship — earn while you learn',
    category: 'Cosmetology',
    credential: 'Indiana Barber License',
    modules: 10,
    lessons: 60,
    durationWeeks: 68,
    fundingEligible: true,
    color: 'bg-amber-500',
    icon: Scissors,
    features: ['DOL registered', 'Practical sign-off', 'State board prep', 'Shop placement'],
    previewModules: ['Barbering Fundamentals', 'Sanitation & Safety', 'Haircut Techniques'],
    isBlueprint: true,
  },
  {
    id: 'crs-indiana',
    blueprintId: 'crs-indiana-v1',
    name: 'Community Recovery Specialist',
    tagline: 'Indiana CRS credential — peer support & recovery coaching',
    category: 'Healthcare',
    credential: 'Indiana CRS',
    modules: 6,
    lessons: 36,
    durationWeeks: 8,
    fundingEligible: true,
    color: 'bg-brand-green-500',
    icon: Heart,
    features: ['IC&RC aligned', 'Ethics module', 'Checkpoint gating', 'Certificate auto-issue'],
    previewModules: ['Recovery Foundations', 'Ethics & Boundaries', 'Motivational Interviewing'],
    isBlueprint: true,
  },
  {
    id: 'peer-recovery-specialist',
    blueprintId: 'prs-indiana-v1',
    name: 'Peer Recovery Specialist',
    tagline: 'Indiana PRS credential — NAADAC aligned',
    category: 'Healthcare',
    credential: 'Indiana PRS',
    modules: 8,
    lessons: 48,
    durationWeeks: 10,
    fundingEligible: true,
    color: 'bg-teal-500',
    icon: Shield,
    features: ['NAADAC aligned', 'Trauma-informed', 'Practical labs', 'Exam authorization'],
    previewModules: ['Peer Support Principles', 'Trauma & Resilience', 'Documentation Skills'],
    isBlueprint: true,
  },

  // ── Starter scaffolds ────────────────────────────────────────────────────
  {
    id: 'healthcare-cert',
    blueprintId: 'ccma-v1',
    name: 'Certified Medical Assistant (CCMA)',
    tagline: 'NHA-aligned CCMA — full clinical & admin skills pathway',
    category: 'Healthcare',
    credential: 'NHA CCMA',
    modules: 13,
    lessons: 65,
    durationWeeks: 16,
    fundingEligible: true,
    color: 'bg-red-500',
    icon: Stethoscope,
    features: [
      'NHA exam aligned',
      'Clinical + admin skills',
      'Checkpoint quizzes',
      'Certificate pathway',
    ],
    previewModules: [
      'Medical Terminology',
      'Clinical Procedures',
      'Administrative Skills',
    ],
    isBlueprint: true,
  },
  {
    id: 'skilled-trades',
    name: 'Skilled Trades',
    tagline: 'HVAC, Electrical, Plumbing — trade cert scaffold',
    category: 'Trades',
    modules: 10,
    lessons: 50,
    durationWeeks: 12,
    fundingEligible: true,
    color: 'bg-orange-500',
    icon: Wrench,
    features: ['Safety modules', 'Hands-on labs', 'Code compliance', 'EPA/OSHA alignment'],
    previewModules: ['Safety & Tools', 'Core Systems', 'Troubleshooting & Repair'],
    isBlueprint: false,
  },
  {
    id: 'cdl-training',
    name: 'CDL Training',
    tagline: 'Class A/B CDL — pre-trip, skills, road test prep',
    category: 'Transportation',
    modules: 6,
    lessons: 30,
    durationWeeks: 4,
    fundingEligible: true,
    color: 'bg-slate-600',
    icon: Truck,
    features: ['Pre-trip inspection', 'Skills test prep', 'HOS regulations', 'DOT compliance'],
    previewModules: ['Vehicle Inspection', 'Basic Controls & Maneuvers', 'Road Skills'],
    isBlueprint: false,
  },
  {
    id: 'it-certification',
    name: 'IT Certification',
    tagline: 'CompTIA A+, Network+, Security+ scaffold',
    category: 'Technology',
    modules: 10,
    lessons: 60,
    durationWeeks: 12,
    fundingEligible: true,
    color: 'bg-violet-500',
    icon: Laptop,
    features: ['Domain-aligned modules', 'Practice exams', 'Lab simulations', 'Voucher pathway'],
    previewModules: ['Hardware & Software', 'Networking Fundamentals', 'Security Basics'],
    isBlueprint: false,
  },
  {
    id: 'soft-skills',
    name: 'Professional Development',
    tagline: 'Workplace readiness, communication, leadership',
    category: 'Professional',
    modules: 5,
    lessons: 20,
    durationWeeks: 4,
    fundingEligible: false,
    color: 'bg-pink-500',
    icon: Star,
    features: ['Self-paced', 'Reflection activities', 'Completion certificate', 'Short lessons'],
    previewModules: ['Workplace Communication', 'Time Management', 'Teamwork & Collaboration'],
    isBlueprint: false,
  },
  {
    id: 'blank',
    name: 'Blank Course',
    tagline: 'Start from scratch — full control over every module',
    category: 'Custom',
    modules: 0,
    lessons: 0,
    durationWeeks: 0,
    fundingEligible: false,
    color: 'bg-slate-400',
    icon: BookOpen,
    features: [
      'No pre-built content',
      'Add your own modules',
      'Full customization',
      'Any credential type',
    ],
    previewModules: [],
    isBlueprint: false,
  },
];

const CATEGORIES = [
  'All',
  'Healthcare',
  'Trades',
  'Business',
  'Cosmetology',
  'Transportation',
  'Technology',
  'Professional',
  'Custom',
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function TemplateGallery() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [seeding, setSeedingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Program creation form state — shown instead of UUID input
  const [showForm, setShowForm] = useState<string | null>(null);
  const [programName, setProgramName] = useState('');
  const [programCode, setProgramCode] = useState('');
  const [fundingEligible, setFundingEligible] = useState(true);
  const [durationWeeks, setDurationWeeks] = useState('');

  // Only complete, registered blueprints belong in the production template
  // gallery. Custom courses use the same Course Factory from the AI Builder.
  const filtered = TEMPLATES.filter((t) => t.isBlueprint).filter((t) => {
    const matchCat = category === 'All' || t.category === category;
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tagline.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function openForm(template: CourseTemplate) {
    setShowForm(template.id);
    setProgramName(template.name);
    setProgramCode(template.id.toUpperCase().replace(/-/g, '_'));
    setFundingEligible(template.fundingEligible);
    setDurationWeeks(String(template.durationWeeks || ''));
    setError(null);
  }

  async function handleUseTemplate(template: CourseTemplate) {
    if (showForm !== template.id) {
      openForm(template);
      return;
    }

    setSeedingId(template.id);
    setError(null);

    try {
      const progRes = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: programCode || template.id.toUpperCase().replace(/-/g, '_'),
          title: programName || template.name,
          funding_eligible: fundingEligible,
          duration_weeks: durationWeeks
            ? parseInt(durationWeeks)
            : template.durationWeeks || null,
          status: 'draft',
          category: template.category,
        }),
      });
      const progData = await progRes.json();
      if (!progRes.ok) throw new Error(progData.error || 'Failed to create program');
      const programId = progData.data?.id ?? progData.id;
      if (!programId) throw new Error('Program created but no ID returned');

      if (template.blueprintId) {
        const res = await fetch('/api/admin/course-builder/generate-from-blueprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blueprintId: template.blueprintId, programId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Seeding failed');
        router.push(`/studio/courses/${data.courseId ?? ''}`);
      } else {
        const result = await runCourseFactoryPipeline({
          title: programName || template.name,
          topic: template.tagline,
          programId,
          moduleCount: template.modules,
          lessonsPerModule: Math.max(1, Math.ceil(template.lessons / template.modules)),
          includeVideos: true,
          dryRun: false,
        });
        if (!result.courseId) throw new Error('Course Factory did not return a course ID');
        router.push(`/studio/courses/${result.courseId}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSeedingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-500 mb-1">
            Course Builder
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Choose a complete blueprint</h1>
          <p className="text-slate-500 text-sm">
            Every template runs through the canonical Course Factory for complete lessons,
            assessments, interactions, narration, visuals, and media.
          </p>

          {/* Search + filter */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-400"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    category === cat
                      ? 'bg-brand-red-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Blueprint badge legend */}
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-2 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-red-500 inline-block" />
          Blueprint — seeds a real course with full content
        </span>
      </div>

      {/* Template grid */}
      <div className="max-w-6xl mx-auto px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-16">
        {filtered.map((template) => {
          const Icon = template.icon;
          const isExpanded = expandedId === template.id;
          const isSeeding = seeding === template.id;
          const isShowingForm = showForm === template.id;

          return (
            <div
              key={template.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              {/* Card accent bar */}
              <div className={`h-1.5 w-full ${template.color}`} />

              <div className="p-5 flex flex-col flex-1">
                {/* Icon + badges */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${template.color} bg-opacity-10 flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-5 h-5 ${template.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {template.category}
                    </span>
                    {template.isBlueprint && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red-600 bg-brand-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> Blueprint
                      </span>
                    )}
                    {template.fundingEligible && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green-700 bg-brand-green-50 px-2 py-0.5 rounded-full">
                        WIOA
                      </span>
                    )}
                  </div>
                </div>

                {/* Name + tagline */}
                <h3 className="text-base font-extrabold text-slate-900 mb-1">{template.name}</h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">{template.tagline}</p>

                {/* Stats row */}
                {template.modules > 0 && (
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span>{template.modules} modules</span>
                    <span className="text-slate-200">·</span>
                    <span>{template.lessons} lessons</span>
                    <span className="text-slate-200">·</span>
                    <span>{template.durationWeeks}w</span>
                  </div>
                )}

                {/* Credential badge */}
                {template.credential && (
                  <div className="mb-3">
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                      🎓 {template.credential}
                    </span>
                  </div>
                )}

                {/* Expand toggle */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : template.id)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-3 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  {isExpanded ? 'Hide details' : 'Preview structure'}
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mb-4 space-y-3">
                    {/* Features */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                        Includes
                      </p>
                      <ul className="space-y-1">
                        {template.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                            <CheckCircle className="w-3 h-3 text-brand-green-500 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Preview modules */}
                    {template.previewModules.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                          Sample Modules
                        </p>
                        <ol className="space-y-1">
                          {template.previewModules.map((m, i) => (
                            <li key={m} className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                {i + 1}
                              </span>
                              {m}
                            </li>
                          ))}
                          {template.modules > 3 && (
                            <li className="text-xs text-slate-400 pl-6">
                              + {template.modules - 3} more modules...
                            </li>
                          )}
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {/* Program creation form — shown instead of UUID input */}
                {showForm === template.id && (
                  <div className="mb-3 space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                      New Program Details
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Program Name
                      </label>
                      <input
                        type="text"
                        value={programName}
                        onChange={(e) => setProgramName(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-400"
                        placeholder="e.g. HVAC Technician"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Program Code
                      </label>
                      <input
                        type="text"
                        value={programCode}
                        onChange={(e) => setProgramCode(e.target.value.toUpperCase())}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-red-400"
                        placeholder="e.g. HVAC_TECH"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Duration (weeks)
                      </label>
                      <input
                        type="number"
                        value={durationWeeks}
                        onChange={(e) => setDurationWeeks(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-400"
                        placeholder="e.g. 12"
                        min={1}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fundingEligible}
                        onChange={(e) => setFundingEligible(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      WIOA / WRG funding eligible
                    </label>
                    <p className="text-[10px] text-slate-400">
                      A new program record will be created automatically — no UUID needed.
                    </p>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-auto pt-2">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    disabled={isSeeding}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      template.isBlueprint
                        ? 'bg-brand-red-600 hover:bg-brand-red-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    } disabled:opacity-60`}
                  >
                    {isSeeding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Creating program &amp; seeding
                        course...
                      </>
                    ) : isShowingForm ? (
                      <>
                        <Play className="w-4 h-4" /> Create Program &amp; Seed Course
                      </>
                    ) : template.isBlueprint ? (
                      <>
                        <Zap className="w-4 h-4" /> Seed from Blueprint
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" /> Use Template
                      </>
                    )}
                  </button>
                  {template.isBlueprint && !isShowingForm && (
                    <p className="text-[10px] text-center text-slate-400 mt-1.5">
                      Creates a program record + seeds all modules, lessons &amp; quizzes
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
