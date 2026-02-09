import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Video, Play, Clock, CheckCircle, BookOpen, Users, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Instructor Training Videos | Elevate for Humanity',
  description: 'Training resources and video tutorials for instructors on the Elevate platform.',
};

export const dynamic = 'force-dynamic';

export default async function InstructorTrainingPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  let videos: any[] = [];
  
  try {
    const { data, error } = await supabase
      .from('instructor_training_videos')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });
    
    if (!error && data) {
      videos = data;
    }
  } catch (err) {
    console.error('Error fetching videos:', err);
  }

  // Default videos if none in database
  const defaultVideos = [
    { id: '1', title: 'Getting Started with the Platform', description: 'Learn how to navigate the instructor dashboard and access key features.', duration_minutes: 15, category: 'Getting Started' },
    { id: '2', title: 'Creating Your First Course', description: 'Step-by-step guide to creating and publishing your first course.', duration_minutes: 25, category: 'Getting Started' },
    { id: '3', title: 'Best Practices for Online Teaching', description: 'Proven techniques for engaging students in virtual environments.', duration_minutes: 20, category: 'Teaching' },
    { id: '4', title: 'Recording Quality Video Lessons', description: 'Tips for lighting, audio, and presentation in your video content.', duration_minutes: 18, category: 'Content Creation' },
    { id: '5', title: 'Managing Student Progress', description: 'How to track attendance, grades, and student engagement.', duration_minutes: 12, category: 'Management' },
    { id: '6', title: 'Using the Assessment Tools', description: 'Create quizzes, assignments, and track student performance.', duration_minutes: 22, category: 'Assessment' },
    { id: '7', title: 'Communicating with Students', description: 'Best practices for messaging, announcements, and feedback.', duration_minutes: 10, category: 'Communication' },
    { id: '8', title: 'Handling Common Issues', description: 'Troubleshooting guide for common instructor challenges.', duration_minutes: 15, category: 'Support' },
  ];

  const displayVideos = videos.length > 0 ? videos : defaultVideos;

  const categories = [...new Set(displayVideos.map(v => v.category))];

  return (
    <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Resources", href: "/resources" }, { label: "Instructor Training" }]} />
      </div>
<div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/resources" className="hover:text-blue-600">Resources</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Instructor Training</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-slate-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center mb-4">
            <Video className="w-10 h-10 mr-4 opacity-80" />
            <h1 className="text-3xl md:text-4xl font-bold">Instructor Training</h1>
          </div>
          <p className="text-xl text-blue-100 max-w-2xl">
            Master the Elevate platform with our comprehensive video training series. 
            Learn best practices for teaching, content creation, and student engagement.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <Video className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{displayVideos.length}</p>
              <p className="text-gray-600">Training Videos</p>
            </div>
            <div>
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {displayVideos.reduce((acc, v) => acc + (v.duration_minutes || 0), 0)} min
              </p>
              <p className="text-gray-600">Total Content</p>
            </div>
            <div>
              <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              <p className="text-gray-600">Categories</p>
            </div>
            <div>
              <Award className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">Certificate</p>
              <p className="text-gray-600">Upon Completion</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Video Grid by Category */}
        {categories.map((category) => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{category}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayVideos
                .filter(v => v.category === category)
                .map((video) => (
                  <div 
                    key={video.id} 
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition group"
                  >
                    <div className="relative bg-slate-700 h-40 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/50 text-white text-sm px-2 py-1 rounded">
                        {video.duration_minutes} min
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 mb-2">{video.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{video.description}</p>
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center">
                        <Play className="w-4 h-4 mr-2" />
                        Watch Video
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* Completion CTA */}
        <div className="bg-slate-700 rounded-xl p-8 text-white text-center">
          <Award className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-2">Complete All Training</h2>
          <p className="text-green-100 mb-6 max-w-xl mx-auto">
            Watch all training videos and pass the assessment to earn your Elevate Certified Instructor badge.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <p className="text-sm opacity-80">Progress</p>
              <p className="text-xl font-bold">0 / {displayVideos.length}</p>
            </div>
            <button className="bg-white text-green-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition">
              Start Training
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Need Help?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start">
              <Users className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Live Support</h3>
                <p className="text-sm text-gray-600">Chat with our instructor support team</p>
              </div>
            </div>
            <div className="flex items-start">
              <BookOpen className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Documentation</h3>
                <p className="text-sm text-gray-600">Browse our detailed help articles</p>
              </div>
            </div>
            <div className="flex items-start">
              <Video className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Office Hours</h3>
                <p className="text-sm text-gray-600">Join weekly Q&A sessions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
