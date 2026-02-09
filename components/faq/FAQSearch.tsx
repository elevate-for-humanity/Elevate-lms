'use client';

import { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface FAQSearchProps {
  onSearch: (query: string) => void;
}

export function FAQSearch({ onSearch }: FAQSearchProps) {
  const [query, setQuery] = useState('');

  // Log search queries for analytics
  const logSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) return;
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('faq_search_analytics').insert({
      user_id: user?.id || null,
      search_query: searchQuery,
      searched_at: new Date().toISOString(),
    }).catch(() => {});
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
    
    // Debounced logging
    if (value.length >= 3) {
      setTimeout(() => logSearch(value), 1000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search FAQs..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-xl text-black border-2 border-white/20 focus:border-white focus:outline-none"
          aria-label="Search frequently asked questions"
        />
      </div>
    </div>
  );
}
