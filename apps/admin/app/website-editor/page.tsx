'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type PageStatus = 'draft' | 'published';
type WebsitePage = {
  route: string;
  title: string;
  eyebrow: string | null;
  headline: string;
  summary: string;
  primary_cta_label: string | null;
  primary_cta_href: string | null;
  secondary_cta_label: string | null;
  secondary_cta_href: string | null;
  hero_image: string | null;
  status: PageStatus;
  updated_at?: string | null;
};
type EditorValues = {
  route: string;
  title: string;
  eyebrow: string;
  headline: string;
  summary: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  heroImage: string;
  status: PageStatus;
};

const EMPTY_PAGE: EditorValues = {
  route: '',
  title: '',
  eyebrow: '',
  headline: '',
  summary: '',
  primaryCtaLabel: '',
  primaryCtaHref: '',
  secondaryCtaLabel: '',
  secondaryCtaHref: '',
  heroImage: '',
  status: 'draft',
};
const LOCAL_DRAFT_KEY = 'elevate-admin-website-editor-draft-v1';

function editorValues(page: WebsitePage): EditorValues {
  return {
    route: page.route,
    title: page.title,
    eyebrow: page.eyebrow ?? '',
    headline: page.headline,
    summary: page.summary,
    primaryCtaLabel: page.primary_cta_label ?? '',
    primaryCtaHref: page.primary_cta_href ?? '',
    secondaryCtaLabel: page.secondary_cta_label ?? '',
    secondaryCtaHref: page.secondary_cta_href ?? '',
    heroImage: page.hero_image ?? '',
    status: page.status,
  };
}

