
'use client';

import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Plus, Send, Bell, Users } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

export default function InstructorAnnouncementsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [enrolledCount, setEnrolledCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [courseId]);

  async function loadData() {
    const supabase = createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Load course
    const { data: courseData } = await supabase
      .from('training_courses')
      .select('id, title, instructor_id')
      .eq('id', courseId)
      .single();

    if (!courseData || courseData.instructor_id !== user.id) {
      router.push('/instructor/courses');
      return;
    }

    setCourse(courseData);

    // Load announcements
    const res = await fetch(`/api/courses/${courseId}/announcements`);
    if (res.ok) {
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    }

    // Get enrolled count
    const { count } = await supabase
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);
    
    setEnrolledCount(count || 0);
    setLoading(false);
  }

  async function postAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    
    setPosting(true);
    
    const res = await fetch(`/api/courses/${courseId}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message }),
    });

    if (res.ok) {
      setTitle('');
      setMessage('');
      setShowForm(false);
      loadData();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to post announcement');
    }
    
    setPosting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/instructor-page-3.jpg" alt="Instructor portal" fill sizes="100vw" className="object-cover" priority />
      </section>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Instructor", href: "/instructor" }, { label: "Announcements" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/instructor/courses/${courseId}`}
            className="inline-flex items-center text-brand-blue-600 hover:text-brand-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
              <p className="text-gray-600 mt-1">{course?.title}</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
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
                <p className="text-sm text-gray-500">Will be notified</p>
              </div>
            </div>
          </div>
        </div>

        {/* New Announcement Form */}
        {showForm && (
          <div className="bg-white rounded-xl border p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Post New Announcement</h2>
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
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
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
                  {posting ? 'Posting...' : 'Post Announcement'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
              <p className="text-sm text-gray-500">
                This will notify all {enrolledCount} enrolled students.
              </p>
            </form>
          </div>
        )}

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <div key={announcement.id} className="bg-white rounded-xl border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                    <p className="text-gray-600 mt-2 whitespace-pre-wrap">{announcement.body}</p>
                    <p className="text-sm text-slate-500 mt-4">
                      Posted {new Date(announcement.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl border p-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No announcements yet</h3>
              <p className="text-gray-500 mb-6">
                Keep your students informed with course announcements.
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
