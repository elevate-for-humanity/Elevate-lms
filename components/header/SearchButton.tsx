'use client';

import { createClient } from '@/lib/supabase/client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function SearchButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  // Load recent searches and popular searches from DB
  useEffect(() => {
    async function loadSearchData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Load user's recent searches
        const { data: recent } = await supabase
          .from('search_history')
          .select('query, searched_at')
          .eq('user_id', user.id)
          .order('searched_at', { ascending: false })
          .limit(5);
        
        if (recent) setRecentSearches(recent.map(r => r.query));
      }

      // Load popular/suggested searches
      const { data: popular } = await supabase
        .from('search_analytics')
        .select('query, search_count')
        .order('search_count', { ascending: false })
        .limit(5);
      
      if (popular) setSuggestions(popular);
    }
    if (isOpen) loadSearchData();
  }, [isOpen, supabase]);

  // Log search to DB
  const logSearch = async (searchQuery: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('search_history')
      .insert({
        user_id: user?.id || null,
        query: searchQuery,
        searched_at: new Date().toISOString()
      });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await logSearch(query.trim());
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-black hover:text-blue-600 transition"
        aria-label="Search"
      >
        <Search className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white rounded-xl shadow-2xl z-50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black">Search</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-black hover:text-blue-600 transition"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search programs, courses, FAQs..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none text-black"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  Search
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
