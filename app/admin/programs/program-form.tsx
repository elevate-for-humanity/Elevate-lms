"use client";

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProgram, updateProgram } from './actions';

interface ProgramFormProps {
  program?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    is_active: boolean;
    featured: boolean;
    duration_hours?: number;
    price?: number;
    category?: string;
    requirements?: string;
    outcomes?: string;
  };
}

export function ProgramForm({ program }: ProgramFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      if (program) {
        await updateProgram(program.id, formData);
      } else {
        await createProgram(formData);
      }
      router.push('/admin/programs');
      router.refresh();
    } catch (err: any) {
      setError('An error occurred');
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-sm border p-6 space-y-6"
    >
      {error && (
        <div className="bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-black">
          Basic Information
        </h2>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-black mb-1"
          >
            Program Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={program?.name}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            placeholder="e.g., Barber Apprenticeship Program"
          />
        </div>

        <div>
          <label
            htmlFor="slug"
            className="block text-sm font-medium text-black mb-1"
          >
            URL Slug *
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            required
            defaultValue={program?.slug}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            placeholder="e.g., barber-apprenticeship"
          />
          <p className="text-sm text-black mt-1">
            Used in URL: /programs/your-slug
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-black mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={program?.description}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            placeholder="Brief description of the program..."
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-black mb-1"
          >
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={program?.category || 'workforce'}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          >
            <option value="workforce">Workforce Development</option>
            <option value="apprenticeship">Apprenticeship</option>
            <option value="certification">Certification</option>
            <option value="skills">Skills Training</option>
            <option value="technology">Technology</option>
            <option value="healthcare">Healthcare</option>
            <option value="business">Business</option>
          </select>
        </div>
      </div>

      {/* Program Details */}
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-xl font-semibold text-black">Program Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="duration_hours"
              className="block text-sm font-medium text-black mb-1"
            >
              Duration (hours)
            </label>
            <input
              type="number"
              id="duration_hours"
              name="duration_hours"
              min="0"
              step="1"
              defaultValue={program?.duration_hours}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              placeholder="e.g., 1500"
            />
          </div>

          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-black mb-1"
            >
              Price ($)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              min="0"
              step="0.01"
              defaultValue={program?.price}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              placeholder="e.g., 2500.00"
            />
            <p className="text-sm text-black mt-1">
              Leave empty for free programs
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="requirements"
            className="block text-sm font-medium text-black mb-1"
          >
            Requirements
          </label>
          <textarea
            id="requirements"
            name="requirements"
            rows={3}
            defaultValue={program?.requirements}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            placeholder="List program requirements (one per line)..."
          />
        </div>

        <div>
          <label
            htmlFor="outcomes"
            className="block text-sm font-medium text-black mb-1"
          >
            Learning Outcomes
          </label>
          <textarea
            id="outcomes"
            name="outcomes"
            rows={3}
            defaultValue={program?.outcomes}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            placeholder="List expected outcomes (one per line)..."
          />
        </div>
      </div>

      {/* Status */}
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-xl font-semibold text-black">Status</h2>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={program?.is_active ?? true}
              className="w-4 h-4 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500"
            />
            <span className="text-sm font-medium text-black">Active</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={program?.featured ?? false}
              className="w-4 h-4 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500"
            />
            <span className="text-sm font-medium text-black">Featured</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-black hover:bg-gray-50 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? 'Saving...'
            : program
              ? 'Update Program'
              : 'Create Program'}
        </button>
      </div>
    </form>
  );
}
