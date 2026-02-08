import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, MessageSquare, Calendar, Award, ArrowRight, 
  BookOpen, Trophy, Video, Sparkles, Heart, Star,
  TrendingUp, Clock, Circle, Phone
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Community | Elevate For Humanity',
  description: 'Join our thriving community of learners, mentors, and professionals. Connect, learn, and grow together.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/community',
  },
  openGraph: {
    title: 'Community | Elevate For Humanity',
    description: 'Join our thriving community of learners, mentors, and professionals.',
    images: ['/images/community/hero.jpg'],
  },
};

export const dynamic = 'force-dynamic';

export default async function CommunityPage() {
  const supabase = await createClient();

  let memberCount = 2500;
  const activeDiscussions = 150;
  let upcomingEvents: any[] = [];

  if (supabase) {
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (count) memberCount = count;

      const { data: eventData } = await supabase
        .from('events')
        .select('id, title, start_date, description, image_url')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(3);
      if (eventData) upcomingEvents = eventData;
    } catch (error) {
      console.error('[Community] Error:', error);
    }
  }

  const communityFeatures = [
    {
      icon: MessageSquare,
      title: 'Discussion Forums',
      description: 'Engage in meaningful conversations with peers and mentors',
      href: '/community/discussions',
      color: 'bg-blue-500',
    },
    {
      icon: BookOpen,
      title: 'Classroom',
      description: 'Access exclusive courses and learning resources',
      href: '/community/classroom',
      color: 'bg-green-500',
    },
    {
      icon: Calendar,
      title: 'Events & Workshops',
      description: 'Join live sessions, webinars, and networking events',
      href: '/community/events',
      color: 'bg-brand-red-500',
    },
    {
      icon: Users,
      title: 'Member Directory',
      description: 'Connect with fellow learners and industry professionals',
      href: '/community/members',
      color: 'bg-orange-500',
    },
    {
      icon: Trophy,
      title: 'Leaderboard',
      description: 'Track your progress and compete with peers',
      href: '/community/leaderboard',
      color: 'bg-yellow-500',
    },
    {
      icon: Video,
      title: 'Live Sessions',
      description: 'Attend live Q&A sessions with instructors',
      href: '/community/live',
      color: 'bg-red-500',
    },
  ];

  const discussionCategories = [
    { name: 'General Discussion', posts: 234, href: '/community/discussions/general', icon: '💬' },
    { name: 'Career Advice', posts: 189, href: '/community/discussions/career', icon: '💼' },
    { name: 'Study Groups', posts: 156, href: '/community/discussions/study-groups', icon: '📚' },
    { name: 'Success Stories', posts: 98, href: '/community/discussions/success-stories', icon: '🎉' },
    { name: 'Job Opportunities', posts: 67, href: '/community/discussions/jobs', icon: '🔍' },
    { name: 'Introductions', posts: 312, href: '/community/discussions/introductions', icon: '👋' },
  ];

  const benefits = [
    'Access to exclusive learning resources',
    'Network with industry professionals',
    'Get career advice from mentors',
    'Join study groups and accountability partners',
    'Attend live workshops and Q&A sessions',
    'Earn badges and recognition',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Community' }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-brand-red-800 text-white overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/community/community-hero.jpg"
            alt="Community members collaborating"
            fill
            className="object-cover opacity-20"
            priority
          />
        </div>
        
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-violet-200 font-medium">Join {memberCount.toLocaleString()}+ Members</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Learn Together,<br />
              <span className="text-violet-300">Grow Together</span>
            </h1>
            
            <p className="text-xl text-violet-100 mb-8 max-w-2xl">
              Connect with a thriving community of learners, mentors, and professionals. 
              Share knowledge, get support, and accelerate your career journey.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link
                href="/community/join"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-violet-900 font-semibold rounded-full hover:bg-violet-50 transition-colors"
              >
                Join the Community
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/community/discussions"
                className="inline-flex items-center gap-2 px-8 py-4 bg-violet-700/50 text-white font-semibold rounded-full hover:bg-violet-700 transition-colors border border-violet-500"
              >
                Browse Discussions
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="text-3xl font-bold">{memberCount.toLocaleString()}+</p>
                <p className="text-violet-200">Active Members</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{activeDiscussions}+</p>
                <p className="text-violet-200">Discussions</p>
              </div>
              <div>
                <p className="text-3xl font-bold">50+</p>
                <p className="text-violet-200">Monthly Events</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our community platform gives you all the tools to learn, connect, and grow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {communityFeatures.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-violet-200 transition-all"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <span className="inline-flex items-center gap-2 text-violet-600 font-medium group-hover:gap-3 transition-all">
                  Explore <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Discussion Categories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Popular Discussions</h2>
              <p className="text-gray-600">Join conversations that matter to you</p>
            </div>
            <Link
              href="/community/discussions"
              className="hidden sm:inline-flex items-center gap-2 text-violet-600 font-medium hover:text-violet-700"
            >
              View All Categories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {discussionCategories.map((category, index) => (
              <Link
                key={index}
                href={category.href}
                className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all"
              >
                <span className="text-3xl">{category.icon}</span>
                <div className="flex-1">
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Upcoming Events</h2>
              <p className="text-gray-600">Join live sessions and workshops</p>
            </div>
            <Link
              href="/community/events"
              className="hidden sm:inline-flex items-center gap-2 text-violet-600 font-medium hover:text-violet-700"
            >
              View Calendar <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="relative h-48">
                <Image
                  src="/images/community/community-hero.jpg"
                  alt="Career Workshop"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-violet-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  Weekly Event
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Career Development Workshop</h3>
                <p className="text-gray-600 text-sm">Learn strategies for advancing your career in your chosen field.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="relative h-48">
                <Image
                  src="/images/heroes-hq/success-hero.jpg"
                  alt="Networking Event"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-violet-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  Monthly Event
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Monthly Networking Mixer</h3>
                <p className="text-gray-600 text-sm">Connect with fellow members and industry professionals.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="relative h-48">
                <Image
                  src="/images/heroes-hq/team-hero.jpg"
                  alt="Q&A Session"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-violet-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  Bi-Weekly
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Live Q&A with Industry Experts</h3>
                <p className="text-gray-600 text-sm">Get your questions answered by professionals in your field.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Why Join Our Community?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our community is more than just a forum—it is a support system designed to help you succeed.
              </p>
              
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Circle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/community/join"
                className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-violet-600 text-white font-semibold rounded-full hover:bg-violet-700 transition-colors"
              >
                Join Now - It is Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="relative">
              <Image
                src="/images/heroes-hq/employer-hero.jpg"
                alt="Community members learning together"
                width={600}
                height={500}
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">98% Satisfaction</p>
                    <p className="text-sm text-gray-500">From our members</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-violet-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Sparkles className="w-12 h-12 text-violet-200 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Join Our Community?
          </h2>
          <p className="text-xl text-violet-100 mb-8 max-w-2xl mx-auto">
            Connect with thousands of learners and professionals who are on the same journey as you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/community/join"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-violet-600 font-semibold rounded-full hover:bg-violet-50 transition-colors"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/community/about"
              className="inline-flex items-center gap-2 px-8 py-4 bg-violet-500 text-white font-semibold rounded-full hover:bg-violet-400 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="bg-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-blue-100 mb-6">Apply today for free career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-white text-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
