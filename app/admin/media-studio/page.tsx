"use client";
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import React from 'react';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Upload,
  Trash2,
  Download,
  Image as ImageIcon,
  Folder,
  Search,
  Grid,
  List,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
export const dynamic = 'force-dynamic';

interface MediaFile {
  name: string;
  url: string;
  size: number;
  created_at: string;
  bucket: string;
}



export default function MediaStudioPage() {
  const router = useRouter();

  useEffect(() => {
    // Check admin auth
    fetch('/api/auth/check-admin')
      .then((res) => res.json())
      .then((data) => {
        if (!data.isAdmin) {
          router.push('/login?redirect=/admin');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const [buckets, setBuckets] = useState<string[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; fileName: string }>({ open: false, fileName: '' });

  useEffect(() => {
    loadBuckets();
  }, []);

  useEffect(() => {
    if (selectedBucket) {
      loadFiles(selectedBucket);
    }
  }, [selectedBucket]);

  const loadBuckets = async () => {
    try {
      const res = await fetch('/api/media/buckets');
      if (res.ok) {
        const data = await res.json();
        setBuckets(data.buckets);
        if (data.buckets.length > 0) {
          setSelectedBucket(data.buckets[0]);
        }
      }
    } catch (error) { /* Error handled silently */ 
    // Error handled
  }
  };

  const loadFiles = async (bucket: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/media/files?bucket=${bucket}`);
      const data = await res.json();
      if (res.ok) {
        setFiles(data.files);
      }
    } catch (error) { /* Error handled silently */ 
    // Error handled
  } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', selectedBucket);

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        loadFiles(selectedBucket);
      }
    } catch (error) { /* Error handled silently */ 
    // Error handled
  }
  };

  const handleDeleteClick = (fileName: string) => {
    setDeleteDialog({ open: true, fileName });
  };

  const deleteFile = async () => {
    const fileName = deleteDialog.fileName;
    setDeleteDialog({ open: false, fileName: '' });

    try {
      const res = await fetch(
        `/api/media/delete?bucket=${selectedBucket}&file=${fileName}`,
        {
          method: 'DELETE',
        }
      );
      if (res.ok) {
        loadFiles(selectedBucket);
      }
    } catch (error) { /* Error handled silently */ 
    // Error handled
  }
  };

  const optimizeImages = async () => {
    try {
      const res = await fetch(`/api/media/optimize?bucket=${selectedBucket}`, {
        method: 'POST',
      });
      if (res.ok) {
        alert('Images optimized successfully!');
        loadFiles(selectedBucket);
      }
    } catch (error) { /* Error handled silently */ 
    // Error handled
  }
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Media Studio" }]} />
      </div>
      {/* Hero Section */}
      <section className="relative h-[300px] md:h-[380px] lg:h-[420px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/heroes-hq/success-stories-hero.jpg"
          alt="Media Studio"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-2xl">
            Media Studio
          </h1>
          <p className="text-base md:text-lg mb-8 text-gray-100 drop-shadow-lg">
            Create and manage content for your platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
            >
              Get Started Free
            </Link>
            <Link
              href="/programs"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Media Studio
          </h1>
          <p className="text-black">
            Manage images, videos, and assets across all buckets
          </p>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              {/* Bucket Selector */}
              <select
                value={selectedBucket}
                onChange={(
                  e: React.ChangeEvent<
                    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                  >
                ) => setSelectedBucket(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                {buckets.map((bucket) => (
                  <option key={bucket} value={bucket}>
                    {bucket}
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(
                    e: React.ChangeEvent<
                      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                    >
                  ) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode */}
              <div className="flex gap-1 border rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-brand-blue-100 text-brand-blue-600' : 'text-black'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-brand-blue-100 text-brand-blue-600' : 'text-black'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Actions */}
              <button
                onClick={() => loadFiles(selectedBucket)}
                className="p-2 border rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={optimizeImages}
                disabled={selectedFiles.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Optimize
              </button>

              <label className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 cursor-pointer">
                <Upload className="w-4 h-4" />
                Upload
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(uploadFile);
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Files Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600" />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.name}
                className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square relative bg-gray-100">
                  {file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <Image
                      src={file.url}
                      alt={file.name}
                      fill
                      className="object-cover"
                      sizes="100vw"
                      quality={100}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="w-12 h-12 text-black" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-black truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-black mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => window.open(file.url, '_blank')}
                      className="flex-1 text-xs py-2 px-2 bg-brand-blue-50 text-brand-blue-600 rounded hover:bg-gray-100"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteClick(file.name)}
                      className="text-xs py-2 px-2 bg-brand-red-50 text-brand-orange-600 rounded hover:bg-brand-red-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-black">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-black">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-black">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-black">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.name} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-black">
                      {file.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {(file.size / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {new Date(file.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteClick(file.name)}
                        className="text-brand-orange-600 hover:text-brand-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CTA Section */}
        <section className="py-16    text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                Need Help?
              </h2>
              <p className="text-base md:text-lg mb-8 text-brand-blue-100">
                Manage platform tools and resources for Elevate for Humanity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 text-lg shadow-2xl transition-all"
                >
                  Apply Now - It's Free
                </Link>
                <Link
                  href="/programs"
                  className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-600 border-2 border-white text-lg shadow-2xl transition-all"
                >
                  Browse All Programs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete File"
        description={`Are you sure you want to delete "${deleteDialog.fileName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={deleteFile}
      />
    </div>
  );
}
