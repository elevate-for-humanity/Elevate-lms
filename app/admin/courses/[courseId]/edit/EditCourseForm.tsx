'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPatch } from '@/lib/api';
import Link from 'next/link';
import { Loader2, Save } from 'lucide-react';

interface Props {
  course: any;
  programs: { id: string; title: string }[];
}

export function EditCourseForm({ course, programs }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState(course.title || '');
  const [description, setDescription] = useState(course.description || '');
  const [programId, setProgramId] = useState(course.program_id || '');
  const [durationHours, setDurationHours] = useState(
    course.duration_hours?.toString() || ''
  );
  const [isPublished, setIsPublished] = useState(course.is_published || false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title.trim()) {
      setError('Course title is required.');
      return;
    }

    setSaving(true);

    try {
      const res = await apiPatch<any>(`/api/admin/courses/${course.id}`, {
        title: title.trim(),
        description: description.trim() || null,
        program_id: programId || null,
        duration_hours: durationHours ? parseInt(durationHours, 10) : null,
        is_published: isPublished,
      });

      if (res.error) {
        setError(typeof res.error === 'string' ? res.error : 'Failed to update course.');
        setSaving(false);
        return;
      }

      setSuccess(true);
      setSaving(false);

      // Refresh server data
      router.refresh();
    } catch {
      setError('Failed to update course. Please try again.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
          Course updated successfully.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Program
          </label>
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">No program</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (hours)
          </label>
          <input
            type="number"
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            min="0"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_published"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="is_published" className="text-sm text-gray-700">
          Published
        </label>
      </div>

      <div className="flex gap-4 pt-4 border-t">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <Link
          href={`/admin/courses/${course.id}/content`}
          className="px-4 py-2.5 border rounded-lg hover:bg-gray-50 text-gray-700"
        >
          Manage Lessons
        </Link>
        <Link
          href="/admin/courses"
          className="px-4 py-2.5 border rounded-lg hover:bg-gray-50 text-gray-700"
        >
          Back
        </Link>
      </div>
    </form>
  );
}
