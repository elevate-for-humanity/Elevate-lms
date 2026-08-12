'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight, BookOpen, CheckCircle, ChevronDown, ChevronUp, DollarSign, Heart,
  Laptop, Loader2, Play, Scissors, Search, Shield, Star, Stethoscope, Truck, Wrench, Zap,
} from 'lucide-react';

export type CourseTemplate = {
  id: string;
  blueprintId?: string;
  name: string;
  tagline: string;
  category: string;
  credential?: string;
  modules: number;
  lessons: number;
  durationWeeks: number;
  fundingEligible: boolean;
  icon: React.ElementType;
  features: string[];
  previewModules: string[];
  isBlueprint: boolean;
};

const TEMPLATES: CourseTemplate[] = [
  { id:'bookkeeping-quickbooks', blueprintId:'bookkeeping-quickbooks-v1', name:'Bookkeeping & QuickBooks', tagline:'Full bookkeeping certification with QuickBooks Online', category:'Business', credential:'QuickBooks Certified User', modules:8, lessons:48, durationWeeks:10, fundingEligible:true, icon:DollarSign, features:['QuickBooks Online','Payroll basics','Financial statements','Checkpoint quizzes'], previewModules:['Accounting Fundamentals','QuickBooks Setup & Navigation','Invoicing & Payments'], isBlueprint:true },
  { id:'barber-apprenticeship', blueprintId:'barber-apprenticeship-v1', name:'Barber Apprenticeship', tagline:'DOL-registered apprenticeship — earn while you learn', category:'Cosmetology', credential:'Indiana Barber License', modules:10, lessons:60, durationWeeks:68, fundingEligible:true, icon:Scissors, features:['DOL registered','Practical sign-off','State board prep','Shop placement'], previewModules:['Barbering Fundamentals','Sanitation & Safety','Haircut Techniques'], isBlueprint:true },
  { id:'crs-indiana', blueprintId:'crs-indiana-v1', name:'Community Recovery Specialist', tagline:'Indiana CRS credential — peer support & recovery coaching', category:'Healthcare', credential:'Indiana CRS', modules:6, lessons:36, durationWeeks:8, fundingEligible:true, icon:Heart, features:['IC&RC aligned','Ethics module','Checkpoint gating','Certificate pathway'], previewModules:['Recovery Foundations','Ethics & Boundaries','Motivational Interviewing'], isBlueprint:true },
  { id:'peer-recovery-specialist', blueprintId:'prs-indiana-v1', name:'Peer Recovery Specialist', tagline:'Indiana PRS credential — NAADAC aligned', category:'Healthcare', credential:'Indiana PRS', modules:8, lessons:48, durationWeeks:10, fundingEligible:true, icon:Shield, features:['NAADAC aligned','Trauma-informed','Practical labs','Exam authorization'], previewModules:['Peer Support Principles','Trauma & Resilience','Documentation Skills'], isBlueprint:true },
  { id:'healthcare-cert', blueprintId:'ccma-v1', name:'Certified Medical Assistant (CCMA)', tagline:'NHA-aligned CCMA — full clinical & admin skills pathway', category:'Healthcare', credential:'NHA CCMA', modules:13, lessons:65, durationWeeks:16, fundingEligible:true, icon:Stethoscope, features:['NHA exam aligned','Clinical + admin skills','Checkpoint quizzes','Certificate pathway'], previewModules:['Medical Terminology','Clinical Procedures','Administrative Skills'], isBlueprint:true },
  { id:'skilled-trades', name:'Skilled Trades', tagline:'HVAC, Electrical, Plumbing — trade certification scaffold', category:'Trades', modules:10, lessons:50, durationWeeks:12, fundingEligible:true, icon:Wrench, features:['Safety modules','Hands-on labs','Code compliance','EPA/OSHA alignment'], previewModules:['Safety & Tools','Core Systems','Troubleshooting & Repair'], isBlueprint:false },
  { id:'cdl-training', name:'CDL Training', tagline:'Class A/B CDL — pre-trip, skills, road test prep', category:'Transportation', modules:6, lessons:30, durationWeeks:4, fundingEligible:true, icon:Truck, features:['Pre-trip inspection','Skills test prep','HOS regulations','DOT compliance'], previewModules:['Vehicle Inspection','Basic Controls & Maneuvers','Road Skills'], isBlueprint:false },
  { id:'it-certification', name:'IT Certification', tagline:'CompTIA A+, Network+, Security+ scaffold', category:'Technology', modules:10, lessons:60, durationWeeks:12, fundingEligible:true, icon:Laptop, features:['Domain-aligned modules','Practice exams','Lab simulations','Voucher pathway'], previewModules:['Hardware & Software','Networking Fundamentals','Security Basics'], isBlueprint:false },
  { id:'soft-skills', name:'Professional Development', tagline:'Workplace readiness, communication, leadership', category:'Professional', modules:5, lessons:20, durationWeeks:4, fundingEligible:false, icon:Star, features:['Self-paced','Reflection activities','Completion certificate','Short lessons'], previewModules:['Workplace Communication','Time Management','Teamwork & Collaboration'], isBlueprint:false },
  { id:'blank', name:'Blank Course', tagline:'Start from scratch — full control over every module', category:'Custom', modules:0, lessons:0, durationWeeks:0, fundingEligible:false, icon:BookOpen, features:['No pre-built content','Add your own modules','Full customization','Any credential type'], previewModules:[], isBlueprint:false },
];
const CATEGORIES = ['All','Healthcare','Trades','Business','Cosmetology','Transportation','Technology','Professional','Custom'];

