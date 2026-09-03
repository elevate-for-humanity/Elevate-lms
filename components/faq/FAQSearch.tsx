'use client';

import { useCallback, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type SearchableFaq = {
  id: string;
  question: string;
  answer: string;
  category?: string;
  display_order?: number;
};

interface FAQSearchProps {
  onSearch?: (query: string) => void;
  faqs?: SearchableFaq[];
}

export function FAQSearch({ onSearch, faqs = [] }: FAQSearchProps) {
  const [query, setQuery] = useState('');

  const logSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) return;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('faq_search_analytics').insert({
        user_id: user?.id || null,
        search_query: searchQuery,
        searched_at: new Date().toISOString(),
      });
    } catch {
      // Search analytics is best-effort and must not interrupt FAQ use.
    }
  }, []);

  const filteredFaqs = useMemo(() => {
    if (!faqs.length) return [];
    const normalized = query.trim().toLowerCase();
    const rows = normalized
      ? faqs.filter((faq) =>
          `${faq.question} ${faq.answer} ${faq.category || ''}`.toLowerCase().includes(normalized),
        )
      : faqs;
    return [...rows].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }, [faqs, query]);

  function handleSearch(value: string) {
    setQuery(value);
    onSearch?.(value);
    if (value.trim().length >= 3) {
      window.setTimeout(() => void logSearch(value.trim()), 700);
    }
  }

  return (
    <div className={faqs.length ? 'w-full' : 'max-w-2xl mx-auto'}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search FAQs…"
          value={query}
          onChange={(event) => handleSearch(event.target.value.slice(0, 200))}
          className="w-full rounded-xl border-2 border-slate-300 bg-white py-4 pl-12 pr-4 text-slate-950 focus:border-brand-blue-700 focus:outline-none"
          aria-label="Search frequently asked questions"
          maxLength={200}
        />
      </div>

      {faqs.length ? (
        <div className="mt-8 space-y-3">
          {filteredFaqs.length ? filteredFaqs.map((faq) => (
            <details key={faq.id} id={faq.category ? `${faq.category}-${faq.id}` : faq.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer font-semibold text-slate-950">{faq.question}</summary>
              <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">{faq.answer}</p>
            </details>
          )) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-700">
              No FAQ matches that search. Try a different term or contact us.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
