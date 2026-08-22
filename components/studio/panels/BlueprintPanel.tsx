'use client';

/**
 * BlueprintPanel — course metadata editor.
 * Reads course from CourseProvider, writes via updateCourse (autosaved).
 */

import { useState } from 'react';
import { useCourse } from '../CourseProvider';
import { Layers, ExternalLink } from 'lucide-react';
import { AgenticCourseRunPanel } from '../AgenticCourseRunPanel';

export function BlueprintPanel() {
  const { state, updateCourse, appendAIMemory, setPanel } = useCourse();
  const { course, modules } = state;

  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description ?? '');
  const [shortDescription, setShortDescription] = useState(course.short_description ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnail_url ?? '');
  const [durationHours, setDurationHours] = useState(
    course.duration_hours != null ? String(course.duration_hours) : ''
  );
  const status = (course.status as 'draft' | 'published' | 'archived') ?? 'draft';

  function commit(patch: Partial<typeof course>) {
    updateCourse(patch);
    appendAIMemory({
      role: 'action',
      content: `Blueprint updated: ${Object.keys(patch).join(', ')}`,
      source: 'blueprint',
    });
  }

  return (
    <div className="p-6 max-w-5xl">
      <PanelHeader
        icon={<Layers className="w-5 h-5" />}
        title="Blueprint"
        subtitle={`${modules.length} module${modules.length !== 1 ? 's' : ''} · ${state.lessons.length} lesson${state.lessons.length !== 1 ? 's' : ''}`}
        actions={
          <a
            href="/studio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-brand-blue-600 hover:text-brand-blue-800 transition"
          >
            Full builder <ExternalLink className="w-3.5 h-3.5" />
          </a>
        }
      />

      <AgenticCourseRunPanel
        courseId={course.id}
        programId={course.program_id}
        courseTitle={course.title}
      />

      <div className="max-w-2xl space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Course Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => title !== course.title && commit({ title })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400 focus:border-transparent"
            placeholder="e.g. EPA 608 Certification Prep"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Short Description
          </label>
          <input
            type="text"
            value={shortDescription}
            onChange={e => setShortDescription(e.target.value)}
            onBlur={() => shortDescription !== (course.short_description ?? '') && commit({ short_description: shortDescription })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400 focus:border-transparent"
            placeholder="One-line summary shown in course cards"
            maxLength={160}
          />
          <p className="text-xs text-slate-400 mt-1">{shortDescription.length}/160</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Full Description
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={() => description !== (course.description ?? '') && commit({ description })}
            rows={5}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400 focus:border-transparent resize-y"
            placeholder="Detailed course description shown on the course landing page"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Thumbnail URL
            </label>
            <input
              type="url"
              value={thumbnailUrl}
              onChange={e => setThumbnailUrl(e.target.value)}
              onBlur={() => thumbnailUrl !== (course.thumbnail_url ?? '') && commit({ thumbnail_url: thumbnailUrl || null })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400 focus:border-transparent"
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Duration (hours)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={durationHours}
              onChange={e => setDurationHours(e.target.value)}
              onBlur={() => {
                const val = durationHours === '' ? null : parseFloat(durationHours);
                if (val !== course.duration_hours) commit({ duration_hours: val });
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400 focus:border-transparent"
              placeholder="e.g. 8"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50">
            <span className={`text-sm font-medium capitalize ${
              status === 'published' ? 'text-emerald-700' :
              status === 'archived' ? 'text-slate-400' :
              'text-amber-700'
            }`}>
              {status}
            </span>
            <button
              type="button"
              onClick={() => setPanel('publish')}
              className="text-xs font-medium text-brand-blue-600 hover:text-brand-blue-800 transition"
            >
              {status === 'published' ? 'Manage →' : 'Publish →'}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Publishing runs readiness checks. Use the Publish panel to change status.
          </p>
        </div>

        {(course.governing_body || course.compliance_profile_key) && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 space-y-1">
            {course.governing_body && (
              <p className="text-xs text-slate-600">
                <span className="font-medium">Standard:</span> {course.governing_body}
                {course.governing_standard_version && ` ${course.governing_standard_version}`}
              </p>
            )}
            {course.compliance_profile_key && (
              <p className="text-xs text-slate-600">
                <span className="font-medium">Compliance:</span> {course.compliance_profile_key}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function PanelHeader({
  icon,
  title,
  subtitle,
  actions,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-blue-50 rounded-lg text-brand-blue-600">{icon}</div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-100 rounded-lg" />
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-4">Loading {label}…</p>
    </div>
  );
}
