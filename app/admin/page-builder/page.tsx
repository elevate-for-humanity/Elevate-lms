import { requireAdmin } from '@/lib/auth';
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Save,
  Eye,
  FileText,
} from 'lucide-react';
import { ComponentLabels, ComponentDefaults } from '@/lib/components/registry-meta';
import type { RegisteredComponent } from '@/lib/components/registry-meta';

interface Section {
  id: string;           // temp client ID before save
  component: RegisteredComponent;
  props: Record<string, unknown>;
}

interface PageMeta {
  slug: string;
  title: string;
  status: 'published' | 'draft';
  meta_title: string;
  meta_desc: string;
}

const COMPONENTS = Object.keys(ComponentLabels) as RegisteredComponent[];

function newSection(component: RegisteredComponent): Section {
  return {
    id: crypto.randomUUID(),
    component,
    props: { ...ComponentDefaults[component] },
  };
}

export default function PageBuilderPage() {
  const [pages, setPages] = useState<{ id: string; slug: string; title: string | null; status: string }[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [meta, setMeta] = useState<PageMeta>({
    slug: '', title: '', status: 'draft', meta_title: '', meta_desc: '',
  });
  const [sections, setSections] = useState<Section[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const loadPages = useCallback(async () => {
    const res = await fetch('/api/page-builder/pages');
    if (res.ok) setPages(await res.json());
  }, []);

  useEffect(() => { loadPages(); }, [loadPages]);

  const loadPage = async (id: string) => {
    const res = await fetch(`/api/page-builder/pages/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setSelectedPageId(id);
    setMeta({
      slug: data.slug,
      title: data.title ?? '',
      status: data.status,
      meta_title: data.meta_title ?? '',
      meta_desc: data.meta_desc ?? '',
    });
    setSections(
      (data.sections ?? []).map((s: { id: string; component: RegisteredComponent; props: Record<string, unknown> }) => ({
        id: s.id,
        component: s.component,
        props: s.props,
      }))
    );
    setExpandedSection(null);
  };

  const newPage = () => {
    setSelectedPageId(null);
    setMeta({ slug: '', title: '', status: 'draft', meta_title: '', meta_desc: '' });
    setSections([]);
    setExpandedSection(null);
  };

  const addSection = (component: RegisteredComponent) => {
    const s = newSection(component);
    setSections((prev) => [...prev, s]);
    setExpandedSection(s.id);
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
    if (expandedSection === id) setExpandedSection(null);
  };

  const moveSection = (id: string, dir: -1 | 1) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const updateProp = (sectionId: string, key: string, value: unknown) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, props: { ...s.props, [key]: value } } : s
      )
    );
  };

  const save = async () => {
    if (!meta.slug) { setSaveMsg('Slug is required'); return; }
    setSaving(true);
    setSaveMsg('');
    try {
      const body = { ...meta, sections: sections.map((s) => ({ component: s.component, props: s.props })) };
      const url = selectedPageId
        ? `/api/page-builder/pages/${selectedPageId}`
        : '/api/page-builder/pages';
      const res = await fetch(url, {
        method: selectedPageId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        if (!selectedPageId) setSelectedPageId(data.id);
        setSaveMsg('Saved');
        loadPages();
      } else {
        setSaveMsg('Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Sidebar — page list */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Pages
          </h2>
          <button
            onClick={newPage}
            className="p-1.5 rounded bg-brand-blue-600 text-white hover:bg-brand-blue-700"
            title="New page"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {pages.length === 0 && (
            <p className="p-4 text-sm text-slate-400">No pages yet. Create one.</p>
          )}
          {pages.map((p) => (
            <button
              key={p.id}
              onClick={() => loadPage(p.id)}
              className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                selectedPageId === p.id ? 'bg-brand-blue-50 border-l-2 border-l-brand-blue-600' : ''
              }`}
            >
              <p className="text-sm font-medium text-slate-800 truncate">{p.title || p.slug}</p>
              <p className="text-xs text-slate-400 truncate">/p/{p.slug}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                p.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {p.status}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main editor */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <h1 className="font-bold text-slate-800">
            {selectedPageId ? `Editing: ${meta.title || meta.slug}` : 'New Page'}
          </h1>
          <div className="flex items-center gap-3">
            {selectedPageId && meta.slug && (
              <Link
                href={`/p/${meta.slug}`}
                target="_blank"
                className="flex items-center gap-1 text-sm text-brand-blue-600 hover:underline"
              >
                <Eye className="w-4 h-4" /> Preview
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
            {saveMsg && (
              <span className={`text-sm ${saveMsg === 'Saved' ? 'text-green-600' : 'text-red-600'}`}>
                {saveMsg}
              </span>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex gap-6">

          {/* Page meta */}
          <div className="w-72 shrink-0 flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Page Settings</h3>
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Slug <span className="text-red-500">*</span></span>
                  <input
                    value={meta.slug}
                    onChange={(e) => setMeta((m) => ({ ...m, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    placeholder="community/events"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
                  />
                  <span className="text-xs text-slate-400">URL: /p/{meta.slug || '…'}</span>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Title</span>
                  <input
                    value={meta.title}
                    onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
                    placeholder="Page title"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Status</span>
                  <select
                    value={meta.status}
                    onChange={(e) => setMeta((m) => ({ ...m, status: e.target.value as 'published' | 'draft' }))}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Meta title</span>
                  <input
                    value={meta.meta_title}
                    onChange={(e) => setMeta((m) => ({ ...m, meta_title: e.target.value }))}
                    placeholder="SEO title"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Meta description</span>
                  <textarea
                    value={meta.meta_desc}
                    onChange={(e) => setMeta((m) => ({ ...m, meta_desc: e.target.value }))}
                    placeholder="SEO description"
                    rows={2}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400 resize-none"
                  />
                </label>
              </div>
            </div>

            {/* Add section */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Add Section</h3>
              <div className="flex flex-col gap-2">
                {COMPONENTS.map((c) => (
                  <button
                    key={c}
                    onClick={() => addSection(c)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-left border border-slate-200 rounded-lg hover:border-brand-blue-400 hover:bg-brand-blue-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-brand-blue-500" />
                    {ComponentLabels[c]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section list */}
          <div className="flex-1 flex flex-col gap-3">
            {sections.length === 0 && (
              <div className="flex items-center justify-center h-48 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                Add a section from the left panel
              </div>
            )}
            {sections.map((section, idx) => (
              <div
                key={section.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                {/* Section header */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-5 text-center">{idx + 1}</span>
                    <span className="font-medium text-slate-700 text-sm">
                      {ComponentLabels[section.component]}
                    </span>
                    {section.props.title && (
                      <span className="text-xs text-slate-400 truncate max-w-xs">
                        — {String(section.props.title)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSection(section.id, -1); }}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSection(section.id, 1); }}
                      disabled={idx === sections.length - 1}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                      className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                      title="Remove section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Props editor */}
                {expandedSection === section.id && (
                  <div className="border-t border-slate-100 px-4 py-4 bg-slate-50">
                    <div className="flex flex-col gap-3">
                      {Object.entries(section.props).map(([key, val]) => (
                        <label key={key} className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500 font-medium">{key}</span>
                          {typeof val === 'string' && val.length > 80 ? (
                            <textarea
                              value={val}
                              onChange={(e) => updateProp(section.id, key, e.target.value)}
                              rows={4}
                              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400 resize-y bg-white"
                            />
                          ) : typeof val === 'boolean' ? (
                            <input
                              type="checkbox"
                              checked={val}
                              onChange={(e) => updateProp(section.id, key, e.target.checked)}
                              className="w-4 h-4"
                            />
                          ) : typeof val === 'number' ? (
                            <input
                              type="number"
                              value={val}
                              onChange={(e) => updateProp(section.id, key, Number(e.target.value))}
                              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400 bg-white w-32"
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(val ?? '')}
                              onChange={(e) => updateProp(section.id, key, e.target.value)}
                              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400 bg-white"
                            />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
