'use client';

import { Edit2, ExternalLink, AlertTriangle } from 'lucide-react';
import type { ExamSession } from './types';
import { PROVIDER_LABELS, STATUS_LABELS, RESULT_LABELS } from './types';

const RESULT_COLORS: Record<string, string> = {
  pass: 'bg-brand-green-100 text-brand-green-800',
  fail: 'bg-brand-red-100 text-brand-red-800',
  pending: 'bg-amber-100 text-amber-800',
  incomplete: 'bg-slate-100 text-slate-600',
};

const STATUS_COLORS: Record<string, string> = {
  checked_in: 'bg-brand-blue-100 text-brand-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-brand-green-100 text-brand-green-800',
  voided: 'bg-brand-red-100 text-brand-red-800',
  no_show: 'bg-slate-100 text-slate-600',
};

const DELIVERY_LABELS: Record<string, string> = {
  in_person: 'In-Person',
  online_proctored: 'Online',
  hybrid: 'Hybrid',
};

export default function SessionRow({ session: s, onEdit }: { session: ExamSession; onEdit: (s: ExamSession) => void }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
        {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-slate-900">{s.student_name}</span>
          {s.review_status === 'flagged' && (
            <span title={s.flag_reason || 'Flagged for review'} className="inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3" /> Flagged
            </span>
          )}
          {s.review_status === 'invalidated' && (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider bg-brand-red-100 text-brand-red-700 px-1.5 py-0.5 rounded">Invalidated</span>
          )}
        </div>
        {s.student_email && <div className="text-xs text-slate-400">{s.student_email}</div>}
        {s.is_retest && <span className="inline-block mt-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Retest</span>}
        {s.event_count > 0 && (
          <div className="text-[10px] text-slate-400 mt-0.5">
            {s.event_count} events · {s.tab_switch_count} tab switches · {s.fullscreen_exit_count} FS exits
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
        {PROVIDER_LABELS[s.provider]}
      </td>
      <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">
        {s.exam_name}
      </td>
      <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
        {DELIVERY_LABELS[s.delivery_method] || s.delivery_method}
      </td>
      <td className="px-4 py-3 text-center">
        {s.id_verified ? (
          <span className="inline-block w-5 h-5 bg-brand-green-100 text-brand-green-700 rounded-full text-xs leading-5 font-bold">✓</span>
        ) : (
          <span className="inline-block w-5 h-5 bg-brand-red-100 text-brand-red-700 rounded-full text-xs leading-5 font-bold">✗</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[s.status] || 'bg-slate-100 text-slate-600'}`}>
          {STATUS_LABELS[s.status]}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${RESULT_COLORS[s.result] || 'bg-slate-100 text-slate-600'}`}>
          {RESULT_LABELS[s.result]}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-mono text-slate-700">
        {s.score != null ? `${s.score}%` : '—'}
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => onEdit(s)} className="p-1.5 text-slate-400 hover:text-brand-blue-600 hover:bg-brand-blue-50 rounded" title="Edit session">
            <Edit2 className="w-4 h-4" />
          </button>
          {s.evidence_url && (
            <a href={s.evidence_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-brand-blue-600 hover:bg-brand-blue-50 rounded" title="View evidence">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}
