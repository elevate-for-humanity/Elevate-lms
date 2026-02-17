"use client";

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// Static pages always available
const staticPages = [
  { title: 'About Us', href: '/about', category: 'Page' },
  { title: 'Contact', href: '/contact', category: 'Page' },
  { title: 'Apply Now', href: '/apply', category: 'Page' },
  { title: 'Student Portal', href: '/student-portal', category: 'Page' },
  { title: 'All Programs', href: '/programs', category: 'Page' },
];

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<Array<{title: string; href: string; category: string}>>([]);
  const [loading, setLoading] = React.useState(false);
  const pathname = usePathname();

  // Search programs from database
  const searchPrograms = React.useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: programs } = await supabase
        .from('training_programs')
        .select('name, slug')
        .eq('is_active', true)
        .ilike('name', `%${searchQuery}%`)
        .limit(10);

      const programResults = (programs || []).map(p => ({
        title: p.name,
        href: `/programs/${p.slug}`,
        category: 'Program',
      }));

      // Combine with static pages that match
      const pageResults = staticPages.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSearchResults([...programResults, ...pageResults]);
    } catch (err) {
      console.error('Search error:', err);
      // Fallback to static search
      setSearchResults(staticPages.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      searchPrograms(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchPrograms]);

  const filteredResults = searchResults;

  // Close dialog on route change
  React.useEffect(() => {
    setOpen(false);
    setQuery('');
  }, [pathname]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-2" aria-label="Search programs and pages">
          <Search className="h-4 w-4" />
          <span className="hidden lg:inline">Search...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 lg:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Search programs, pages..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setQuery(e.target.value)}
            className="h-12"
            autoFocus
          />
          {query && (
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
              {filteredResults.length > 0 ? (
                filteredResults.map((result) => (
                  <Link
                    key={result.href}
                    href={result.href}
                    onClick={() => {
                      setOpen(false);
                      setQuery('');
                    }}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-accent transition-colors"
                  >
                    <div>
                      <div className="font-medium">{result.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.category}
                      </div>
                    </div>
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No results found for "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
