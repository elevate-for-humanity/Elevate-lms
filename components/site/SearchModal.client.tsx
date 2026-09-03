'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ALL_PROGRAMS } from '@/data/programs/catalog';

// Static pages also searchable
const STATIC_PAGES = [
  { title: 'About Us', subtitle: 'Our mission and team', href: '/about', category: 'Page' },
  { title: 'Partner With Us', subtitle: 'Become a training site', href: '/partners', category: 'Page' },
  { title: 'Funding & Eligibility', subtitle: 'WIOA, WRG, and other funding options', href: '/start', category: 'Page' },
  { title: 'Contact', subtitle: 'Get in touch with Elevate', href: '/contact', category: 'Page' },
  { title: 'Apply Now', subtitle: 'Start your application', href: '/apply', category: 'Page' },
  { title: 'Sign In', subtitle: 'Log in to your student portal', href: '/login', category: 'Page' },
];

type Result = {
  title: string;
  subtitle: string;
  href: string;
  category: string;
};

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
}

function search(query: string): Result[] {
  if (!query.trim()) return [];
  const q = normalize(query);
  const tokens = q.split(/\s+/).filter(Boolean);

  const programResults: Result[] = ALL_PROGRAMS.filter((p) => {
    const haystack = normalize([p.title, p.subtitle ?? '', p.category ?? ''].join(' '));
    return tokens.every((t) => haystack.includes(t));
  }).map((p) => ({
    title: p.title,
    subtitle: p.subtitle ?? '',
    href: `/programs/${p.slug}`,
    category: p.category ?? 'Program',
  }));

  const pageResults: Result[] = STATIC_PAGES.filter((pg) => {
    const haystack = normalize([pg.title, pg.subtitle].join(' '));
    return tokens.every((t) => haystack.includes(t));
  });

  return [...programResults, ...pageResults].slice(0, 8);
}

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Open on Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setActiveIdx(0);
    }
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  // Run search as user types
  useEffect(() => {
    setResults(search(query));
    setActiveIdx(0);
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      router.push(results[activeIdx].href);
      close();
    }
  }

  return (
    <>
      {/* Search trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search programs and pages"
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm px-2 py-1.5 rounded-lg hover:bg-slate-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
        <span className="hidden xl:inline text-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
          ⌘K
        </span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[99999] flex items-start justify-center pt-[10vh] px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Site search"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-slate-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search programs, pages…"
                className="flex-1 text-slate-900 placeholder-slate-400 text-base bg-transparent outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                className="text-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 hover:bg-slate-100 transition-colors"
              >
                Esc
              </button>
            </div>

            {/* Results */}
            {results.length > 0 ? (
              <ul role="listbox" className="divide-y divide-slate-50 max-h-[50vh] overflow-y-auto">
                {results.map((r, i) => (
                  <li key={r.href} role="option" aria-selected={i === activeIdx}>
                    <Link
                      href={r.href}
                      onClick={close}
                      className={`flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors ${
                        i === activeIdx ? 'bg-slate-50' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{r.title}</p>
                        {r.subtitle && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">{r.subtitle}</p>
                        )}
                      </div>
                      <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
                        {r.category}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : query.trim() ? (
              <p className="px-4 py-6 text-sm text-slate-400 text-center">
                No results for &ldquo;{query}&rdquo;
              </p>
            ) : (
              <div className="px-4 py-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Quick links</p>
                <div className="flex flex-wrap gap-2">
                  {['Barber Apprenticeship', 'CNA', 'HVAC', 'Medical Assistant', 'Check Eligibility'].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuery(q)}
                      className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> open</span>
              <span><kbd className="font-mono">Esc</kbd> close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
