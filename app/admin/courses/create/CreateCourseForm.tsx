'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface Props {
  categories: { id: string; name: string }[];
  programs: { id: string; title: string }[];
}

export function CreateCourseForm({ categories, programs }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [programId, setProgramId] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [category, setCategory] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Course title is required.');
      return;
    }

    setSaving(true);

    try {
      const res = await apiPost<any>('/api/admin/courses', {
        title: title.trim(),
        description: description.trim() || null,
        program_id: programId || null,
        duration_hours: durationHours ? parseInt(durationHours, 10) : null,
        category: category || null,
        is_published: isPublished,
      });

      if (res.error) {
        setError(typeof res.error === 'string' ? res.error : 'Failed to create course.');
        setSaving(false);
        return;
      }

      // Redirect to course content management
      const courseId = res.data?.id;
      if (courseId) {
        router.push(`/admin/courses/${courseId}/content`);
      } else {
        router.push('/admin/courses');
      }
    } catch {
      setError('Failed to create course. Please try again.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      {error && (
        <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 text-sm text-brand-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Title <span className="text-brand-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          placeholder="Enter course title"
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
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          rows={4}
          placeholder="Course description"
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
            placeholder="e.g., 40"
            min="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">Select category</option>
          <option value="healthcare">Healthcare</option>
          <option value="trades">Skilled Trades</option>
          <option value="technology">Technology</option>
          <option value="business">Business</option>
          <option value="transportation">Transportation / CDL</option>
          <option value="personal-services">Personal Services</option>
          <option value="tax">Tax Preparation</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_published"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-brand-blue-600 focus:ring-brand-blue-500"
        />
        <label htmlFor="is_published" className="text-sm text-gray-700">
          Publish immediately
        </label>
      </div>

      <div className="flex gap-4 pt-4 border-t">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-brand-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Creating...' : 'Create Course'}
        </button>
        <Link
          href="/admin/courses"
          className="px-4 py-2.5 border rounded-lg hover:bg-gray-50 text-gray-700"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
