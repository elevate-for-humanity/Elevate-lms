'use client';

/**
 * LessonBasicsEditor
 * Edits: title, lesson_type, status, duration, slug (read-only display).
 */

import { ALL_LESSON_TYPES, LESSON_TYPE_META, type LessonType } from '@/lib/curriculum/lesson-types';

interface Props {
  title:          string;
  slug:           string;
  lessonType:     LessonType;
  status:         string;
  durationMinutes: number;
  orderIndex:     number;
  onChange: (patch: {
    title?:           string;
    lessonType?:      LessonType;
    status?:          string;
    durationMinutes?: number;
  }) => void;
}

const STATUS_OPTIONS = ['draft', 'review', 'published', 'archived'];

export default function LessonBasicsEditor({
  title, slug, lessonType, status, durationMinutes, orderIndex, onChange,
}: Props) {
  const meta = LESSON_TYPE_META[lessonType];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Lesson Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => onChange({ title: e.target.value })}
            placeholder="Enter lesson title"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>

        {/* Slug (read-only) */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Slug <span className="text-slate-400 font-normal">(identity key — do not change after seeding)</span>
          </label>
          <input
            type="text"
            value={slug}
            readOnly
            className="w-full border border-slate-100 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
          />
        </div>

        {/* Order */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Order Index</label>
          <input
            type="number"
            value={orderIndex}
            readOnly
            className="w-full border border-slate-100 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
          />
        </div>

        {/* Lesson Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Lesson Type <span className="text-red-500">*</span>
          </label>
          <select
            value={lessonType}
            onChange={e => onChange({ lessonType: e.target.value as LessonType })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          >
            {ALL_LESSON_TYPES.map(t => (
              <option key={t} value={t}>
                {LESSON_TYPE_META[t].badge} {LESSON_TYPE_META[t].label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">{meta.description}</p>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
          <select
            value={status}
            onChange={e => onChange({ status: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            min={0}
            value={durationMinutes}
            onChange={e => onChange({ durationMinutes: parseInt(e.target.value) || 0 })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
