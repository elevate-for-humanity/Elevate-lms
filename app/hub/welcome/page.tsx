import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hub | Elevate for Humanity',
  description: 'Your operational command center - track progress, view automation, and manage your learning journey.',
};

export const dynamic = 'force-dynamic';

export default async function HubWelcomePage() {
  try {
    const supabase = await createClient();
    
    // If user is logged in, redirect to the main hub
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        redirect('/hub');
      }
    }
  } catch {
    // Continue rendering the welcome page if auth check fails
  }

  // Hub sub-pages with images
  const hubPages = [
    {
      title: 'Classroom',
      description: 'Access your courses, track progress, and continue your learning journey.',
      image: '/images/hub/dashboard.jpg',
      href: '/hub/classroom',
    },
    {
      title: 'Leaderboard',
      description: 'See how you rank among peers and earn recognition for your achievements.',
      image: '/images/community/community-hero.jpg',
      href: '/hub/leaderboard',
    },
    {
      title: 'Members',
      description: 'Connect with fellow learners, mentors, and industry professionals.',
      image: '/images/hub/cta.jpg',
      href: '/hub/members',
    },
    {
      title: 'Calendar',
      description: 'View upcoming events, workshops, and live sessions.',
      image: '/images/community/community-hero.jpg',
      href: '/hub/calendar',
    },
  ];

  // Features with images
  const features = [
    {
      title: 'Real-Time Progress Tracking',
      description: 'See exactly where you are in your program. No guessing - the system shows your status, completion percentage, and what comes next.',
      image: '/images/hub/analytics.jpg',
    },
    {
      title: 'Automated Guidance',
      description: 'The platform tells you what to do next. Receive smart nudges, reminders, and step-by-step guidance to stay on track.',
      image: '/images/heroes-hq/team-hero.jpg',
    },
    {
      title: 'Compliance Documentation',
      description: 'All your hours, credentials, and progress are documented automatically. Ready for audits, certifications, and employer verification.',
      image: '/images/heroes-hq/success-hero.jpg',
    },
  ];

  // Success stories
  const successStories = [
    {
      name: 'Healthcare Graduate',
      program: 'CNA Certification',
      quote: 'The Hub made it easy to track my clinical hours and know exactly what I needed to complete.',
      image: '/images/hub/student.jpg',
    },
    {
      name: 'Trades Apprentice',
      program: 'HVAC Technician',
      quote: 'I could see my progress every day. The system kept me accountable and on schedule.',
      image: '/images/hub/instructor.jpg',
    },
    {
      name: 'Tech Graduate',
      program: 'IT Support',
      quote: 'Having everything in one place - courses, certifications, job prep - made all the difference.',
      image: '/images/heroes/about-mission.jpg',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/heroes-hq/team-hero.jpg" alt="Students collaborating and learning together" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Everything You Need In One Place</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto mb-6">
              Track your enrollment, monitor progress, connect with peers, and see exactly what the system is doing to help you succeed. The Hub is your personalized dashboard for career success.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/login?redirect=/hub" className="inline-flex items-center gap-2 px-8 py-4 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-brand-green-700 transition-colors text-lg">
                Sign In to Your Hub
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/apply" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors border border-slate-500 text-lg">
                Apply for a Program
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How the Hub Works - Moved after hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">How the Hub Works</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Unlike traditional learning platforms, the Hub shows you the system working for you.
            </p>
          </div>

          <div className="space-y-16">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                  <p className="text-lg text-slate-600 mb-6 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-slate-700">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span>Real-time updates</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-700">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span>Automated tracking</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-700">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span>No manual entry required</span>
                    </li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hub Sub-Pages Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Explore the Hub</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Your central destination for learning, connecting, and tracking your progress.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {hubPages.map((page) => (
              <Link
                key={page.title}
                href={page.href}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={page.image}
                    alt={page.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white">{page.title}</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-600 text-sm">{page.description}</p>
                  <div className="mt-4 flex items-center text-brand-green-600 font-medium text-sm group-hover:text-brand-green-700">
                    Explore
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Success Stories</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Real students who used the Hub to complete their programs and launch their careers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {successStories.map((story) => (
              <div key={story.name} className="bg-slate-800 rounded-2xl overflow-hidden">
                <div className="relative h-56">
                  <Image
                    src={story.image}
                    alt={story.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <p className="text-slate-300 mb-4 italic">"{story.quote}"</p>
                  <div>
                    <p className="font-semibold text-white">{story.name}</p>
                    <p className="text-sm text-brand-green-400">{story.program}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Get Started */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Get Started in 3 Steps</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-brand-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">1</div>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 h-full">
                <div className="relative h-40 rounded-xl overflow-hidden mb-6">
                  <Image
                    src="/images/heroes-hq/success-hero.jpg"
                    alt="Apply for a program"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Apply for a Program</h3>
                <p className="text-slate-600">Choose from healthcare, skilled trades, technology, or business programs. Many are fully funded.</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-brand-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">2</div>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 h-full">
                <div className="relative h-40 rounded-xl overflow-hidden mb-6">
                  <Image
                    src="/images/heroes-hq/success-hero.jpg"
                    alt="Get enrolled"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Get Enrolled</h3>
                <p className="text-slate-600">Once approved, you'll receive access to your personalized Hub with your courses and schedule.</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-brand-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">3</div>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 h-full">
                <div className="relative h-40 rounded-xl overflow-hidden mb-6">
                  <Image
                    src="/images/getting-started-hero.jpg"
                    alt="Complete and succeed"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Complete & Succeed</h3>
                <p className="text-slate-600">Follow the system's guidance, track your progress, and graduate ready for your new career.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-brand-green-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Questions? Contact Us</h2>
          <p className="text-xl text-brand-green-100 mb-8 max-w-2xl mx-auto">
            Use the Hub to track your progress and achieve your career goals.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/login?redirect=/hub"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-green-700 font-semibold rounded-lg hover:bg-brand-green-50 transition-colors text-lg"
            >
              Sign In
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-green-700 text-white font-semibold rounded-lg hover:bg-brand-green-800 transition-colors text-lg border border-brand-green-600"
            >
              Browse Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
