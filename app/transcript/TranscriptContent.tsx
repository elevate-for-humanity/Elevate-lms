'use client';

import { Printer } from 'lucide-react';

interface Competency {
  code: string;
  name: string;
  type: string;
  status: 'completed' | 'in_progress' | 'not_started';
  score?: number | null;
}

interface Domain {
  code: string;
  name: string;
  theoryHours: number;
  ojtHours: number;
  completedCount: number;
  totalCount: number;
  competencies: Competency[];
}

interface TranscriptProps {
  student: { full_name: string; email: string; enrolled_at: string | null; program_title: string; progress: number; completed_at: string | null };
  domains: Domain[];
  totalTheoryHours: number;
  totalOjtHours: number;
  completedLessons: number;
  totalLessons: number;
  checkpointsPassed: number;
  totalCheckpoints: number;
  generatedAt: string;
}

const statusColor: Record<string, string> = {
  completed: 'text-green-700 bg-green-50',
  in_progress: 'text-yellow-700 bg-yellow-50',
  not_started: 'text-slate-400 bg-slate-50',
};
const statusLabel: Record<string, string> = {
  completed: 'Complete',
  in_progress: 'In Progress',
  not_started: 'Not Started',
};

export default function TranscriptContent({ student, domains, totalTheoryHours, totalOjtHours, completedLessons, totalLessons, checkpointsPassed, totalCheckpoints, generatedAt }: TranscriptProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-10 print:py-4 print:px-0">
        <div className="flex items-start justify-between mb-8 print:mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Official Student Transcript</p>
            <h1 className="text-2xl font-bold text-slate-900">Elevate for Humanity Career &amp; Technical Institute</h1>
            <p className="text-sm text-slate-500 mt-1">8888 Keystone Crossing, Suite 1300 · Indianapolis, IN 46240</p>
            <p className="text-xs text-slate-400 mt-1">ETPL Listed · DOL Registered Apprenticeship #2025-IN-132301</p>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 print:hidden">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 border rounded-xl p-6 mb-8 bg-slate-50 print:mb-4">
          <div className="space-y-3">
            {[['Student', student.full_name], ['Email', student.email], ['Program', student.program_title]].map(([label, val]) => (
              <div key={label}><p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p><p className="font-semibold text-slate-900 text-sm">{val}</p></div>
            ))}
          </div>
          <div className="space-y-3">
            <div><p className="text-xs text-slate-400 uppercase tracking-wide">Enrolled</p><p className="text-sm text-slate-700">{student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</p></div>
            <div><p className="text-xs text-slate-400 uppercase tracking-wide">Completion Date</p><p className="text-sm text-slate-700">{student.completed_at ? new Date(student.completed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'In Progress'}</p></div>
            <div><p className="text-xs text-slate-400 uppercase tracking-wide">Overall Progress</p><p className="text-sm font-semibold text-slate-900">{student.progress}%</p></div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8 print:mb-4">
          {[['Theory Hours', `${totalTheoryHours}h`], ['OJT Hours', `${totalOjtHours}h`], ['Lessons Complete', `${completedLessons}/${totalLessons}`], ['Checkpoints Passed', `${checkpointsPassed}/${totalCheckpoints}`]].map(([label, value]) => (
            <div key={label as string} className="border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {domains.map((domain) => (
            <div key={domain.code} className="border rounded-xl overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
                <div><span className="text-xs font-bold uppercase tracking-widest text-slate-400 mr-2">{domain.code}</span><span className="font-semibold">{domain.name}</span></div>
                <div className="text-xs text-slate-400">{domain.completedCount}/{domain.totalCount} · {domain.theoryHours}h theory · {domain.ojtHours}h OJT</div>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 w-16">Code</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Competency</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 w-24">Type</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 w-28">Status</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500 w-16">Score</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {domain.competencies.map((comp) => (
                    <tr key={comp.code} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-xs text-slate-400 font-mono">{comp.code}</td>
                      <td className="px-4 py-2.5 text-slate-700">{comp.name}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{comp.type}</td>
                      <td className="px-4 py-2.5"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[comp.status]}`}>{statusLabel[comp.status]}</span></td>
                      <td className="px-4 py-2.5 text-right text-xs text-slate-500">{comp.score != null ? `${comp.score}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t text-center print:mt-6">
          <p className="text-xs text-slate-400">Generated {generatedAt} · Elevate for Humanity Career &amp; Technical Institute · info@elevateforhumanity.org · (317) 314-3757</p>
          <p className="text-xs text-slate-400 mt-1">This transcript is an official record of competency mastery. Verify at elevateforhumanity.org/verify</p>
        </div>
      </div>
    </div>
  );
}
