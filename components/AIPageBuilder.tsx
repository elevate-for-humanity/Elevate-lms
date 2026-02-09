"use client";

import React from 'react';
import { sanitizeHtml } from '@/lib/sanitize';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PageTemplate {
  name: string;
  description: string;
  defaultSections: string[];
  examples: string[];
}

interface GeneratedPage {
  html: string;
  tailwindClasses: string[];
  summary: string;
  sections: string[];
  pageType: string;
  theme: any;
  generatedAt: string;
}

export default function AIPageBuilder() {
  const [pageType, setPageType] = useState('home');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<string[]>([]);
  const [templates, setTemplates] = useState<Record<string, PageTemplate>>({});
  const [generatedPage, setGeneratedPage] = useState<GeneratedPage | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageName, setPageName] = useState('');
  const [pageSlug, setPageSlug] = useState('');

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Update sections when page type changes
  useEffect(() => {
    if (templates[pageType]) {
      setSections(templates[pageType].defaultSections);
      setDescription(templates[pageType].examples[0]);
    }
  }, [pageType, templates]);

  async function loadTemplates() {
    try {
      const response = await fetch(
        'https://efh-ai-stylist.your-subdomain.workers.dev/templates'
      );
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      // Error: $1
    }
  }

  async function generatePage() {
    setLoading(true);
    setGeneratedPage(null);

    try {
      const response = await fetch(
        'https://efh-ai-stylist.your-subdomain.workers.dev/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageType,
            description,
            sections,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setGeneratedPage(data.page);
        // Au name and slug
        setPageName(
          `${pageType.charAt(0).toUpperCase() + pageType.slice(1)} Page`
        );
        setPageSlug(pageType);
      } else {
        alert('Failed to generate page: ' + data.error);
      }
    } catch (error) {
      // Error: $1
      alert('Failed to generate page');
    } finally {
      setLoading(false);
    }
  }

  async function savePage() {
    if (!generatedPage || !pageName || !pageSlug) {
      alert('Please provide a name and slug for the page');
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('generated_pages')
        .insert({
          name: pageName,
          slug: pageSlug,
          page_type: generatedPage.pageType,
          description,
          html: generatedPage.html,
          tailwind_classes: generatedPage.tailwindClasses,
          sections: generatedPage.sections,
          theme: generatedPage.theme,
          status: 'draft',
          created_by: user?.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      alert('Page saved successfully!');
      // Reset form
      setGeneratedPage(null);
      setPageName('');
      setPageSlug('');
      setDescription('');
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      alert('Failed to save page: ' + error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  async function publishPage() {
    if (!generatedPage || !pageName || !pageSlug) {
      alert('Please save the page first');
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('generated_pages')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('slug', pageSlug);

      if (error) throw error;

      alert('Page published successfully!');
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      alert('Failed to publish page: ' + error instanceof Error ? error.message : String(error));
    }
  }

  const currentTemplate = templates[pageType];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-brand-orange-600 mb-2 text-2xl md:text-3xl lg:text-4xl">
          AI Website Stylist
        </h1>
        <p className="text-brand-text-muted">
          Generate branded pages with AI - powered by Workers AI
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-brand-text mb-4">
              Page Configuration
            </h2>
            {/* Page Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text mb-2">
                Page Type
              </label>
              <select
                className="w-full border border-brand-border-dark rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-focus focus:border-transparent"
                value={pageType}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setPageType(e.target.value)}
              >
                {Object.entries(templates).map(([key, template]) => (
                  <option key={key} value={key}>
                    {template.name}
                  </option>
                ))}
              </select>
              {currentTemplate && (
                <p className="text-sm text-brand-text-light mt-1">
                  {currentTemplate.description}
                </p>
              )}
            </div>
            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text mb-2">
                Page Description
              </label>
              <textarea
                className="w-full border border-brand-border-dark rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-focus focus:border-transparent"
                rows={4}
                placeholder="Describe what the page should highlight..."
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDescription(e.target.value)}
              />
              {currentTemplate && currentTemplate.examples.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-brand-text-light mb-1">
                    Examples:
                  </p>
                  {currentTemplate.examples.map((example, i) => (
                    <button
                      key={i}
                      className="text-xs text-brand-info hover:text-brand-info block mb-1"
                      onClick={() => setDescription(example)}
                    >
                      • {example}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Sections */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text mb-2">
                Sections to Include
              </label>
              <div className="flex flex-wrap gap-2">
                {currentTemplate?.defaultSections.map((section) => (
                  <span
                    key={section}
                    className="px-3 py-2 bg-brand-surface text-brand-warning rounded-full text-sm"
                  >
                    {section}
                  </span>
                ))}
              </div>
            </div>
            {/* Generate Button */}
            <button
              onClick={generatePage}
              disabled={loading || !description}
              className="w-full bg-brand-info hover:bg-brand-info-hover text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate Page with AI'
              )}
            </button>
          </div>
          {/* Save Panel */}
          {generatedPage && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-brand-text mb-4">
                Save Page
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text mb-2">
                  Page Name
                </label>
                <input
                  type="text"
                  className="w-full border border-brand-border-dark rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-focus focus:border-transparent"
                  placeholder="e.g., Home Page"
                  value={pageName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setPageName(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text mb-2">
                  URL Slug
                </label>
                <input
                  type="text"
                  className="w-full border border-brand-border-dark rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-focus focus:border-transparent"
                  placeholder="e.g., home"
                  value={pageSlug}
                  onChange={(e) =>
                    setPageSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                    )
                  }
                />
                <p className="text-xs text-brand-text-light mt-1">
                  Will be accessible at: /pages/{pageSlug}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={savePage}
                  disabled={saving}
                  className="flex-1 bg-brand-success hover:bg-brand-success-hover text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400"
                >
                  {saving ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  onClick={publishPage}
                  className="flex-1 bg-brand-danger hover:bg-brand-danger-hover text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Publish Live
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Preview Panel */}
        <div className="space-y-6">
          {generatedPage ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="   px-6 py-4">
                <h2 className="text-2xl font-semibold text-white">Preview</h2>
                <p className="text-red-100 text-sm">{generatedPage.summary}</p>
              </div>
              <div className="p-6">
                <div className="mb-4 flex flex-wrap gap-2">
                  {generatedPage.sections.map((section) => (
                    <span
                      key={section}
                      className="px-2 py-2 bg-brand-surface text-brand-info rounded text-xs"
                    >
                      {section}
                    </span>
                  ))}
                </div>
                <div
                  className="border border-brand-border rounded-lg p-4 bg-brand-surface overflow-auto"
                  style={{ maxHeight: '600px' }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(generatedPage.html) }}
                />
                <div className="mt-4 text-xs text-brand-text-light">
                  Generated at:{' '}
                  {new Date(generatedPage.generatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg
                className="mx-auto h-24 w-24 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-brand-text mb-2">
                No Page Generated Yet
              </h3>
              <p className="text-brand-text-light">
                Configure your page settings and click "Generate Page with AI"
                to see the preview
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
