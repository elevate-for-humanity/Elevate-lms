import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, Circle, Clock, Plus, AlertTriangle,
  Scissors, ShieldCheck, FlaskConical, Leaf, Users, BookOpen, ChevronDown,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Competency Progress | Apprentice Portal | Elevate for Humanity',
  description:
    'Track your Indiana DOL barber apprenticeship Work Process Schedule (WPS) competencies — cuts, shaves, chemical services, sanitation, and RTI theory.',
};

export const dynamic = 'force-dynamic';

// Indiana DOL WPS: 2,000 OJL hours + 144 RTI hours/year
const OJL_REQUIRED = 2000;
const RTI_REQUIRED = 144;

// Icon map keyed by category order
const CATEGORY_ICONS: Record<number, React.ElementType> = {
  1: Scissors,
  2: Scissors,
  3: FlaskConical,
  4: Leaf,
  5: ShieldCheck,
  6: Users,
  7: BookOpen,
};

type SkillWithProgress = {
  id: string;
  name: string;
  description: string | null;
  order: number;
  total_logged: number;
  total_hours: number;
  verified_count: number;
  last_logged: string | null;
};

type CategoryWithSkills = {
  id: string;
  name: string;
  description: string | null;
  order: number;
  skills: SkillWithProgress[];
};

function StatusPill({ verified, pending }: { verified: number; pending: number }) {
  if (verified > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        <CheckCircle2 className="w-3 h-3" /> {verified} verified
      </span>
    );
  }
  if (pending > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
        <Clock className="w-3 h-3" /> {pending} pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
      <Circle className="w-3 h-3" /> Not started
    </span>
  );
}

