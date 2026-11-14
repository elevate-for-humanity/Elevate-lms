'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Search,
  Image,
  Video,
  Upload,
  Wand2,
  Heart,
  Download,
  Trash2,
  Plus,
  X,
  Check,
  Grid3X3,
  List,
  Filter,
  FolderOpen,
  ExternalLink,
  Copy,
  Layers
} from 'lucide-react';
import type {
  MediaItem,
  MediaSource,
} from './types';

async function loadSavedImages(query: string): Promise<MediaItem[]> {
  const params = new URLSearchParams({ type: 'image', limit: '100', search: query });
  const response = await fetch(`/api/admin/media-assets?${params}`, { credentials: 'include', cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok || !payload.ok || !Array.isArray(payload.assets)) throw new Error('Unable to load saved images.');
  return payload.assets.flatMap((asset: { id: string; title?: string; created_at: string; metadata?: { public_url?: string; width?: number; height?: number; kind?: string } }) => {
    const url = asset.metadata?.public_url;
    if (!url) return [];
    const width = asset.metadata?.width || 0;
    const height = asset.metadata?.height || 0;
    return [{ id: asset.id, type: 'image' as const, url, thumbnailUrl: url,
      title: asset.title || 'Saved image', source: asset.metadata?.kind === 'ai-image' ? 'ai_generated' as const : 'brand_library' as const,
      width, height, aspectRatio: width && height ? `${width}:${height}` : '',
      tags: [], seoKeywords: [], usedOn: [], usedCount: 0,
      createdAt: asset.created_at, updatedAt: asset.created_at,
      license: 'See saved asset rights', requiresAttribution: false }];
  });
}

interface MediaStudioProps {
  onSelectMedia?: (item: MediaItem) => void;
  selectionMode?: boolean;
  maxSelection?: number;
}

export function MediaStudio({
  onSelectMedia,
  selectionMode = false,
  maxSelection = 1,
}: MediaStudioProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'generate' | 'library'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [error, setError] = useState('');

  const handleSelect = useCallback((item: MediaItem) => {
    if (selectionMode) {
      if (selectedItems.find(s => s.id === item.id)) {
        setSelectedItems(prev => prev.filter(s => s.id !== item.id));
      } else if (selectedItems.length < maxSelection) {
        setSelectedItems(prev => [...prev, item]);
        onSelectMedia?.(item);
      }
    } else {
      onSelectMedia?.(item);
    }
  }, [selectedItems, maxSelection, selectionMode, onSelectMedia]);

  const handleGenerate = async () => {
    if (!generationPrompt.trim()) return;
    setIsGenerating(true);
    setError('');
    try {
      const response = await fetch('/api/admin/media-studio/image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: 'Media Studio', title: generationPrompt.slice(0, 180), prompt: generationPrompt, usage: 'general' }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok || !payload.publicUrl) throw new Error('Image generation or saving failed.');
      setGenerationPrompt('');
      setActiveTab('library');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Image generation failed.');
    } finally { setIsGenerating(false); }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-slate-200">
      {error && <p role="alert" className="p-3 text-red-700">{error}</p>}
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-brand-red-600" />
          <h2 className="font-bold text-slate-900">Media Studio</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'search' as const, label: 'Search', icon: Search },
          { id: 'generate' as const, label: 'Generate', icon: Wand2 },
          { id: 'library' as const, label: 'Library', icon: FolderOpen },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-brand-red-600 border-b-2 border-brand-red-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'search' && (
          <SearchTab
            query={searchQuery}
            onQueryChange={setSearchQuery}
            viewMode={viewMode}
            selectedItems={selectedItems}
            onSelect={handleSelect}
            selectionMode={selectionMode}
          />
        )}

        {activeTab === 'generate' && (
          <GenerateTab
            prompt={generationPrompt}
            onPromptChange={setGenerationPrompt}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
          />
        )}

        {activeTab === 'library' && (
          <LibraryTab
            viewMode={viewMode}
            selectedItems={selectedItems}
            onSelect={handleSelect}
            selectionMode={selectionMode}
          />
        )}
      </div>

      {/* Footer */}
      {selectionMode && (
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-sm text-slate-600">
            {selectedItems.length} selected
          </span>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors">
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-brand-red-600 text-white rounded-lg text-sm font-medium hover:bg-brand-red-700 transition-colors"
              disabled={selectedItems.length === 0}
            >
              Use {selectedItems.length} {selectedItems.length === 1 ? 'Image' : 'Images'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Search Tab
function SearchTab({
  query,
  onQueryChange,
  viewMode,
  selectedItems,
  onSelect,
  selectionMode,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  viewMode: 'grid' | 'list';
  selectedItems: MediaItem[];
  onSelect: (item: MediaItem) => void;
  selectionMode: boolean;
}) {
  const [results, setResults] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSource, setActiveSource] = useState<MediaSource | 'all'>('all');
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const items = await loadSavedImages(query);
      setResults(items.filter(item => activeSource === 'all' || item.source === activeSource));
    } catch (cause) {
      setResults([]);
      setError(cause instanceof Error ? cause.message : 'Media search failed.');
    } finally { setIsLoading(false); }
  };

  const sourceFilters = [
    { id: 'all' as const, label: 'All', icon: '🌐' },

    { id: 'brand_library' as const, label: 'Brand', icon: '🎨' },
    { id: 'ai_generated' as const, label: 'AI', icon: '✨' },

  ];

  return (
    <div className="p-4 space-y-4">
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search photos, videos, or describe what you need..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-600 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-4 py-2 bg-brand-red-600 text-white rounded-lg hover:bg-brand-red-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Source Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sourceFilters.map(source => (
          <button
            key={source.id}
            onClick={() => setActiveSource(source.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeSource === source.id
                ? 'bg-brand-red-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>{source.icon}</span>
            {source.label}
          </button>
        ))}
      </div>

      {/* Generate Option */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Can&apos;t find what you need?</h3>
            <p className="text-sm text-slate-600 mt-1">
              Let AI generate a custom image for your needs
            </p>
          </div>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors">
            Generate
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-3' : 'space-y-2'}>
          {results.map(item => (
            <MediaCard
              key={item.id}
              item={item}
              isSelected={selectedItems.some(s => s.id === item.id)}
              onSelect={() => onSelect(item)}
              viewMode={viewMode}
              showCheckbox={selectionMode}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <Image className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Search for photos or generate new ones</p>
        </div>
      )}
    </div>
  );
}

// Generate Tab
function GenerateTab({
  prompt,
  onPromptChange,
  isGenerating,
  onGenerate,
}: {
  prompt: string;
  onPromptChange: (p: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  const [selectedType, setSelectedType] = useState<string>('hero');
  const [selectedSize, setSelectedSize] = useState<string>('instagram_post');

  const generationTypes = [
    { id: 'hero', label: 'Hero Banner', icon: '🖼️' },
    { id: 'social', label: 'Social Post', icon: '📱' },
    { id: 'flyer', label: 'Flyer', icon: '📄' },
    { id: 'infographic', label: 'Infographic', icon: '📊' },
    { id: 'certificate', label: 'Certificate', icon: '🎓' },
    { id: 'custom', label: 'Custom', icon: '✨' },
  ];

  const presetSizes = [
    { id: 'instagram_post', label: 'Instagram Post (1080×1080)' },
    { id: 'instagram_story', label: 'Instagram Story (1080×1920)' },
    { id: 'facebook_post', label: 'Facebook Post (1200×630)' },
    { id: 'website_hero', label: 'Website Hero (1920×1080)' },
    { id: 'youtube_thumbnail', label: 'YouTube Thumbnail (1280×720)' },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Generation Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          What do you want to create?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {generationTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                selectedType === type.id
                  ? 'border-brand-red-600 bg-red-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-xl">{type.icon}</span>
              <p className="text-sm font-medium mt-1">{type.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Describe your image
        </label>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Example: A professional hero image showing diverse healthcare students in a modern classroom setting, warm lighting, aspirational mood"
          className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-600 focus:border-transparent resize-none"
        />
      </div>

      {/* Size */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Size
        </label>
        <select
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-600"
        >
          {presetSizes.map(size => (
            <option key={size.id} value={size.id}>{size.label}</option>
          ))}
        </select>
      </div>

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={!prompt.trim() || isGenerating}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all font-medium"
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5" />
            Generate Image
          </>
        )}
      </button>

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-800 mb-2">💡 Tips for better results</h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Include details about mood, lighting, and style</li>
          <li>• Mention subjects and actions you want to see</li>
          <li>• Specify colors or branding if needed</li>
          <li>• Start broad, then refine with feedback</li>
        </ul>
      </div>
    </div>
  );
}

// Library Tab
function LibraryTab({
  viewMode,
  selectedItems,
  onSelect,
  selectionMode,
}: {
  viewMode: 'grid' | 'list';
  selectedItems: MediaItem[];
  onSelect: (item: MediaItem) => void;
  selectionMode: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All', icon: '📁' },
    { id: 'programs', label: 'Programs', icon: '🎓' },
    { id: 'students', label: 'Students', icon: '👥' },
    { id: 'employers', label: 'Employers', icon: '🤝' },
    { id: 'events', label: 'Events', icon: '📅' },
    { id: 'brand', label: 'Brand', icon: '🎨' },
  ];

  const [libraryItems, setLibraryItems] = useState<MediaItem[]>([]);
  const [libraryError, setLibraryError] = useState('');
  useEffect(() => {
    let active = true;
    loadSavedImages('').then(items => { if (active) setLibraryItems(items); })
      .catch(cause => { if (active) setLibraryError(cause instanceof Error ? cause.message : 'Unable to load saved media.'); });
    return () => { active = false; };
  }, []);

  return (
    <div className="p-4 space-y-4">
      {libraryError && <p role="alert" className="text-red-700">{libraryError}</p>}
      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-brand-red-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {libraryItems.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h3 className="font-medium text-slate-900 mb-1">No images yet</h3>
          <p className="text-sm text-slate-500 mb-4">
            Upload images or save from search results
          </p>
          <button className="px-4 py-2 bg-brand-red-600 text-white rounded-lg hover:bg-brand-red-700 text-sm font-medium transition-colors">
            Upload Images
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-3' : 'space-y-2'}>
          {libraryItems.map(item => (
            <MediaCard
              key={item.id}
              item={item}
              isSelected={selectedItems.some(s => s.id === item.id)}
              onSelect={() => onSelect(item)}
              viewMode={viewMode}
              showCheckbox={selectionMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Media Card Component
function MediaCard({
  item,
  isSelected,
  onSelect,
  viewMode,
  showCheckbox,
}: {
  item: MediaItem;
  isSelected: boolean;
  onSelect: () => void;
  viewMode: 'grid' | 'list';
  showCheckbox: boolean;
}) {
  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-lg overflow-hidden cursor-pointer transition-all ${
        viewMode === 'grid' ? 'aspect-square' : 'h-20'
      } ${
        isSelected
          ? 'ring-2 ring-brand-red-600 ring-offset-2'
          : 'hover:ring-2 hover:ring-slate-300'
      }`}
    >
      <img
        src={item.thumbnailUrl}
        alt={item.title}
        className={`w-full h-full object-cover ${viewMode === 'list' ? 'w-20 h-20 object-cover' : ''}`}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Checkbox */}
      {showCheckbox && (
        <div className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          isSelected
            ? 'bg-brand-red-600 border-brand-red-600'
            : 'bg-white/80 border-white'
        }`}>
          {isSelected && <Check className="w-4 h-4 text-white" />}
        </div>
      )}

      {/* Actions */}
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 bg-white/90 rounded hover:bg-white transition-colors">
          <Heart className="w-4 h-4 text-slate-600" />
        </button>
        <button className="p-1.5 bg-white/90 rounded hover:bg-white transition-colors">
          <Download className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Source Badge */}
      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/50 text-white text-xs rounded">
        {item.source === 'pexels' ? '📷' : item.source === 'ai_generated' ? '✨' : '🎨'}
      </div>

      {/* Info for list view */}
      {viewMode === 'list' && (
        <div className="flex-1 p-2">
          <p className="font-medium text-slate-900 text-sm truncate">{item.title}</p>
          <p className="text-xs text-slate-500">{item.width}×{item.height}</p>
        </div>
      )}
    </div>
  );
}

export default MediaStudio;
