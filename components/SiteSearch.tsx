"use client";

import React from 'react';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  X,
  FileText,
  Users,
  Calendar,
  Briefcase,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface SearchResult {
  title: string;
  url: string;
  description: string;
  category: 'page' | 'program' | 'event' | 'article';
}

const searchableContent: SearchResult[] = [
  // Pages
  {
    title: 'About Us',
    url: '/about',
    description: 'Learn about our mission and impact',
    category: 'page',
  },
  {
    title: 'Programs',
    url: '/programs',
    description: 'Explore our career training programs',
    category: 'page',
  },
  {
    title: 'Contact',
    url: '/contact',
    description: 'Get in touch with our team',
    category: 'page',
  },
  {
    title: 'Success Stories',
    url: '/success-stories',
    description: 'Read inspiring testimonials from graduates',
    category: 'page',
  },
  {
    title: 'FAQ',
    url: '/faq',
    description: 'Frequently asked questions',
    category: 'page',
  },
  {
    title: 'Employer Services',
    url: '/employer-services',
    description: 'Partner with us for workforce solutions',
    category: 'page',
  },
  {
    title: 'Events Calendar',
    url: '/events',
    description: 'Upcoming workshops and events',
    category: 'page',
  },
  {
    title: 'News & Blog',
    url: '/news',
    description: 'Latest updates and articles',
    category: 'page',
  },
  {
    title: 'Volunteer',
    url: '/volunteer',
    description: 'Join our volunteer team',
    category: 'page',
  },
  {
    title: 'Annual Report',
    url: '/annual-report',
    description: '2024 impact and financial report',
    category: 'page',
  },
  {
    title: 'Donate',
    url: '/donate',
    description: 'Support our mission',
    category: 'page',
  },

  // Programs
  {
    title: 'Healthcare Training',
    url: '/programs#healthcare',
    description: 'CNA, Medical Assistant, Phlebotomy',
    category: 'program',
  },
  {
    title: 'Technology Training',
    url: '/programs#technology',
    description: 'IT Support, Cybersecurity, Web Development',
    category: 'program',
  },
  {
    title: 'Skilled Trades',
    url: '/programs#trades',
    description: 'HVAC, Electrical, Plumbing, Welding',
    category: 'program',
  },
  {
    title: 'Business & Office',
    url: '/programs#business',
    description: 'Administrative Assistant, Customer Service',
    category: 'program',
  },
  {
    title: 'Transportation',
    url: '/programs#transportation',
    description: 'CDL Training, Forklift Certification',
    category: 'program',
  },

  // Events
  {
    title: 'Career Fair',
    url: '/events#career-fair',
    description: 'Monthly career fair with local employers',
    category: 'event',
  },
  {
    title: 'Resume Workshop',
    url: '/events#resume',
    description: 'Professional resume building workshop',
    category: 'event',
  },
  {
    title: 'Interview Skills',
    url: '/events#interview',
    description: 'Mock interviews and preparation',
    category: 'event',
  },

  // Articles
  {
    title: 'How to Get Started',
    url: '/news#getting-started',
    description: 'Step-by-step guide to enrollment',
    category: 'article',
  },
  {
    title: 'Financial Aid Options',
    url: '/news#financial-aid',
    description: 'WIOA, WRG, and other funding sources',
    category: 'article',
  },
];

export default function SiteSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const searchDatabase = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      
      // Search programs
      const { data: programs } = await supabase
        .from('training_programs')
        .select('name, slug, description, category')
        .eq('is_active', true)
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(5);

      const programResults: SearchResult[] = (programs || []).map(p => ({
        title: p.name,
        url: `/programs/${p.slug}`,
        description: p.description?.substring(0, 100) || p.category || '',
        category: 'program',
      }));

      // Search events
      const { data: events } = await supabase
        .from('events')
        .select('title, slug, description')
        .gte('event_date', new Date().toISOString())
        .ilike('title', `%${searchQuery}%`)
        .limit(3);

      const eventResults: SearchResult[] = (events || []).map(e => ({
        title: e.title,
        url: `/events/${e.slug}`,
        description: e.description?.substring(0, 100) || '',
        category: 'event',
      }));

      // Combine with static pages
      const staticResults = searchableContent.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);

      setResults([...programResults, ...eventResults, ...staticResults].slice(0, 10));
    } catch (err) {
      console.error('Search error:', err);
      // Fallback to static search
      setResults(searchableContent.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchDatabase(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchDatabase]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'page':
        return <FileText className="w-4 h-4" />;
      case 'program':
        return <GraduationCap className="w-4 h-4" />;
      case 'event':
        return <Calendar className="w-4 h-4" />;
      case 'article':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'page':
        return 'text-brand-blue-600 bg-brand-blue-50';
      case 'program':
        return 'text-teal-600 bg-teal-50';
      case 'event':
        return 'text-purple-600 bg-purple-50';
      case 'article':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-black bg-slate-50';
    }
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-black bg-slate-100 hover:bg-slate-200 rounded-lg transition"
        aria-label="Search site"
      >
        <Search className="w-4 h-4" />
        <span className="hidden md:inline">Search</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-slate-500 bg-white border border-slate-300 rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm">
          <div
            ref={searchRef}
            className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search programs, pages, events..."
                className="flex-1 text-lg outline-none"
                autoFocus
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto">
              {query.trim().length < 2 ? (
                <div className="px-4 py-8 text-center text-slate-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">
                    Type at least 2 characters to search
                  </p>
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500">
                  <p className="text-sm">
                    No results found for &quot;{query}&quot;
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {results.map((result, index) => (
                    <Link
                      key={index}
                      href={result.url}
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition"
                    >
                      <div
                        className={`p-2 rounded-lg ${getCategoryColor(result.category)}`}
                      >
                        {getCategoryIcon(result.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-black mb-1">
                          {result.title}
                        </div>
                        <div className="text-sm text-black line-clamp-1">
                          {result.description}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider">
                        {result.category}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded">
                    ↑
                  </kbd>
                  <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded">
                    ↓
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded">
                    ↵
                  </kbd>
                  <span>Select</span>
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded">
                  ESC
                </kbd>
                <span>Close</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
