"use client";

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createModule, updateModule } from './actions';

interface Program {
  id: string;
  name: string;
  slug: string;
}

interface ModuleFormProps {
  programs: Program[];
  module?: {
    id: string;
    program_id: string;
    title: string;
    description?: string;
    order_index: number;
    duration_hours?: number;
    module_type: string;
    is_required: boolean;
  };
}

export function ModuleForm({ programs, module }: ModuleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      if (module) {
        await updateModule(module.id, formData);
      } else {
        await createModule(formData);
      }
      router.push('/admin/modules');
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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
            htmlFor="program_id"
            className="block text-sm font-medium text-black mb-1"
          >
            Program *
          </label>
          <select
            id="program_id"
            name="program_id"
            required
            defaultValue={module?.program_id}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          >
            <option value="">-- Select a program --</option>
            {programs.map((program: any) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-black mb-1"
          >
            Module Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            defaultValue={module?.title}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            placeholder="e.g., Introduction to Barbering"
          />
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
            rows={3}
            defaultValue={module?.description}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            placeholder="Brief description of the module..."
          />
        </div>
      </div>

      {/* Module Settings */}
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-xl font-semibold text-black">Module Settings</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="module_type"
              className="block text-sm font-medium text-black mb-1"
            >
              Module Type *
            </label>
            <select
              id="module_type"
              name="module_type"
              required
              defaultValue={module?.module_type || 'lesson'}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            >
              <option value="lesson">Lesson</option>
              <option value="scorm">SCORM Package</option>
              <option value="assessment">Assessment</option>
              <option value="external">External Link</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="order_index"
              className="block text-sm font-medium text-black mb-1"
            >
              Order *
            </label>
            <input
              type="number"
              id="order_index"
              name="order_index"
              required
              min="0"
              step="1"
              defaultValue={module?.order_index ?? 0}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              placeholder="0"
            />
            <p className="text-sm text-black mt-1">
              Display order in program
            </p>
          </div>

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
              step="0.5"
              defaultValue={module?.duration_hours}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              placeholder="e.g., 2.5"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_required"
            name="is_required"
            defaultChecked={module?.is_required ?? true}
            className="w-4 h-4 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500"
          />
          <label
            htmlFor="is_required"
            className="text-sm font-medium text-black"
          >
            Required Module (students must complete this)
          </label>
        </div>
      </div>

      {/* SCORM Upload Section */}
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-xl font-semibold text-black">Content</h2>
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
          <p className="text-sm text-brand-blue-800">
            <strong>Note:</strong> After creating the module, you can upload
            SCORM packages or add lesson content from the module edit page.
          </p>
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
          {loading ? 'Saving...' : module ? 'Update Module' : 'Create Module'}
        </button>
      </div>
    </form>
  );
}
