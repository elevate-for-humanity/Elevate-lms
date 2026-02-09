import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, Users, TrendingUp, ArrowRight, Clock, Search, Plus } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Community Forums | Elevate for Humanity',
  description: 'Connect with fellow students, alumni, and instructors. Ask questions, share experiences, and support each other.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/forums',
  },
};

interface ForumCategory {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
}

const defaultCategories: ForumCategory[] = [
  { id: '1', name: 'General Discussion', description: 'General topics and community chat', order_index: 1 },
  { id: '2', name: 'Career Advice', description: 'Get advice on your career path', order_index: 2 },
  { id: '3', name: 'Study Groups', description: 'Find study partners and groups', order_index: 3 },
  { id: '4', name: 'Job Opportunities', description: 'Share and find job openings', order_index: 4 },
  { id: '5', name: 'Success Stories', description: 'Share your achievements', order_index: 5 },
];

export default function ForumsPage() {
  const categories = defaultCategories;

  const categoryIcons: Record<string, string> = {
    'General Discussion': '💬',
    'Healthcare Programs': '🏥',
    'Skilled Trades': '🔧',
    'Technology': '💻',
    'Job Search & Career': '💼',
    'Student Support': '🎓',
  };

  const categoryColors: Record<string, { bg: string; border: string; hover: string }> = {
    'General Discussion': { bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:border-blue-400' },
    'Healthcare Programs': { bg: 'bg-green-50', border: 'border-green-200', hover: 'hover:border-green-400' },
    'Skilled Trades': { bg: 'bg-orange-50', border: 'border-orange-200', hover: 'hover:border-orange-400' },
    'Technology': { bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:border-blue-400' },
    'Job Search & Career': { bg: 'bg-indigo-50', border: 'border-indigo-200', hover: 'hover:border-indigo-400' },
    'Student Support': { bg: 'bg-rose-50', border: 'border-rose-200', hover: 'hover:border-rose-400' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={[
          { label: 'Forums' },
        ]}
      />
      {/* Hero */}
      <section className="relative min-h-[450px] flex items-center overflow-hidden">
        <Image
          src="/images/success-new/success-8.jpg"
          alt="Community Forums"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 w-full">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-full mb-6">
              <MessageSquare className="w-4 h-4" />
              Community
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Community Forums</h1>
            <p className="text-xl text-indigo-100 mb-8">
              Connect with fellow students, alumni, and instructors. Ask questions, share experiences, and support each other on your career journey.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/login?redirect=/forums"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-gray-100 transition"
              >
                <Plus className="w-5 h-5" />
                Start a Discussion
              </Link>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search discussions..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-6 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{categories.length}</div>
              <div className="text-gray-600 text-sm">Categories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">500+</div>
              <div className="text-gray-600 text-sm">Members</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">Active</div>
              <div className="text-gray-600 text-sm">Community</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">24/7</div>
              <div className="text-gray-600 text-sm">Access</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Forum Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Discussion Categories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const icon = categoryIcons[category.name] || '💬';
              const colors = categoryColors[category.name] || { bg: 'bg-gray-50', border: 'border-gray-200', hover: 'hover:border-gray-400' };
              
              return (
                <Link
                  key={category.id}
                  href={`/forums/${category.id}`}
                  className={`${colors.bg} ${colors.border} ${colors.hover} border-2 rounded-xl p-6 transition-all hover:shadow-lg group`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition flex items-center gap-2">
                        {category.name}
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {category.description || 'Join the discussion'}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Community Guidelines */}
        <section className="bg-white rounded-2xl shadow-sm border p-8 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Community Guidelines</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Be Respectful</h3>
              <p className="text-gray-600 text-sm">
                Treat all members with respect. No harassment, discrimination, or personal attacks.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Stay On Topic</h3>
              <p className="text-gray-600 text-sm">
                Post in the appropriate category and keep discussions relevant to the topic.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Help Each Other</h3>
              <p className="text-gray-600 text-sm">
                Share your knowledge and experiences to help fellow students succeed.
              </p>
            </div>
          </div>
          <Link href="/policies/community-guidelines" className="inline-flex items-center gap-2 mt-6 text-indigo-600 font-medium hover:text-indigo-700">
            View Full Community Guidelines <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* CTA */}
        <section className="bg-indigo-600 rounded-2xl p-8 text-white text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-indigo-200" />
          <h2 className="text-2xl font-bold mb-4">Join the Conversation</h2>
          <p className="text-indigo-100 mb-6 max-w-lg mx-auto">
            Sign in to participate in discussions, ask questions, and connect with the Elevate community.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/login?redirect=/forums"
              className="px-6 py-3 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              Sign In
            </Link>
            <Link
              href="/apply"
              className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-400 transition"
            >
              Become a Student
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
