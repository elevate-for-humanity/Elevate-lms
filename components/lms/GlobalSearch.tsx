
"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Search } from "lucide-react";

function GlobalSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams?.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const supabase = createClient();

  // Log search and get suggestions
  async function logSearch(searchQuery: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Log search to history
    await supabase
      .from('search_history')
      .insert({
        user_id: user?.id,
        query: searchQuery,
        search_type: 'global',
        searched_at: new Date().toISOString()
      });

    // Update search analytics
    await supabase.rpc('increment_search_count', { search_query: searchQuery });
  }

  // Load search suggestions from DB + search index
  useEffect(() => {
    async function loadSuggestions() {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      // Fetch from both Supabase suggestions and the search API
      const [dbResult, apiResult] = await Promise.all([
        supabase
          .from('search_suggestions')
          .select('suggestion')
          .ilike('suggestion', `%${query}%`)
          .limit(3),
        fetch(`/api/search?q=${encodeURIComponent(query)}&limit=3&source=index`)
          .then(r => r.json())
          .catch(() => ({ results: [] })),
      ]);

      const dbSuggestions = (dbResult.data || []).map((s: any) => s.suggestion);
      const indexSuggestions = (apiResult.results || []).map((r: any) => r.title);
      const merged = [...new Set([...dbSuggestions, ...indexSuggestions])].slice(0, 5);
      setSuggestions(merged);
    }
    const debounce = setTimeout(loadSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query, supabase]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      router.push("/courses");
      return;
    }
    logSearch(q);
    router.push(`/courses?q=${encodeURIComponent(q)}`);
  }

  useEffect(() => {
    setQuery(initial);
  }, [initial]);

  return (
    <form
      onSubmit={onSubmit}
      className="relative mx-auto flex max-w-2xl items-center"
    >
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          className="w-full rounded-full border border-slate-200 bg-white pl-12 pr-32 py-4 text-sm md:text-base shadow-card focus:border-accent-500 focus:outline-none focus:ring-4 focus:ring-accent-100 transition-all"
          placeholder="Search programs, courses, or topics…"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-accent-500 px-6 py-2 text-sm font-semibold text-white shadow-md hover:bg-accent-600 active:scale-95 transition-all duration-200"
        >
          Search
        </button>
      </div>
    </form>
  );
}

export function GlobalSearch() {
  return (
    <Suspense fallback={
      <form className="relative w-full max-w-2xl">
        <div className="relative">
          <input
            type="search"
            placeholder="Search courses..."
            className="w-full rounded-full border-2 border-slate-200 bg-white px-6 py-3 pr-32 text-base shadow-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition-all duration-200"
            disabled
          />
        </div>
      </form>
    }>
      <GlobalSearchContent />
    </Suspense>
  );
}
