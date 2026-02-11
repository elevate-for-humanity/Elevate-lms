"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Resource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'ebook' | 'code';
  description: string;
  tags: string[];
  author: string;
  date: string;
  downloads: number;
}

export function ResourceLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');

  const resources: Resource[] = [
    {
      id: '1',
      title: 'JavaScript ES6 Complete Guide',
      type: 'ebook',
      description: 'Comprehensive guide to modern JavaScript features',
      tags: ['JavaScript', 'ES6', 'Programming'],
      author: 'Dr. Sarah Chen',
      date: '2024-01-15',
      downloads: 1245,
    },
    {
      id: '2',
      title: 'React Hooks Tutorial',
      type: 'video',
      description: 'Learn React Hooks with practical examples',
      tags: ['React', 'JavaScript', 'Frontend'],
      author: 'Alex Kim',
      date: '2024-01-14',
      downloads: 892,
    },
    {
      id: '3',
      title: 'Node.js Best Practices',
      type: 'article',
      description: 'Industry-standard practices for Node.js development',
      tags: ['Node.js', 'Backend', 'Best Practices'],
      author: 'Graduate',
      date: '2024-01-12',
      downloads: 654,
    },
    {
      id: '4',
      title: 'React Component Library',
      type: 'code',
      description: 'Reusable React components for your projects',
      tags: ['React', 'Components', 'UI'],
      author: 'Sarah Williams',
      date: '2024-01-10',
      downloads: 432,
    },
  ];

  const allTags = ['all', ...Array.from(new Set(resources.flatMap(r => r.tags)))];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'all' || resource.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'article': return '📄';
      case 'ebook': return '📚';
      case 'code': return '💻';
      default: return '📁';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Resource Library</h1>
          <p className="text-red-100">Access learning materials and resources</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <Button variant="secondary">Upload Resource</Button>
          </div>
        </Card>

        <div className="flex gap-2 mb-6 flex-wrap">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedTag === tag ? 'bg-brand-orange-600 text-white' : 'bg-white text-black border'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="text-4xl text-2xl md:text-3xl lg:text-4xl">{getTypeIcon(resource.type)}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{resource.title}</h3>
                  <span className="px-2 py-2 bg-orange-100 text-orange-700 text-xs rounded capitalize">
                    {resource.type}
                  </span>
                </div>
              </div>

              <p className="text-sm text-black mb-3">{resource.description}</p>

              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {resource.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-black text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-3">
                <p>By {resource.author}</p>
                <p>{resource.date} • {resource.downloads} downloads</p>
              </div>

              <Button size="sm" className="w-full">Download</Button>
            </Card>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-xl text-black mb-2">No resources found</p>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </Card>
        )}
      </div>
    </div>
  );
}
