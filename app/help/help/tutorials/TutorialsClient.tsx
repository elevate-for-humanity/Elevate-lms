'use client';

import { useState } from 'react';
import { Play, Clock, Search } from 'lucide-react';

type Tutorial = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  thumbnail_url: string | null;
  video_url: string | null;
  duration: string | null;
};

const CATEGORY_ICONS: Record<string, string> = {
  'Getting Started': '🚀',
  'Learning':        '📚',
  'Certificates':    '🏆',
  'Account':         '⚙️',
  'Support':         '💬',
};

export function TutorialsClient({ tutorials }: { tutorials: Tutorial[] }) {
  const categories = ['All', ...Array.from(new Set(tutorials.map(t => t.category)))];
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);

  const filtered = tutorials.filter(t => {
    const matchesCat = activeCategory === 'All' || t.category === activeCategory;
    const matchesSearch = !search
      || t.title.toLowerCase().includes(search.toLowerCase())
      || (t.description ?? '').toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  function handleWatch(tutorial: Tutorial) {
    if (tutorial.video_url) {
      setPlaying(tutorial.id);
    } else {
      // No video yet — open support contact as fallback
      window.location.href = '/support/contact?subject=' + encodeURIComponent('Tutorial request: ' + tutorial.title);
    }
  }

  return (
    <>
      {/* Search */}
      <div className="relative max-w-lg mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tutorials..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 text-sm"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-brand-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat !== 'All' && CATEGORY_ICONS[cat] ? `${CATEGORY_ICONS[cat]} ` : ''}{cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500 mb-6">
        {filtered.length} tutorial{filtered.length !== 1 ? 's' : ''}
        {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
        {search ? ` matching "${search}"` : ''}
      </p>

      {/* Tutorial grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Play className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No tutorials match your search.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(tutorial => (
            <div key={tutorial.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Thumbnail / video player */}
              {playing === tutorial.id && tutorial.video_url ? (
                <div className="aspect-video bg-black">
                  <iframe
                    src={tutorial.video_url}
                    className="w-full h-full"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    title={tutorial.title}
                  />
                </div>
              ) : (
                <div
                  className="aspect-video bg-gradient-to-br from-brand-blue-600 to-brand-blue-800 flex items-center justify-center cursor-pointer group relative"
                  onClick={() => handleWatch(tutorial)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && handleWatch(tutorial)}
                  aria-label={`Watch ${tutorial.title}`}
                >
                  {tutorial.thumbnail_url ? (
                    <img src={tutorial.thumbnail_url} alt={tutorial.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : null}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                  <div className="relative w-14 h-14 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-brand-blue-600 ml-1" />
                  </div>
                  {!tutorial.video_url && (
                    <span className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded">
                      Request video
                    </span>
                  )}
                </div>
              )}

              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-brand-blue-600 bg-brand-blue-50 px-2 py-0.5 rounded-full">
                    {tutorial.category}
                  </span>
                  {tutorial.duration && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />{tutorial.duration}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 leading-snug">{tutorial.title}</h3>
                {tutorial.description && (
                  <p className="text-sm text-slate-500 line-clamp-2">{tutorial.description}</p>
                )}
                <button
                  onClick={() => handleWatch(tutorial)}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  {tutorial.video_url ? 'Watch Tutorial' : 'Request Tutorial'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
