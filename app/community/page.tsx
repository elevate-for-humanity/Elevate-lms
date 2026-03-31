import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, MessageSquare, Calendar, Award, ArrowRight, 
  BookOpen, Trophy, Video, Heart,
  GraduationCap, HelpCircle, Circle
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { logger } from '@/lib/logger';

export const metadata: Metadata = {
  title: 'Community | Elevate For Humanity',
  description: 'Join our thriving community of learners, mentors, and professionals. Connect, learn, and grow together.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/community',
  },
};

export const dynamic = 'force-dynamic';

export default async function CommunityPage() {
  const supabase = await createClient();

  let memberCount = 2500;
  const activeDiscussions = 150;

  if (supabase) {
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (count) memberCount = count;
    } catch (error) {
      logger.error('[Community] Error:', error);
    }
  }

  const communityFeatures = [
    {
      icon: MessageSquare,
      title: 'Discussion Forums',
      description: 'Engage in conversations with peers and mentors about career topics, study tips, and industry insights.',
      href: '/community/discussions',
    },
    {
      icon: BookOpen,
      title: 'Learning Resources',
      description: 'Access exclusive courses, study guides, and materials shared by instructors and fellow students.',
      href: '/community/classroom',
    },
    {
      icon: Calendar,
      title: 'Events & Workshops',
      description: 'Join live sessions, webinars, career fairs, and networking events throughout the year.',
      href: '/community/events',
    },
    {
      icon: Users,
      title: 'Member Directory',
      description: 'Connect with fellow learners, alumni, and industry professionals in your field.',
      href: '/community/members',
    },
    {
      icon: Trophy,
      title: 'Achievements',
      description: 'Earn badges, track your progress, and celebrate milestones with the community.',
      href: '/community/leaderboard',
    },
    {
      icon: Video,
      title: 'Live Q&A Sessions',
      description: 'Attend live sessions with instructors and industry experts to get your questions answered.',
      href: '/community/live',
    },
  ];

  const discussionCategories = [
    { name: 'General Discussion', posts: 234, href: '/community/discussions/general' },
    { name: 'Career Advice', posts: 189, href: '/community/discussions/career' },
    { name: 'Study Groups', posts: 156, href: '/community/discussions/study-groups' },
    { name: 'Success Stories', posts: 98, href: '/community/discussions/success-stories' },
    { name: 'Job Opportunities', posts: 67, href: '/community/discussions/jobs' },
    { name: 'Introductions', posts: 312, href: '/community/discussions/introductions' },
  ];

  return (
    <div className="min-h-screen bg-white">      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Community' }]} />
        </div>
      </div>

      {/* Clean Hero - Image Only */}
      <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] overflow-hidden">
        <Image
          src="/images/pages/community-page-5.jpg"
          alt="Community members collaborating"
          fill
          className="object-cover"
          priority
         sizes="(max-width: 768px) 48px, 64px" />
      </section>

      {/* Title + Info Section */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-100 text-brand-blue-700 text-sm font-semibold rounded-full mb-6">
            <Users className="w-4 h-4" />
            {memberCount.toLocaleString()}+ Members
          </span>
          
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Community Hub
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
            Connect with a supportive community of learners, mentors, and professionals. Share knowledge, get career advice, find study partners, and grow together.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/community/join"
              className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-700 transition-colors"
            >
              <Users className="w-5 h-5" />
              Join the Community
            </Link>
            <Link
              href="/community/discussions"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              Browse Discussions
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-6">
            {[
              { value: `${memberCount.toLocaleString()}+`, label: "Active Members" },
              { value: `${activeDiscussions}+`, label: "Discussions" },
              { value: "50+", label: "Monthly Events" }
            ].map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is the Community Hub */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">What is the Community Hub?</h2>
          <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            The Community Hub is your space to connect with fellow students, alumni, instructors, and industry professionals. Whether you&apos;re looking for study partners, career advice, job leads, or just want to share your success story, this is the place.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communityFeatures.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className="bg-white rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <feature.icon className="w-10 h-10 text-brand-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <span className="inline-flex items-center gap-2 text-brand-blue-600 font-medium">
                  Explore <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Discussion Categories */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Popular Discussions</h2>
            <Link
              href="/community/discussions"
              className="text-brand-blue-600 font-medium hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {discussionCategories.map((category, index) => (
              <Link
                key={index}
                href={category.href}
                className="flex items-center justify-between p-4 bg-white rounded-xl hover:shadow-md transition-shadow"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.posts} posts</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
            <Link
              href="/community/events"
              className="text-brand-blue-600 font-medium hover:underline flex items-center gap-1"
            >
              View Calendar <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Career Development Workshop", frequency: "Weekly", image: "/images/pages/comp-home-pathways-support.jpg" },
              { title: "Monthly Networking Mixer", frequency: "Monthly", image: "/images/pages/comp-home-pathways-support.jpg" },
              { title: "Live Q&A with Experts", frequency: "Bi-Weekly", image: "/images/pages/comp-home-pathways-support.jpg" }
            ].map((event, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden">
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover"
                   sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm text-brand-blue-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    {event.frequency}
                  </div>
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Join the Community?</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                'Connect with peers in your program',
                'Get career advice from mentors',
                'Find study partners and accountability buddies',
                'Access exclusive learning resources',
                'Attend live workshops and Q&A sessions',
                'Celebrate wins and share success stories'
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="relative h-64 md:h-auto rounded-xl overflow-hidden">
              <Image
                src="/images/pages/community-page-10.jpg"
                alt="Community members"
                fill
                className="object-cover"
               sizes="(max-width: 768px) 48px, 64px" />
            </div>
          </div>
        </div>
      </section>

      {/* Join Form */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Get Started</h2>
          <p className="text-center text-gray-600 mb-12">Join the community or ask us a question</p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Join Form */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Join Community</h3>
              </div>
              <form className="space-y-4" action="/api/community/join" method="POST">
                <input type="text" name="name" placeholder="Full Name *" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
                <input type="email" name="email" placeholder="Email *" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
                <select name="status" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500">
                  <option value="">Your Status?</option>
                  <option value="current-student">Current Student</option>
                  <option value="alumni">Alumni</option>
                  <option value="prospective">Prospective Student</option>
                  <option value="professional">Industry Professional</option>
                </select>
                <button type="submit" className="w-full bg-brand-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition-colors">
                  Join Now - Free
                </button>
              </form>
            </div>

            {/* Inquiry Form */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Have Questions?</h3>
              </div>
              <form className="space-y-4" action="/api/community/inquiry" method="POST">
                <input type="text" name="name" placeholder="Your Name *" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500" />
                <input type="email" name="email" placeholder="Email *" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500" />
                <textarea name="message" placeholder="Your question..." rows={3} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"></textarea>
                <button type="submit" className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Connect?</h2>
          <p className="text-brand-blue-100 mb-8 max-w-2xl mx-auto">
            Connect with learners and professionals who support each other on their career journeys.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/community/join"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-blue-600 font-semibold rounded-lg hover:bg-brand-blue-50 transition-colors"
            >
              Join Free <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/start"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-blue-700 text-white font-semibold rounded-lg hover:bg-brand-blue-800 transition-colors"
            >
              Start Training
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
