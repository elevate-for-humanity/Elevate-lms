import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Plus,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Accreditation | Admin',
};

const CAT_LABELS: Record<string, string> = {
  curriculum: 'Curriculum & Instruction',
  faculty: 'Faculty & Staff',
  facilities: 'Facilities & Resources',
  student_services: 'Student Services',
  governance: 'Governance & Administration',
  outcomes: 'Student Outcomes',
};

export default async function AccreditationPage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();

  const [standardsRes, evidenceRes] = await Promise.all([
    db
      .from('accreditation_standards')
      .select('id, name, description, category, required, sort_order')
      .order('category')
      .order('sort_order'),
    db.from('accreditation_evidence').select('id, standard_id, status, submitted_at, reviewed_at'),
  ]);

  const standards = standardsRes.data ?? [];
  const evidence = evidenceRes.data ?? [];

  // Map standard_id → evidence status
  const evidenceMap: Record<string, string> = {};
  for (const e of evidence) {
    const sid = (e as any).standard_id;
    if (sid) evidenceMap[sid] = (e as any).status ?? 'submitted';
  }

  const required = standards.filter((s: any) => s.required);
  const met = required.filter((s: any) => evidenceMap[s.id] === 'approved');
  const pending = required.filter(
    (s: any) => evidenceMap[s.id] && evidenceMap[s.id] !== 'approved',
  );
  const missing = required.filter((s: any) => !evidenceMap[s.id]);
  const readiness = required.length > 0 ? Math.round((met.length / required.length) * 100) : 0;

  // Group by category
  const byCategory: Record<string, typeof standards> = {};
  for (const s of standards) {
    const cat = (s as any).category ?? 'other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(s);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">
            Admin
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Accreditation</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-brand-blue-600" />
              Accreditation Readiness
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {met.length} of {required.length} required standards met
            </p>
          </div>
          <Link
            href="/admin/accreditation"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Submit Evidence
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Readiness score */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Overall Readiness Score</h2>
            <span
              className={`text-3xl font-bold tabular-nums ${readiness >= 80 ? 'text-green-600' : readiness >= 50 ? 'text-amber-600' : 'text-red-600'}`}
            >
              {readiness}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${readiness >= 80 ? 'bg-green-500' : readiness >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${readiness}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[
              { label: 'Met', value: met.length, color: 'text-green-600', bg: 'bg-green-50' },
              {
                label: 'Pending',
                value: pending.length,
                color: 'text-amber-600',
                bg: 'bg-amber-50',
              },
              {
                label: 'Missing',
                value: missing.length,
                color: 'text-red-600',
                bg: 'bg-red-50',
                urgent: missing.length > 0,
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`rounded-xl p-4 ${s.bg} ${(s as any).urgent ? 'ring-1 ring-red-200' : ''}`}
              >
                <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                <p className="text-xs font-medium text-slate-600 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Standards by category */}
        {Object.entries(byCategory).map(([cat, catStandards]) => {
          const catMet = catStandards.filter((s: any) => evidenceMap[s.id] === 'approved').length;
          const catTotal = catStandards.length;
          const catRate = catTotal > 0 ? Math.round((catMet / catTotal) * 100) : 0;
          return (
            <div
              key={cat}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900 text-sm">
                    {CAT_LABELS[cat] ?? cat.replace(/_/g, ' ')}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {catMet}/{catTotal} standards met
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${catRate >= 80 ? 'bg-green-500' : catRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${catRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-8 text-right">
                    {catRate}%
                  </span>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {catStandards.map((s: any) => {
                  const status = evidenceMap[s.id];
                  return (
                    <div
                      key={s.id}
                      className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50"
                    >
                      <div className="flex-shrink-0">
                        {status === 'approved' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : status ? (
                          <Clock className="w-4 h-4 text-amber-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {s.name}
                        </p>
                        {s.required && (
                          <span className="text-[10px] text-rose-600 font-semibold">Required</span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : status
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {status ?? 'No evidence'}
                      </span>
                      <Link
                        href={`/admin/accreditation/standards/${s.id}`}
                        className="text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700 flex-shrink-0"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
