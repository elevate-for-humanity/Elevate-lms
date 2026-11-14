'use client';
import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import type { NavItem, NavSection } from '@/lib/navigation/navigation-config';
export function PortalToolSearch({
  sections,
  onNavigate,
}: {
  sections: NavSection[];
  onNavigate?: () => void;
}) {
  const [query, setQuery] = useState('');
  const id = useId();
  const tools = useMemo(() => {
    const result: NavItem[] = [],
      seen = new Set<string>();
    const visit = (item: NavItem) => {
      if (!seen.has(item.href)) {
        result.push(item);
        seen.add(item.href);
      }
      item.children?.forEach(visit);
    };
    sections.forEach((section) => section.items.forEach(visit));
    return result;
  }, [sections]);
  const term = query.trim().toLowerCase();
  const matches = term ? tools.filter((item) => item.label.toLowerCase().includes(term)) : [];
  return (
    <div className="relative w-full">
      <label htmlFor={id} className="sr-only">
        Find a dashboard tool
      </label>
      <input
        id={id}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setQuery('');
        }}
        aria-controls={term ? `${id}-results` : undefined}
        placeholder="Find a dashboard tool…"
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950"
      />
      {term ? (
        <div
          id={`${id}-results`}
          className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-300 bg-white p-2 shadow-lg"
        >
          {matches.length ? (
            <ul>
              {matches.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      setQuery('');
                      onNavigate?.();
                    }}
                    className="block min-h-12 rounded-lg p-3 font-semibold text-slate-950 hover:bg-slate-100"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p role="status" className="p-3 text-slate-700">
              No matching tools. Try another name.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
