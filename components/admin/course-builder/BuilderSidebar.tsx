'use client';

'use client';

import type { ElementType } from 'react';
import Link from 'next/link';
import {
  CheckCircle, XCircle, AlertCircle, Plus, Eye,
  BookOpen, Video, AlertTriangle, Layers,
} from 'lucide-react';
import type { ProgramBuilderState, ProgramDerivedState } from './types';

interface Props {
  state: ProgramBuilderState;
  derived: ProgramDerivedState;
  onAddLesson?: () => void;
  onAddModule?: () => void;
  onPreview?: () => void;
}

// Each checklist item maps to a required field
const CHECKLIST_ITEMS: {
  key: string;
  label: string;
  check: (s: ProgramBuilderState, d: ProgramDerivedState) => boolean;
  href?: string;
}[] = [
  { key: 'title',       label: 'Program title',       check: (s) => !!s.title?.trim() },
  { key: 'description', label: 'Description',          check: (s) => !!s.description?.trim() },
  { key: 'hero',        label: 'Hero image',           check: (s) => !!s.hero_image_url },
  { key: 'outcomes',    label: '3+ learning outcomes', check: (s) => s.outcomes.length >= 3 },
  { key: 'curriculum',  label: '1+ phase, 3+ modules, 10+ lessons',
    check: (_, d) => d.totalPhases >= 1 && d.totalModules >= 3 && d.totalLessons >= 10 },
  { key: 'duration',    label: 'Duration set',         check: (s) => !!s.estimated_weeks },
  { key: 'delivery',    label: 'Delivery mode',        check: (s) => !!s.delivery_method },
  { key: 'cta',         label: 'Primary CTA',          check: (s) => s.ctas.length > 0 },
];

export default function BuilderSidebar({ state, derived, onAddLesson, onAddModule, onPreview }: Props) {
  const completedCount = CHECKLIST_ITEMS.filter(item => item.check(state, derived)).length;
  const totalCount = CHECKLIST_ITEMS.length;

  return (
    <div className="sticky top-20 space-y-4">

      {/* ── Completion Checklist ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Publish Checklist</h3>
            <span className={`text-xs font-semibold tabular-nums ${completedCount === totalCount ? 'text-emerald-600' : 'text-slate-500'}`}>
              {completedCount}/{totalCount}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${completedCount === totalCount ? 'bg-emerald-500' : 'bg-brand-blue-500'}`}
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
        <ul className="divide-y divide-slate-50 px-5 py-2">
          {CHECKLIST_ITEMS.map(item => {
            const done = item.check(state, derived);
            return (
              <li key={item.key} className="flex items-center gap-2.5 py-2">
                {done
                  ? <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                  : <XCircle className="h-4 w-4 flex-shrink-0 text-slate-300" />
                }
                <span className={`text-xs ${done ? 'text-slate-600' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Program Health ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Program Health</h3>
          <p className="mt-0.5 text-xs text-slate-500">Content coverage across all lessons</p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <HealthRow
            icon={Layers}
            label="Total lessons"
            value={String(derived.totalLessons)}
            status={derived.totalLessons >= 10 ? 'ok' : 'warn'}
          />
          <HealthRow
            icon={AlertCircle}
            label="Empty lessons"
            value={String(derived.emptyLessons)}
            status={derived.emptyLessons === 0 ? 'ok' : 'error'}
            note={derived.emptyLessons > 0 ? 'No video or reading' : undefined}
          />
          <HealthRow
            icon={Video}
            label="Missing video"
            value={String(derived.lessonsMissingVideo)}
            status={derived.lessonsMissingVideo === 0 ? 'ok' : 'warn'}
          />
          <HealthRow
            icon={BookOpen}
            label="Missing reading"
            value={String(derived.lessonsMissingReading)}
            status={derived.lessonsMissingReading === 0 ? 'ok' : 'warn'}
          />
          <HealthRow
            icon={AlertTriangle}
            label="Unpublished lessons"
            value={String(
              state.phases.flatMap(p => p.modules.flatMap(m => m.lessons))
                .filter(l => !l.is_published).length
            )}
            status="ok"
          />
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Quick Actions</h3>
        </div>
        <div className="px-5 py-4 space-y-2">
          <button
            onClick={onAddLesson}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
          >
            <Plus className="h-4 w-4 text-brand-blue-500" />
            Add Lesson
          </button>
          <button
            onClick={onAddModule}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
          >
            <Plus className="h-4 w-4 text-brand-blue-500" />
            Add Module
          </button>
          <button
            onClick={onPreview}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
          >
            <Eye className="h-4 w-4 text-slate-400" />
            Preview Learner Page
          </button>
          {state.id && (
            <Link
              href={`/lms/programs/${state.slug || state.id}`}
              target="_blank"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Eye className="h-4 w-4 text-slate-400" />
              View Live Page ↗
            </Link>
          )}
        </div>
      </div>

      {/* ── Publish gate message ── */}
      {derived.missingRequired.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-xs font-semibold text-amber-800 mb-2">Cannot publish yet</p>
          <ul className="space-y-1">
            {derived.missingRequired.slice(0, 5).map(item => (
              <li key={item} className="flex items-start gap-1.5 text-xs text-amber-700">
                <span className="mt-0.5 flex-shrink-0">·</span>
                {item}
              </li>
            ))}
            {derived.missingRequired.length > 5 && (
              <li className="text-xs text-amber-600">+{derived.missingRequired.length - 5} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function HealthRow({
  icon: Icon, label, value, status, note,
}: {
  icon: ElementType;
  label: string;
  value: string;
  status: 'ok' | 'warn' | 'error';
  note?: string;
}) {
  const valueColor = status === 'ok' ? 'text-slate-900' : status === 'warn' ? 'text-amber-600' : 'text-red-600';
  const iconColor = status === 'ok' ? 'text-slate-400' : status === 'warn' ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${iconColor}`} />
      <span className="flex-1 text-xs text-slate-500">{label}</span>
      <div className="text-right">
        <span className={`text-xs font-semibold tabular-nums ${valueColor}`}>{value}</span>
        {note && <p className="text-xs text-red-400">{note}</p>}
      </div>
    </div>
  );
}
