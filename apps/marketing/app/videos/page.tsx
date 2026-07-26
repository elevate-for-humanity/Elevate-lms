import { Metadata } from 'next';
import Link from 'next/link';
import { Play, Clock, Users, ChevronRight, Video } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Video Library',
  description: 'Watch video tutorials, student testimonials, and career insights from Elevate for Humanity.',
};

const VIDEO_CATEGORIES = [
  { id: 'all', label: 'All Videos' },
  { id: 'tutorials', label: 'How-To Tutorials' },
  { id: 'testimonials', label: 'Student Stories' },
  { id: 'careers', label: 'Career Insights' },
];

const VIDEOS = [
  {
    id: 1,
    title: 'How to Apply in 5 Minutes',
    category: 'tutorials',
    duration: '5:32',
    thumbnail: '/images/pages/video-apply.webp',
    description: 'Watch how easy it is to complete your application with PARiS AI guidance.',
    views: '2.4K',
  },
  {
    id: 2,
    title: 'Maria\'s Journey: From Unemployed to Medical Assistant',
    category: 'testimonials',
    duration: '8:15',
    thumbnail: '/images/pages/video-maria.webp',
    description: 'Hear how Maria used WIOA funding to become a certified Medical Assistant.',
    views: '5.1K',
  },
  {
    id: 3,
    title: 'Understanding WIOA Funding',
    category: 'tutorials',
    duration: '12:45',
    thumbnail: '/images/pages/video-funding.webp',
    description: 'Learn how Workforce Innovation and Opportunity Act funding can cover your training.',
    views: '3.8K',
  },
  {
    id: 4,
    title: 'A Day in the Life: HVAC Technician',
    category: 'careers',
    duration: '6:20',
    thumbnail: '/images/pages/video-hvac.webp',
    description: 'Follow an HVAC technician through a typical workday.',
    views: '1.9K',
  },
  {
    id: 5,
    title: 'Employer Spotlight: WorkOne Northwest',
    category: 'careers',
    duration: '9:30',
    thumbnail: '/images/pages/video-workone.webp',
    description: 'How WorkOne Northwest partners with Elevate to serve Indiana workers.',
    views: '1.2K',
  },
  {
    id: 6,
    title: 'Apprenticeship vs College: Which is Right for You?',
    category: 'careers',
    duration: '14:00',
    thumbnail: '/images/pages/video-apprentice.webp',
    description: 'Compare earn-while-you-learn apprenticeships with traditional degree paths.',
    views: '4.3K',
  },
];

export default function VideosPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Video Library</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Watch tutorials, hear student success stories, and learn about career pathways in healthcare, trades, and technology.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4">
            {VIDEO_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className="px-4 py-2 bg-slate-100 hover:bg-brand-blue-100 text-slate-700 hover:text-brand-blue-700 rounded-full text-sm font-medium transition-colors"
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Video Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {VIDEOS.map((video) => (
              <article key={video.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-slate-200">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="w-16 h-16 text-slate-300" />
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/80 text-white text-sm px-2 py-1 rounded">
                    {video.duration}
                  </div>
                  <button className="absolute inset-0 flex items-center justify-center group">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-brand-blue-600 ml-1" />
                    </div>
                  </button>
                </div>
                <div className="p-6">
                  <span className="text-xs text-brand-blue-600 font-medium uppercase tracking-wide">
                    {video.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-2 mb-2">{video.title}</h3>
                  <p className="text-slate-600 text-sm mb-4">{video.description}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users className="w-4 h-4" />
                    <span>{video.views} views</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe CTA */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Never Miss New Content</h2>
          <p className="text-slate-300 mb-8">
            Subscribe to our YouTube channel for weekly career tips, student stories, and industry insights.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-red-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-red-700 transition-colors">
            <Play className="w-5 h-5" />
            Subscribe on YouTube
          </Link>
        </div>
      </section>

      {/* Request Topic */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Have a Topic Request?</h2>
          <p className="text-slate-600 mb-8">
            Let us know what career topics or tutorials you'd like to see next.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-brand-blue-700 transition-colors">
            Suggest a Video Topic
          </Link>
        </div>
      </section>
    </div>
  );
}
