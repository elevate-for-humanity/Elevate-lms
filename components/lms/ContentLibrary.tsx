"use client";

import React from 'react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Upload,
  Folder,
  File,
  Video,
  Image as ImageIcon,
  FileText,
  Code,
  Download,
  Trash2,
  Edit,
  Copy,
  Star,
  Tag,
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  content_type:
    | 'video'
    | 'document'
    | 'image'
    | 'audio'
    | 'scorm'
    | 'interactive'
    | 'quiz';
  file_url: string;
  file_size: number;
  mime_type: string;
  duration_seconds?: number;
  tags: string[];
  category: string;
  difficulty_level: string;
  language: string;
  is_public: boolean;
  usage_count: number;
  created_by: string;
  created_at: string;
}

export default function ContentLibrary() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchContent();
  }, []);

  useEffect(() => {
    filterContent();
  }, [searchQuery, selectedType, selectedCategory, items]);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/content-library');
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    }
  };

  const filterContent = () => {
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter((item) => item.content_type === selectedType);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
  };

  const handleUpload = async (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/content-library/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        fetchContent();
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this content?')) return;

    try {
      await fetch(`/api/content-library/${id}`, { method: 'DELETE' });
      fetchContent();
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return Video;
      case 'image':
        return ImageIcon;
      case 'document':
        return FileText;
      case 'audio':
        return File;
      case 'code':
        return Code;
      default:
        return File;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Content Library</h1>
            <p className="text-sm text-black">
              Manage and reuse your learning content
            </p>
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload Content
              <input
                type="file"
                multiple
                onChange={(
                  e: React.ChangeEvent<
                    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                  >
                ) => e.target.files && handleUpload(e.target.files)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(
                e: React.ChangeEvent<
                  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >
              ) => setSearchQuery(e.target.value)}
              placeholder="Search content..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={selectedType}
            onChange={(
              e: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
              >
            ) => setSelectedType(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Types</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
            <option value="image">Images</option>
            <option value="audio">Audio</option>
            <option value="scorm">SCORM</option>
            <option value="interactive">Interactive</option>
            <option value="quiz">Quizzes</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(
              e: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
              >
            ) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Categories</option>
            <option value="lecture">Lectures</option>
            <option value="tutorial">Tutorials</option>
            <option value="assessment">Assessments</option>
            <option value="resource">Resources</option>
            <option value="activity">Activities</option>
          </select>
          <div className="flex border rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
            >
              List
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex gap-6 text-sm text-black">
          <span>{filteredItems.length} items</span>
          <span>{selectedItems.size} selected</span>
        </div>
      </div>

      {/* Content Grid/List */}
      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const Icon = getIcon(item.content_type);
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg border p-4 hover:shadow-lg transition-shadow cursor-pointer ${
                    selectedItems.has(item.id) ? 'ring-2 ring-brand-blue-500' : ''
                  }`}
                  onClick={() => toggleSelection(item.id)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    {item.content_type === 'image' ? (
                      <Image
                        src={item.file_url}
                        alt={item.title}
                        fill
                        className="object-cover rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : item.content_type === 'video' ? (
                      <video
                        src={item.file_url}
                        playsInline
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Icon className="w-12 h-12 text-gray-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold truncate">{item.title}</h3>
                    <p className="text-sm text-black line-clamp-2">
                      {item.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-2 bg-gray-100 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatFileSize(item.file_size)}</span>
                      {item.duration_seconds && (
                        <span>{formatDuration(item.duration_seconds)}</span>
                      )}
                      <span>{item.usage_count} uses</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        onClick={(e: React.MouseEvent<HTMLElement>) => {
                          e.stopPropagation();
                          window.open(item.file_url, '_blank');
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-sm border rounded hover:bg-gray-50"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                      <button
                        onClick={(e: React.MouseEvent<HTMLElement>) => {
                          e.stopPropagation();
                          // Copy to clipboard
                        }}
                        className="flex items-center justify-center px-2 py-2 text-sm border rounded hover:bg-gray-50"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e: React.MouseEvent<HTMLElement>) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="flex items-center justify-center px-2 py-2 text-sm border rounded hover:bg-brand-red-50 text-brand-orange-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg border">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left text-sm text-black">
                  <th className="p-4 w-12">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Uses</th>
                  <th className="p-4">Created</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const Icon = getIcon(item.content_type);
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleSelection(item.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-gray-500">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-2 text-xs bg-gray-100 rounded capitalize">
                          {item.content_type}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-black">
                        {item.category}
                      </td>
                      <td className="p-4 text-sm text-black">
                        {formatFileSize(item.file_size)}
                      </td>
                      <td className="p-4 text-sm text-black">
                        {item.usage_count}
                      </td>
                      <td className="p-4 text-sm text-black">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 hover:bg-brand-red-100 rounded text-brand-orange-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">No content found</p>
            <p className="text-sm">Upload content to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
