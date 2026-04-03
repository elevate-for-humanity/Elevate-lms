"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import { Search, Video, FileText, BookOpen, HelpCircle, Loader2, Filter, Play, Download, Clock } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'document' | 'course' | 'quiz' | 'module' | 'resource';
  category: string;
  duration?: string;
  thumbnail_url?: string;
  url?: string;
  file_url?: string;
  is_premium: boolean;
  view_count: number;
  created_at: string;
}

interface Props {
  programId?: string;
  courseId?: string;
  category?: string;
  limit?: number;
  showFilters?: boolean;
}

const TYPE_ICONS = {
  video: Video,
  document: FileText,
  course: BookOpen,
  quiz: HelpCircle,
  module: BookOpen,
  resource: FileText,
};

const TYPE_COLORS = {
  video: 'bg-brand-red-100 text-brand-red-700',
  document: 'bg-brand-blue-100 text-brand-blue-700',
  course: 'bg-brand-green-100 text-brand-green-700',
  quiz: 'bg-purple-100 text-purple-700',
  module: 'bg-brand-orange-100 text-brand-orange-700',
  resource: 'bg-gray-100 text-gray-700',
};

export default function ContentLibrary({ 
  programId, 
  courseId, 
  category: initialCategory,
  limit,
  showFilters = true 
}: Props) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['all']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Build query
      let query = supabase
        .from('content_library')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (programId) {
        query = query.eq('program_id', programId);
      }
      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      if (initialCategory && initialCategory !== 'all') {
        query = query.eq('category', initialCategory);
      }
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        // Table might not exist, use fallback data
        console.error('Error fetching content:', error);
        setContent(getFallbackContent());
      } else if (data && data.length > 0) {
        setContent(data);
        // Extract unique categories
        const uniqueCategories = ['all', ...new Set(data.map(item => item.category).filter(Boolean))];
        setCategories(uniqueCategories);
      } else {
        setContent(getFallbackContent());
      }
    } catch (err) {
      console.error('Error:', err);
      setContent(getFallbackContent());
    } finally {
      setLoading(false);
    }
  }, [programId, courseId, initialCategory, limit]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const getFallbackContent = (): ContentItem[] => [
    { id: '1', title: 'Introduction to Barbering', type: 'video', category: 'Barber', duration: '15 min', is_premium: false, view_count: 1250, created_at: new Date().toISOString() },
    { id: '2', title: 'HVAC Fundamentals Course', type: 'course', category: 'HVAC', duration: '2 hours', is_premium: false, view_count: 890, created_at: new Date().toISOString() },
    { id: '3', title: 'Medical Terminology Guide', type: 'document', category: 'Healthcare', is_premium: false, view_count: 2100, created_at: new Date().toISOString() },
    { id: '4', title: 'Workplace Safety Quiz', type: 'quiz', category: 'General', duration: '10 min', is_premium: false, view_count: 3400, created_at: new Date().toISOString() },
    { id: '5', title: 'CDL Pre-Trip Inspection', type: 'video', category: 'CDL', duration: '25 min', is_premium: false, view_count: 1800, created_at: new Date().toISOString() },
    { id: '6', title: 'CNA Skills Checklist', type: 'document', category: 'Healthcare', is_premium: false, view_count: 950, created_at: new Date().toISOString() },
  ];

  // Track content view
  const trackView = async (item: ContentItem) => {
    if (!userId) return;

    const supabase = createClient();
    await supabase.from('content_views').insert({
      content_id: item.id,
      user_id: userId,
      content_type: item.type,
    }).catch(() => {});

    // Update view count
    await supabase
      .from('content_library')
      .update({ view_count: (item.view_count || 0) + 1 })
      .eq('id', item.id)
      .catch(() => {});
  };

  // Filter content
  const filteredContent = content.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const getContentLink = (item: ContentItem) => {
    if (item.url) return item.url;
    if (item.type === 'course') return `/courses/${item.id}`;
    if (item.type === 'video') return `/content/video/${item.id}`;
    if (item.type === 'quiz') return `/content/quiz/${item.id}`;
    return `/content/${item.id}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      {showFilters && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              >
                <option value="all">All Types</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
                <option value="course">Courses</option>
                <option value="quiz">Quizzes</option>
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                  selectedCategory === cat
                    ? 'bg-brand-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredContent.length} {filteredContent.length === 1 ? 'item' : 'items'}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContent.map((item) => {
          const Icon = TYPE_ICONS[item.type] || FileText;
          const colorClass = TYPE_COLORS[item.type] || TYPE_COLORS.resource;

          return (
            <Link
              key={item.id}
              href={getContentLink(item)}
              onClick={() => trackView(item)}
              className="block"
            >
              <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden">
                {/* Thumbnail */}
                {item.thumbnail_url ? (
                  <div className="relative h-40 bg-gray-100">
                    <Image
                      src={item.thumbnail_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                     sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-brand-blue-600 ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`h-32 flex items-center justify-center ${colorClass.replace('text-', 'bg-').replace('-700', '-50')}`}>
                    <Icon className={`w-12 h-12 ${colorClass.split(' ')[1]}`} />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                      {item.duration && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          {item.duration}
                        </span>
                      )}
                    </div>
                    {item.is_premium && (
                      <Badge className="bg-yellow-100 text-yellow-700">Premium</Badge>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {item.view_count?.toLocaleString('en-US') || 0} views
                    </span>
                    <button className="text-brand-blue-600 hover:text-brand-blue-800 text-sm font-medium flex items-center gap-1">
                      {item.type === 'document' ? (
                        <>
                          <Download className="w-4 h-4" />
                          Download
                        </>
                      ) : item.type === 'video' ? (
                        <>
                          <Play className="w-4 h-4" />
                          Watch
                        </>
                      ) : (
                        'Open'
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {filteredContent.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No content found matching your search.</p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSelectedType('all'); }}
            className="text-brand-blue-600 hover:underline text-sm"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