export default function CourseTemplateGallery({ onCourseCreated }: { onCourseCreated: (courseId: string) => void | Promise<void> }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [seeding, setSeeding] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<string | null>(null);
  const [programName, setProgramName] = useState('');
  const [programCode, setProgramCode] = useState('');
  const [fundingEligible, setFundingEligible] = useState(true);
  const [durationWeeks, setDurationWeeks] = useState('');

  const filtered = useMemo(() => TEMPLATES.filter((template) => {
    const categoryMatch = category === 'All' || template.category === category;
    const q = search.trim().toLowerCase();
    return categoryMatch && (!q || template.name.toLowerCase().includes(q) || template.tagline.toLowerCase().includes(q) || template.credential?.toLowerCase().includes(q));
  }), [search, category]);

  function openProgramForm(template: CourseTemplate) {
    setShowForm(template.id);
    setProgramName(template.name);
    setProgramCode(template.id.toUpperCase().replace(/-/g, '_'));
    setFundingEligible(template.fundingEligible);
    setDurationWeeks(String(template.durationWeeks || ''));
    setError('');
  }

  async function createProgram(template: CourseTemplate): Promise<string> {
    const response = await fetch('/api/admin/programs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: programCode || template.id.toUpperCase().replace(/-/g, '_'),
        title: programName || template.name,
        funding_eligible: fundingEligible,
        duration_weeks: durationWeeks ? Number(durationWeeks) : template.durationWeeks || null,
        status: 'draft',
        category: template.category,
      }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Failed to create program');
    const id = body.data?.id ?? body.id;
    if (!id) throw new Error('Program created but no ID was returned');
    return id;
  }

  async function useTemplate(template: CourseTemplate) {
    if (template.isBlueprint && showForm !== template.id) return openProgramForm(template);
    setSeeding(template.id); setError('');
    try {
      let courseId = '';
      if (template.isBlueprint && template.blueprintId) {
        const programId = await createProgram(template);
        const response = await fetch('/api/admin/course-builder/generate-from-blueprint', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blueprintId: template.blueprintId, programId, mode: 'missing-only', contentSource: 'ai', videoMode: 'queue' }),
        });
        const body = await response.json();
        if (!response.ok || !body.ok) throw new Error(body.error || body.errors?.join('; ') || 'Blueprint seeding failed');
        courseId = body.courseId;
      } else if (template.id === 'blank') {
        const response = await fetch('/api/admin/courses', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Untitled Course', slug: `untitled-course-${Date.now().toString(36)}`, description: 'Blank course created from the Course Builder template gallery.', status: 'draft' }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Failed to create blank course');
        courseId = (Array.isArray(body) ? body[0]?.id : body.id) || '';
      } else {
        const response = await fetch('/api/admin/course-builder/automatic', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: template.name,
            audience: 'Workforce and career-training learners',
            credentialOrExam: template.credential,
            prompt: `${template.tagline}. Include these capabilities: ${template.features.join(', ')}. Suggested modules: ${template.previewModules.join(', ')}.`,
          }),
        });
        const body = await response.json();
        if (!response.ok || !body.ok) throw new Error(body.error || 'Template generation failed');
        courseId = body.course_id;
      }
      if (!courseId) throw new Error('Course operation completed without a course ID');
      await onCourseCreated(courseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Template operation failed');
    } finally { setSeeding(null); }
  }

  return (
    <div className="space-y-5 rounded-2xl bg-slate-50 p-5 text-slate-900">
      <div><p className="text-xs font-bold uppercase tracking-widest text-brand-red-500">Course templates</p><h2 className="text-2xl font-extrabold">Choose a starting point</h2><p className="text-sm text-slate-600">Use a regulated blueprint, an AI-assisted scaffold, or a blank course. Every result opens in the same canonical Course Builder.</p></div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative max-w-md flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates..." className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm" /></div><div className="flex flex-wrap gap-2">{CATEGORIES.map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${category === item ? 'bg-brand-red-600 text-white' : 'border bg-white text-slate-600'}`}>{item}</button>)}</div></div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((template) => {
        const Icon = template.icon; const expanded = expandedId === template.id; const formOpen = showForm === template.id; const busy = seeding === template.id;
        return <article key={template.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100"><Icon className="h-5 w-5 text-slate-700" /></div><div className="flex gap-1.5"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">{template.category}</span>{template.isBlueprint && <span className="flex items-center gap-1 rounded-full bg-brand-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-red-600"><Zap className="h-2.5 w-2.5" />Blueprint</span>}</div></div><h3 className="mt-3 font-extrabold">{template.name}</h3><p className="mt-1 text-xs leading-relaxed text-slate-500">{template.tagline}</p>{template.modules > 0 && <p className="mt-3 text-xs text-slate-500">{template.modules} modules · {template.lessons} lessons · {template.durationWeeks} weeks</p>}{template.credential && <p className="mt-2 text-xs font-semibold text-slate-600">🎓 {template.credential}</p>}
        <button onClick={() => setExpandedId(expanded ? null : template.id)} className="mt-3 flex items-center gap-1 text-xs text-slate-500">{expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}{expanded ? 'Hide details' : 'Preview details'}</button>
        {expanded && <div className="mt-3 space-y-3 rounded-lg bg-slate-50 p-3"><ul className="space-y-1">{template.features.map((feature) => <li key={feature} className="flex items-center gap-2 text-xs text-slate-600"><CheckCircle className="h-3 w-3 text-green-600" />{feature}</li>)}</ul>{template.previewModules.length > 0 && <ol className="space-y-1 border-t pt-2">{template.previewModules.map((module, index) => <li key={module} className="text-xs text-slate-600">{index + 1}. {module}</li>)}</ol>}</div>}
        {formOpen && template.isBlueprint && <div className="mt-3 space-y-2 rounded-xl border bg-slate-50 p-3"><input value={programName} onChange={(e) => setProgramName(e.target.value)} placeholder="Program name" className="w-full rounded-lg border px-3 py-2 text-sm" /><input value={programCode} onChange={(e) => setProgramCode(e.target.value.toUpperCase())} placeholder="PROGRAM_CODE" className="w-full rounded-lg border px-3 py-2 font-mono text-sm" /><input type="number" min={1} value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)} placeholder="Duration weeks" className="w-full rounded-lg border px-3 py-2 text-sm" /><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={fundingEligible} onChange={(e) => setFundingEligible(e.target.checked)} />Funding eligible</label></div>}
        <button onClick={() => void useTemplate(template)} disabled={busy} className={`mt-auto flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white ${template.isBlueprint ? 'bg-brand-red-600 hover:bg-brand-red-700' : 'bg-slate-900 hover:bg-slate-800'} disabled:opacity-60`}>{busy ? <><Loader2 className="h-4 w-4 animate-spin" />Working…</> : formOpen && template.isBlueprint ? <><Play className="h-4 w-4" />Create Program + Seed</> : template.isBlueprint ? <><Zap className="h-4 w-4" />Seed Blueprint</> : <><ArrowRight className="h-4 w-4" />Use Template</>}</button></article>;
      })}</div>
    </div>
  );
}
