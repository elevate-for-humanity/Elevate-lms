export const dynamic = 'force-dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  BookOpen,
  FileText,
  Video,
  Download,
  Search,
  Filter,
  Folder,
  File,
  ExternalLink,
  Clock,
  Star,
  Bookmark,
} from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/library',
  },
  title: 'Learning Library | Student Portal',
  description: 'Access course materials, documents, videos, and learning resources.',
};

export default async function LibraryPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Library" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's enrolled courses
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      courses (
        id,
        title,
        description,
        thumbnail_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch library resources
  const { data: resources } = await supabase
    .from('library_resources')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch course materials for enrolled courses
  const courseIds = enrollments?.map(e => e.course_id) || [];
  const { data: courseMaterials } = await supabase
    .from('course_materials')
    .select('*, courses (title)')
    .in('course_id', courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false });

  // Fetch user's bookmarked resources
  const { data: bookmarks } = await supabase
    .from('resource_bookmarks')
    .select('resource_id')
    .eq('user_id', user.id);

  const bookmarkedIds = new Set(bookmarks?.map(b => b.resource_id) || []);

  // Group materials by type
  const documents = courseMaterials?.filter(m => m.type === 'document') || [];
  const videos = courseMaterials?.filter(m => m.type === 'video') || [];
  const links = courseMaterials?.filter(m => m.type === 'link') || [];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video':
        return Video;
      case 'document':
        return FileText;
      case 'link':
        return ExternalLink;
      default:
        return File;
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-brand-red-100 text-brand-red-600';
      case 'document':
        return 'bg-brand-blue-100 text-brand-blue-600';
      case 'link':
        return 'bg-brand-green-100 text-brand-green-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const hasContent = (courseMaterials && courseMaterials.length > 0) || (resources && resources.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Library" }]} />
        </div>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Learning Library</h1>
            <p className="text-slate-600 mt-1">
              Access course materials, documents, and learning resources
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search library..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
                <option value="">All Types</option>
                <option value="document">Documents</option>
                <option value="video">Videos</option>
                <option value="link">Links</option>
              </select>
              <select className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
                <option value="">All Courses</option>
                {enrollments?.map(e => (
                  <option key={e.course_id} value={e.course_id}>
                    {e.courses?.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {hasContent ? (
          <div className="space-y-8">
            {/* Course Materials by Course */}
            {enrollments && enrollments.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Course Materials</h2>
                <div className="space-y-4">
                  {enrollments.map(enrollment => {
                    const materials = courseMaterials?.filter(m => m.course_id === enrollment.course_id) || [];
                    if (materials.length === 0) return null;

                    return (
                      <div
                        key={enrollment.course_id}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                      >
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                              <Folder className="w-5 h-5 text-brand-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900">{enrollment.courses?.title}</h3>
                              <p className="text-sm text-slate-600">{materials.length} resources</p>
                            </div>
                          </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {materials.map(material => {
                            const IconComponent = getFileIcon(material.type);
                            const colorClass = getFileColor(material.type);

                            return (
                              <div
                                key={material.id}
                                className="flex items-center justify-between p-4 hover:bg-slate-50 transition"
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                                    <IconComponent className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-900">{material.title}</p>
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                      <span className="capitalize">{material.type}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(material.created_at)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button className="p-2 text-slate-400 hover:text-yellow-500 transition">
                                    <Bookmark className={`w-5 h-5 ${bookmarkedIds.has(material.id) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                                  </button>
                                  {material.file_url && (
                                    <a
                                      href={material.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
                                    >
                                      {material.type === 'link' ? (
                                        <>
                                          <ExternalLink className="w-4 h-4" />
                                          Open
                                        </>
                                      ) : (
                                        <>
                                          <Download className="w-4 h-4" />
                                          Download
                                        </>
                                      )}
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Public Resources */}
            {resources && resources.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">General Resources</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map(resource => {
                    const IconComponent = getFileIcon(resource.type);
                    const colorClass = getFileColor(resource.type);

                    return (
                      <div
                        key={resource.id}
                        className="bg-white rounded-xl border border-slate-200 p-4 hover:border-brand-blue-300 hover:shadow-md transition"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 truncate">{resource.title}</h3>
                            <p className="text-sm text-slate-500 capitalize">{resource.type}</p>
                          </div>
                        </div>
                        {resource.description && (
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                            {resource.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {formatDate(resource.created_at)}
                          </span>
                          {resource.url && (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium"
                            >
                              View →
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Resources Yet</h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Course materials and resources will appear here once you enroll in courses.
            </p>
            <Link
              href="/lms/courses"
              className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-blue-700 transition"
            >
              <BookOpen className="w-5 h-5" />
              Browse Courses
            </Link>
          </div>
        )}

        {/* Quick Access */}
        <div className="mt-8 bg-brand-blue-600 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Quick Access</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/lms/courses"
              className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              <BookOpen className="w-5 h-5" />
              <span>My Courses</span>
            </Link>
            <Link
              href="/lms/assignments"
              className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              <FileText className="w-5 h-5" />
              <span>Assignments</span>
            </Link>
            <Link
              href="/lms/resources"
              className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              <Folder className="w-5 h-5" />
              <span>Resources</span>
            </Link>
            <Link
              href="/lms/help"
              className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              <Star className="w-5 h-5" />
              <span>Help Center</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
