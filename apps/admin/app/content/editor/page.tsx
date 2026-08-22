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
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      console.debug('Saving content:', { title, content });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save failed:', error);
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
              href="/admin"
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

        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <Eye className="w-4 h-4" />
          <span>Preview available after saving</span>
        </div>
      </div>
    </div>
  );
}