export default function WebsiteEditorPage() {
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [values, setValues] = useState<EditorValues>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/website-content', { cache: 'no-store' });
      const body = (await response.json()) as WebsitePage[] | { error?: string };
      if (!response.ok || !Array.isArray(body))
        throw new Error(!Array.isArray(body) ? body.error : 'Unable to load pages');
      setPages(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load website pages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCAL_DRAFT_KEY);
      if (saved)
        setValues({
          ...EMPTY_PAGE,
          ...(JSON.parse(saved) as Partial<EditorValues>),
          status: 'draft',
        });
    } catch {
      /* Local draft recovery is optional. */
    }
  }, []);
  useEffect(() => {
    if (!values.route && !values.title && !values.headline && !values.summary) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          LOCAL_DRAFT_KEY,
          JSON.stringify({ ...values, status: 'draft' }),
        );
      } catch {
        /* Normal save remains available. */
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [values]);

  const filteredPages = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term
      ? pages.filter((page) =>
          `${page.route} ${page.title} ${page.headline}`.toLowerCase().includes(term),
        )
      : pages;
  }, [pages, query]);
  const update = (name: keyof EditorValues, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));

  async function save(event?: FormEvent<HTMLFormElement>, forcedStatus?: PageStatus) {
    event?.preventDefault();
    const status = forcedStatus ?? 'draft';
    const normalizedRoute = `/${values.route.trim().replace(/^\/+/, '')}`;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/admin/website-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, route: normalizedRoute, status }),
      });
      const result = (await response.json()) as WebsitePage[] | { error?: string };
      if (!response.ok) throw new Error(!Array.isArray(result) ? result.error : 'Save failed');
      const savedPage = Array.isArray(result) ? result[0] : null;
      setValues(
        savedPage ? editorValues(savedPage) : { ...values, route: normalizedRoute, status },
      );
      try {
        window.localStorage.removeItem(LOCAL_DRAFT_KEY);
      } catch {
        /* Ignore unavailable storage. */
      }
      setMessage(
        status === 'published' ? 'Page published to the canonical content store.' : 'Draft saved.',
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save content.');
    } finally {
      setSaving(false);
    }
  }

  const previewHref = values.route.startsWith('/')
    ? `https://www.elevateforhumanity.org${values.route}`
    : '';
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="font-bold text-blue-700">
            ← Admin Dashboard
          </Link>
          <Link
            href="/studio/content"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-800"
          >
            Open AI Website Content
          </Link>
        </div>
        <div className="mt-6">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-blue-700">
            Canonical website workspace
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Website Editor</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Select a database-managed page, recover an unfinished local draft, preview it, and
            publish from one workspace.
          </p>
        </div>
        <div className="mt-7 grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <aside className="self-start rounded-2xl bg-slate-950 p-4 text-white lg:sticky lg:top-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-black">Managed pages</h2>
              <button
                type="button"
                onClick={() => {
                  setValues(EMPTY_PAGE);
                  setMessage('New draft started.');
                  setError('');
                }}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold"
              >
                New
              </button>
            </div>
            <label className="mt-4 block">
              <span className="sr-only">Search managed pages</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pages"
                className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-white"
              />
            </label>
            {loading ? (
              <p className="py-6 text-sm text-slate-400">Loading pages…</p>
            ) : filteredPages.length ? (
              <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto">
                {filteredPages.map((page) => (
                  <button
                    key={page.route}
                    type="button"
                    onClick={() => {
                      setValues(editorValues(page));
                      setMessage('');
                      setError('');
                    }}
                    className={`w-full rounded-xl border p-3 text-left ${values.route === page.route ? 'border-blue-400 bg-blue-950' : 'border-slate-800 bg-slate-900 hover:border-slate-600'}`}
                  >
                    <span className="block truncate text-sm font-bold">
                      {page.title || page.route}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-400">
                      {page.route} · {page.status}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-6 text-sm leading-6 text-slate-400">
                No database-managed pages yet. Existing code-managed public pages are unchanged.
              </p>
            )}
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 text-sm font-bold text-blue-300 hover:text-blue-200"
            >
              Refresh page list
            </button>
          </aside>
          <form
            onSubmit={(event) => void save(event)}
            className="space-y-6 rounded-3xl bg-white p-5 shadow-sm sm:p-8"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                name="route"
                label="Page route"
                value={values.route}
                onChange={update}
                placeholder="/programs/medical-assistant"
                required
              />
              <Field
                name="title"
                label="Browser and SEO title"
                value={values.title}
                onChange={update}
                placeholder="Medical Assistant Training"
                required
              />
            </div>
            <Field
              name="eyebrow"
              label="Hero eyebrow"
              value={values.eyebrow}
              onChange={update}
              placeholder="Healthcare Career Training"
            />
            <Field
              name="headline"
              label="Hero headline"
              value={values.headline}
              onChange={update}
              placeholder="Train for a hands-on healthcare career."
              required
            />
            <TextArea
              name="summary"
              label="Hero summary"
              value={values.summary}
              onChange={update}
              placeholder="Explain the program and next step clearly."
              required
            />
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                name="primaryCtaLabel"
                label="Primary CTA label"
                value={values.primaryCtaLabel}
                onChange={update}
                placeholder="Apply Now"
              />
              <Field
                name="primaryCtaHref"
                label="Primary CTA link"
                value={values.primaryCtaHref}
                onChange={update}
                placeholder="/apply?program=medical-assistant"
              />
              <Field
                name="secondaryCtaLabel"
                label="Secondary CTA label"
                value={values.secondaryCtaLabel}
                onChange={update}
                placeholder="Request Information"
              />
              <Field
                name="secondaryCtaHref"
                label="Secondary CTA link"
                value={values.secondaryCtaHref}
                onChange={update}
                placeholder="/contact"
              />
            </div>
            <Field
              name="heroImage"
              label="Hero image path"
              value={values.heroImage}
              onChange={update}
              placeholder="/images/programs/medical-assistant-hero.webp"
            />
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <strong>Draft recovery is on.</strong> Unsaved edits are retained in this browser.
              Publishing remains an explicit action.
            </div>
            {message || error ? (
              <div
                role="status"
                aria-live="polite"
                className={`rounded-xl p-4 font-semibold ${error ? 'bg-red-100 text-red-900' : 'bg-emerald-100 text-emerald-900'}`}
              >
                {error || message}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="min-h-12 rounded-xl bg-blue-700 px-6 py-3 font-bold text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
              {previewHref ? (
                <a
                  href={previewHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center rounded-xl border-2 border-slate-300 px-6 py-3 font-bold text-slate-900"
                >
                  Preview live route
                </a>
              ) : null}
              <button
                type="button"
                disabled={
                  saving || !values.route || !values.title || !values.headline || !values.summary
                }
                onClick={() => {
                  if (window.confirm(`Publish ${values.route}?`)) void save(undefined, 'published');
                }}
                className="min-h-12 rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white disabled:opacity-50"
              >
                Publish
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({
  name,
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  name: keyof EditorValues;
  label: string;
  value: string;
  onChange: (name: keyof EditorValues, value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-800">{label}</span>
      <input
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        required={required}
        placeholder={placeholder}
        className="min-h-12 w-full rounded-xl border border-slate-300 px-4"
      />
    </label>
  );
}
function TextArea({
  name,
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  name: keyof EditorValues;
  label: string;
  value: string;
  onChange: (name: keyof EditorValues, value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-800">{label}</span>
      <textarea
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        required={required}
        placeholder={placeholder}
        rows={6}
        className="w-full rounded-xl border border-slate-300 px-4 py-3"
      />
    </label>
  );
}
