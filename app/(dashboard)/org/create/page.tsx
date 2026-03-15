'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateOrgPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'training_provider',
  });

  function handleNameChange(name: string) {
    setFormData({
      ...formData,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim(),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/org/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create organization');
      }

      const data = await response.json();
      router.push('/dashboard');
    } catch (err) {
      setError(
        'An error occurred'
      );
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "(Dashboard)", href: "/(dashboard)" }, { label: "Create" }]} />
      </div>
<div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-black">
            Create Organization
          </h2>
          <p className="mt-2 text-center text-sm text-black">
            Set up your organization to get started
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-brand-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-brand-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-brand-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-black"
              >
                Organization Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black rounded-md focus:outline-none focus:ring-brand-blue-500 focus:border-brand-blue-500 focus:z-10 sm:text-sm"
                placeholder="Acme Training Center"
              />
            </div>

            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-black"
              >
                URL Slug
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-white text-black text-sm">
                  elevatecareertraining.com/org/
                </span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  pattern="[a-z0-9-]+"
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-brand-blue-500 focus:border-brand-blue-500 sm:text-sm"
                  placeholder="acme-training"
                />
              </div>
              <p className="mt-1 text-xs text-black">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>

            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-black"
              >
                Organization Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-brand-blue-500 focus:border-brand-blue-500 sm:text-sm rounded-md"
              >
                <option value="training_provider">Training Provider</option>
                <option value="employer">Employer</option>
                <option value="school">School</option>
                <option value="government">Government Agency</option>
                <option value="nonprofit">Nonprofit</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue-600 hover:bg-brand-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-black hover:text-black"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
