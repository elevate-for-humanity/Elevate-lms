'use client';

/**
 * PublishPanel — course readiness checklist + publish action.
 * Reads publishState from CourseProvider. No independent fetches.
 */

import { useState } from 'react';
import { useCourse } from '../CourseProvider';
import { Rocket, CheckCircle, XCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { PanelHeader } from './BlueprintPanel';

export function PublishPanel() {
  const { state, updatePublishState, appendAIMemory } = useCourse();
  const { course, modules, lessons, publishState } = state;
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A published course is authoritative. For drafts, generation must either be
  // absent (manually authored) or completed before the publish action is enabled.
  const generationComplete =
    publishState.isPublished ||
    !publishState.generationStatus ||
    publishState.generationStatus === 'completed';

  const checks = [
    { label: 'Course has a title', pass: !!course.title?.trim(), required: true },
    { label: 'Course has a description', pass: !!course.description?.trim(), required: false },
    { label: 'At least one module', pass: modules.length > 0, required: true },
    { label: 'At least one lesson', pass: lessons.length > 0, required: true },
    {
      label: `All lessons approved (${publishState.approvedLessons}/${publishState.totalLessons})`,
      pass: publishState.approvedLessons === publishState.totalLessons && publishState.totalLessons > 0,
      required: true,
    },
    {
      label: 'Generation complete',
      pass: generationComplete,
      required: true,
    },
    { label: 'Not previously rejected', pass: publishState.reviewStatus !== 'rejected', required: true },
    { label: 'Thumbnail image set', pass: !!course.thumbnail_url, required: false },
    { label: 'Duration set', pass: !!course.duration_hours, required: false },
  ];

  const requiredFailing = checks.filter(c => c.required && !c.pass);
  const canPublish = requiredFailing.length === 0 && !publishState.isPublished;

  const handlePublish = async () => {
    if (!canPublish) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/lms/courses/${course.id}/publish`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        if (d.error === 'PUBLISH_BLOCKED' && Array.isArray(d.blocking_issues) && d.blocking_issues.length > 0) {
          throw new Error('Cannot publish — fix these issues first:\n• ' + d.blocking_issues.join('\n• '));
        }
        throw new Error(d.error ?? 'Publish failed');
      }
      updatePublishState({ isPublished: true, publishedAt: new Date().toISOString() });
      appendAIMemory({ role: 'action', content: `Course "${course.title}" published successfully`, source: 'publish' });
      const { emitStudioEvent, STUDIO_EVENTS } = await import('@/lib/studio/events');
      emitStudioEvent(STUDIO_EVENTS.COURSE_PUBLISHED, { courseId: course.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <PanelHeader
        icon={<Rocket className="w-5 h-5" />}
        title="Publish"
        subtitle={publishState.isPublished ? `Published ${publishState.publishedAt ? new Date(publishState.publishedAt).toLocaleDateString() : ''}` : 'Review readiness before publishing'}
      />

      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-600 font-medium">Lesson approval progress</span>
          <span className="text-slate-500">{publishState.approvedLessons}/{publishState.totalLessons}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: publishState.totalLessons > 0 ? `${(publishState.approvedLessons / publishState.totalLessons) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {checks.map(check => (
          <div key={check.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${check.pass ? 'bg-emerald-50 border-emerald-200' : check.required ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            {check.pass ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : check.required ? <XCircle className="w-5 h-5 text-red-500 shrink-0" /> : <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />}
            <span className={`text-sm font-medium ${check.pass ? 'text-emerald-800' : check.required ? 'text-red-800' : 'text-amber-800'}`}>{check.label}</span>
            {!check.required && !check.pass && <span className="ml-auto text-xs text-amber-600">Optional</span>}
          </div>
        ))}
      </div>

      {!publishState.isPublished && publishState.generationStatus && publishState.generationStatus !== 'completed' && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 mb-6">
          <Clock className="w-5 h-5 text-blue-600 shrink-0 animate-spin" />
          <div>
            <p className="text-sm font-medium text-blue-800">Generation in progress ({publishState.generationProgress ?? 0}%)</p>
            <p className="text-xs text-blue-600">Generation must complete before publication.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 mb-4">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          {error.includes('\n') ? (
            <ul className="text-sm text-red-800 space-y-1">{error.split('\n').map((line, i) => <li key={i}>{line}</li>)}</ul>
          ) : <p className="text-sm text-red-800">{error}</p>}
        </div>
      )}

      {publishState.isPublished ? (
        <div className="flex items-center gap-3 px-4 py-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800">Course is live</p>
            <p className="text-xs text-emerald-600">Published {publishState.publishedAt ? new Date(publishState.publishedAt).toLocaleDateString() : ''}</p>
          </div>
          <a href={`/lms/courses/${course.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900">
            View <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      ) : (
        <button onClick={() => void handlePublish()} disabled={!canPublish || publishing} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-blue-600 text-white font-semibold hover:bg-brand-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
          <Rocket className="w-5 h-5" />
          {publishing ? 'Publishing…' : requiredFailing.length > 0 ? `${requiredFailing.length} required check${requiredFailing.length > 1 ? 's' : ''} failing` : 'Publish Course'}
        </button>
      )}
    </div>
  );
}
