import { AlertCircle, CheckCircle2, Clock3, MinusCircle } from 'lucide-react';

const styles = {
  complete: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  in_progress: 'border-blue-300 bg-blue-50 text-blue-900',
  missing: 'border-red-300 bg-red-50 text-red-900',
  pending_review: 'border-amber-300 bg-amber-50 text-amber-950',
  blocked: 'border-red-400 bg-red-50 text-red-950',
  not_applicable: 'border-slate-300 bg-slate-50 text-slate-700',
} as const;

export function LearnerStatusBadge({ status }: { status: keyof typeof styles }) {
  const Icon = status === 'complete' ? CheckCircle2 : status === 'pending_review' || status === 'in_progress' ? Clock3 : status === 'not_applicable' ? MinusCircle : AlertCircle;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black capitalize ${styles[status]}`}><Icon className="h-3.5 w-3.5" />{status.replace(/_/g, ' ')}</span>;
}
