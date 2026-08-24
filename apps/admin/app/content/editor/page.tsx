'use client';

/**
 * Admin Content Editor
 *
 * Page for editing content blocks, pages, and library items.
 * Uses the canonical RichTextEditor directly.
 */

import { useState } from 'react';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Save, Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminContentEditorPage() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [route, setRoute] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    if (!route.startsWith('/') || !title.trim() || !content.trim()) {
      setMessage('Enter a valid /route, title, and page content.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/website-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route,
          title: title.trim(),
          headline: title.trim(),
          summary: content,
          status: 'draft',
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || 'Unable to save content');
      }
      setLastSaved(new Date());
      setMessage('Draft saved to the canonical website content store.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Content Editor</h1>
              <p className="text-sm text-slate-600">Edit pages, blocks, and library content</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-sm text-slate-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="route" className="block text-sm font-medium text-slate-700 mb-2">
            Page route
          </label>
          <input
            id="route"
            type="text"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            placeholder="/about"
            className="mb-4 w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          />
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter content title..."
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Start writing your content..."
          />
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm text-slate-600" role="status" aria-live="polite">
          <Eye className="w-4 h-4" />
          {lastSaved && route ? (
            <a href={`https://www.elevateforhumanity.org${route}`} target="_blank" rel="noreferrer" className="font-semibold text-brand-blue-700 hover:underline">
              Open page route
            </a>
          ) : (
            <span>{message || 'Preview is available after saving.'}</span>
          )}
          {lastSaved && message ? <span>{message}</span> : null}
        </div>
      </div>
    </div>
  );
}
