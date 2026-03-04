
'use client';

import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Plus, Send, Bell, Users, Megaphone } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author?: { full_name: string };
}

export default function InstructorProgramAnnouncementsPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;
  
  const [program, setProgram] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [enrolledCount, setEnrolledCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [programId]);

  async function loadData() {
    const supabase = createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Load program
    const { data: programData } = await supabase
      .from('programs')
      .select('id, title, name')
      .eq('id', programId)
      .single();

    if (!programData) {
      router.push('/instructor/programs');
      return;
    }

    setProgram(programData);

    // Load announcements for this program
    const { data: announcementsData } = await supabase
      .from('program_announcements')
      .select(`
        id,
        title,
        content,
        created_at,
        author:profiles!author_id(full_name)
      `)
      .eq('program_id', programId)
      .order('created_at', { ascending: false });

    setAnnouncements(announcementsData || []);

    // Get enrolled count
    const { count } = await supabase
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', programId);
    
    setEnrolledCount(count || 0);
    setLoading(false);
  }

  async function postAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    setPosting(true);
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { error } = await supabase
      .from('program_announcements')
      .insert({
        program_id: programId,
        author_id: user.id,
        title,
        content,
      });

    if (!error) {
      setTitle('');
      setContent('');
      setShowForm(false);
      loadData();
    } else {
      alert('Failed to post announcement');
    }
    
    setPosting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/instructor-page-10.jpg" alt="Instructor portal" fill sizes="100vw" className="object-cover" priority />
      </section>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Instructor", href: "/instructor" }, { label: "Announcements" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/instructor/programs"
            className="inline-flex items-center text-brand-blue-600 hover:text-brand-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Programs
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Program Announcements</h1>
              <p className="text-gray-600 mt-1">{program?.title || program?.name}</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
            >
              <Megaphone className="w-4 h-4" />
              New Announcement
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
                <p className="text-sm text-gray-500">Announcements</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{enrolledCount}</p>
                <p className="text-sm text-gray-500">Students in Program</p>
              </div>
            </div>
          </div>
        </div>

        {/* New Announcement Form */}
        {showForm && (
          <div className="bg-white rounded-xl border p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Post Program Announcement</h2>
            <form onSubmit={postAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your announcement..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={posting}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {posting ? 'Posting...' : 'Post to All Students'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <div key={announcement.id} className="bg-white rounded-xl border p-6">
                <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                <p className="text-gray-600 mt-2 whitespace-pre-wrap">{announcement.content}</p>
                <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
                  <span>Posted by {announcement.author?.full_name || 'Instructor'}</span>
                  <span>•</span>
                  <span>
                    {new Date(announcement.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl border p-12 text-center">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No announcements yet</h3>
              <p className="text-gray-500 mb-6">
                Keep all students in this program informed with announcements.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Create First Announcement
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
