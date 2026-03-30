'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Eye, Save, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import type { ProgramBuilderState, ProgramDerivedState } from './types';

interface Props {
  state: ProgramBuilderState;
  derived: ProgramDerivedState;
  saving: boolean;
  onSave: () => void;
  onPublish: () => void;
  onPreview: () => void;
  onTitleChange: (title: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  ready: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-red-100 text-red-600',
};

export default function CourseBuilderTopBar({
  state,
  derived,
  saving,
  onSave,
  onPublish,
  onPreview,
  onTitleChange,
}: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(state.title);

  const commitTitle = () => {
    setEditingTitle(false);
    if (titleDraft.trim()) onTitleChange(titleDraft.trim());
  };

  const statusLabel =
    state.status === 'published' ? 'Published' :
    derived.canPublish ? 'Ready' :
    'Draft';

  const statusStyle = STATUS_STYLES[state.status === 'published' ? 'published' : derived.canPublish ? 'ready' : 'draft'];

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">

          {/* Left: back + title + status */}
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/programs"
              className="flex-shrink-0 text-slate-400 hover:text-slate-700 transition-colors"
              title="Back to Programs"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>

            {editingTitle ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                className="min-w-0 flex-1 rounded border border-brand-blue-400 px-2 py-0.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            ) : (
              <button
                onClick={() => { setTitleDraft(state.title); setEditingTitle(true); }}
                className="min-w-0 truncate text-sm font-semibold text-slate-900 hover:text-brand-blue-600 transition-colors text-left"
                title="Click to rename"
              >
                {state.title || 'Untitled Program'}
              </button>
            )}

            <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}>
              {statusLabel}
            </span>
          </div>

          {/* Center: completion + missing */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            {/* Completion bar */}
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${derived.completionPercent === 100 ? 'bg-emerald-500' : 'bg-brand-blue-500'}`}
                  style={{ width: `${derived.completionPercent}%` }}
                />
              </div>
              <span className="text-slate-500 tabular-nums">{derived.completionPercent}%</span>
            </div>

            {/* Missing count */}
            {derived.missingRequired.length > 0 ? (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                {derived.missingRequired.length} required {derived.missingRequired.length === 1 ? 'item' : 'items'} missing
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle className="h-3.5 w-3.5" />
                Ready to publish
              </span>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={onPreview}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </button>

            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save'}</span>
            </button>

            <button
              onClick={onPublish}
              disabled={!derived.canPublish || state.status === 'published'}
              title={!derived.canPublish ? `Cannot publish: ${derived.missingRequired[0]}` : undefined}
              className="rounded-lg bg-brand-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              {state.status === 'published' ? 'Published' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