export default async function ApprenticeCompetenciesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) redirect('/login?redirect=/apprentice/competencies');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apprentice/competencies');

  // Resolve barber program_id
  const { data: program } = await db
    .from('programs')
    .select('id, name')
    .eq('slug', 'barber-apprenticeship')
    .single();

  const programId = program?.id ?? null;

  // Load skill categories for barber program
  const { data: rawCategories } = await db
    .from('skill_categories')
    .select('id, name, description, order')
    .eq('program_id', programId)
    .order('order', { ascending: true });

  // Load skills for barber program
  const { data: rawSkills } = await db
    .from('apprentice_skills')
    .select('id, category_id, name, description, order')
    .eq('program_id', programId)
    .order('order', { ascending: true });

  // Load this apprentice's competency log entries
  const { data: logEntries } = await db
    .from('competency_log')
    .select('id, skill_id, service_count, hours_credited, status, work_date, supervisor_verified')
    .eq('apprentice_id', user.id)
    .order('work_date', { ascending: false });

  const entries = logEntries ?? [];

  // Aggregate per skill
  const skillStats: Record<string, { total: number; hours: number; verified: number; pending: number; last: string | null }> = {};
  for (const e of entries) {
    if (!skillStats[e.skill_id]) {
      skillStats[e.skill_id] = { total: 0, hours: 0, verified: 0, pending: 0, last: null };
    }
    skillStats[e.skill_id].total += e.service_count ?? 1;
    skillStats[e.skill_id].hours += Number(e.hours_credited ?? 0);
    if (e.status === 'verified') skillStats[e.skill_id].verified += e.service_count ?? 1;
    if (e.status === 'pending') skillStats[e.skill_id].pending += e.service_count ?? 1;
    if (!skillStats[e.skill_id].last || e.work_date > skillStats[e.skill_id].last!) {
      skillStats[e.skill_id].last = e.work_date;
    }
  }

  // Build categories with enriched skills
  const categories: CategoryWithSkills[] = (rawCategories ?? []).map((cat: any) => ({
    ...cat,
    skills: (rawSkills ?? [])
      .filter((s: any) => s.category_id === cat.id)
      .map((s: any) => ({
        ...s,
        total_logged: skillStats[s.id]?.total ?? 0,
        total_hours: skillStats[s.id]?.hours ?? 0,
        verified_count: skillStats[s.id]?.verified ?? 0,
        last_logged: skillStats[s.id]?.last ?? null,
      })),
  }));

  // OJL hours from competency log (non-RTI categories = order 1–6)
  const ojlCategories = categories.filter(c => c.order <= 6);
  const rtiCategory = categories.find(c => c.order === 7);

  const ojlHoursLogged = ojlCategories
    .flatMap(c => c.skills)
    .reduce((sum, s) => sum + s.total_hours, 0);

  const rtiSkillsVerified = rtiCategory?.skills.filter(s => s.verified_count > 0).length ?? 0;
  const rtiSkillsTotal = rtiCategory?.skills.length ?? 0;

  const totalSkills = (rawSkills ?? []).length;
  const startedSkills = Object.keys(skillStats).length;
  const verifiedSkills = Object.values(skillStats).filter(s => s.verified > 0).length;

  const ojlPercent = Math.min(Math.round((ojlHoursLogged / OJL_REQUIRED) * 100), 100);

  // Recent log entries (last 5)
  const recentEntries = entries.slice(0, 5);
  const skillNameMap: Record<string, string> = {};
  for (const s of rawSkills ?? []) {
    skillNameMap[(s as any).id] = (s as any).name;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Apprentice Portal', href: '/apprentice' },
            { label: 'Competency Progress' },
          ]} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Competency Progress</h1>
            <p className="text-slate-500 text-sm mt-1">
              Indiana DOL Work Process Schedule — Barber Apprenticeship (330.371-010)
            </p>
          </div>
          <Link
            href="/apprentice/competencies/log"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Log Service
          </Link>
        </div>

        {/* No data warning */}
        {categories.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Competency data not yet loaded</p>
              <p className="text-sm text-amber-700 mt-1">
                The Indiana WPS competency list needs to be applied in the Supabase Dashboard.
                Ask your program administrator to run migration{' '}
                <code className="font-mono text-xs bg-amber-100 px-1 rounded">20260527000002_barber_wps_competencies.sql</code>.
              </p>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">OJL Hours Logged</p>
            <p className="text-2xl font-black text-slate-900">{ojlHoursLogged.toFixed(1)}</p>
            <p className="text-xs text-slate-400">of {OJL_REQUIRED.toLocaleString()} required</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Skills Started</p>
            <p className="text-2xl font-black text-slate-900">{startedSkills}</p>
            <p className="text-xs text-slate-400">of {totalSkills} total</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Skills Verified</p>
            <p className="text-2xl font-black text-green-700">{verifiedSkills}</p>
            <p className="text-xs text-slate-400">supervisor sign-off</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">RTI Theory</p>
            <p className="text-2xl font-black text-brand-blue-700">{rtiSkillsVerified}/{rtiSkillsTotal}</p>
            <p className="text-xs text-slate-400">modules verified</p>
          </div>
        </div>

        {/* OJL progress bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">OJL Hours Progress</span>
            <span className="text-sm text-slate-500">{ojlHoursLogged.toFixed(1)} / {OJL_REQUIRED.toLocaleString()} hrs ({ojlPercent}%)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="bg-brand-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${ojlPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Indiana DOL requires 2,000 OJL hours + 144 RTI hours/year for barber apprenticeship (Occupation 330.371-010)
          </p>
        </div>

        {/* WPS Category Sections */}
        <div className="space-y-4 mb-10">
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.order] ?? BookOpen;
            const catVerified = cat.skills.filter(s => s.verified_count > 0).length;
            const catTotal = cat.skills.length;
            const catHours = cat.skills.reduce((sum, s) => sum + s.total_hours, 0);
            const isRTI = cat.order === 7;

            return (
              <details key={cat.id} className="bg-white rounded-xl border border-slate-200 shadow-sm group" open>
                <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none select-none">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isRTI ? 'bg-purple-100 text-purple-600' : 'bg-brand-blue-50 text-brand-blue-600'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{cat.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-500 hidden sm:block">
                      {catVerified}/{catTotal} verified
                      {!isRTI && catHours > 0 && ` · ${catHours.toFixed(1)} hrs`}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                  </div>
                </summary>

                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {cat.skills.map((skill) => {
                    const pending = (skillStats[skill.id]?.pending ?? 0);
                    return (
                      <div key={skill.id} className="px-5 py-4 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{skill.name}</p>
                          {skill.description && (
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{skill.description}</p>
                          )}
                          {skill.last_logged && (
                            <p className="text-xs text-slate-400 mt-1">
                              Last logged: {new Date(skill.last_logged).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {!isRTI && skill.total_hours > 0 && ` · ${skill.total_hours.toFixed(1)} hrs total`}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusPill verified={skill.verified_count} pending={pending} />
                          <Link
                            href={`/apprentice/competencies/log?skill=${skill.id}`}
                            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:border-brand-blue-300 transition whitespace-nowrap"
                          >
                            + Log
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>

        {/* Recent activity */}
        {recentEntries.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 text-sm">Recent Entries</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {recentEntries.map((e: any) => (
                <div key={e.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {skillNameMap[e.skill_id] ?? 'Unknown skill'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(e.work_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}{e.service_count ?? 1}× · {Number(e.hours_credited ?? 0).toFixed(1)} hrs
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    e.status === 'verified'
                      ? 'bg-green-100 text-green-800'
                      : e.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {e.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
