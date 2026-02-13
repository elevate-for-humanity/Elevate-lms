import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Clock, Users, Star, ArrowRight, CheckCircle, Play, 
  GraduationCap, Briefcase, Award, BookOpen, Sparkles 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CourseCatalog } from '@/components/CourseCatalog';
import { CourseCompletionTracking } from '@/components/CourseCompletionTracking';
import { CoursePrerequisiteManagement } from '@/components/CoursePrerequisiteManagement';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Career Training Courses | Elevate for Humanity',
  description: 'Explore career-focused training programs in healthcare, skilled trades, technology, and more. WIOA-funded, job-ready certifications.',
  keywords: ['courses', 'training programs', 'career education', 'HVAC training', 'medical assistant', 'CDL training', 'barber school', 'WIOA'],
  alternates: { canonical: `${SITE_URL}/courses` },
};

const categories = ['All', 'Healthcare', 'Trades', 'Beauty', 'Transportation', 'Technology'];

export default async function CoursesPage() {
  const supabase = await createClient();
  let featuredCourses: any[] = [];

  if (supabase) {
    try {
      const { data } = await supabase
        .from('programs')
        .select('id, title, slug, category, image_url, description, duration, price')
        .eq('is_active', true)
        .eq('featured', true)
        .order('title', { ascending: true })
        .limit(6);

      if (data && data.length > 0) {
        featuredCourses = data;
      }
    } catch (error) {
      console.error('[Courses] Error:', error);
    }
  }

  return (
    <div className="bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Courses' }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/heroes/hero-homepage.jpg"
            alt="Career Training Courses"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-full mb-6">
              <Sparkles className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold text-sm">100% WIOA Funded Training</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              Launch Your New Career
              <span className="block text-green-400">In Weeks, Not Years</span>
            </h1>

            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Industry-recognized certifications in healthcare, skilled trades, technology, and more. 
              Free for eligible Indiana residents through WIOA funding.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link
                href="/apply"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg"
              >
                Apply Now - It&apos;s Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#categories"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all border border-white/20"
              >
                <Play className="w-5 h-5" />
                Browse Programs
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-black text-white">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: GraduationCap, title: 'Industry Certifications', desc: 'Earn credentials employers recognize' },
              { icon: Briefcase, title: 'Job Placement', desc: 'Career services and employer connections' },
              { icon: Award, title: 'WIOA Approved', desc: 'Free training for eligible residents' },
              { icon: BookOpen, title: 'Flexible Learning', desc: 'Online, in-person, and hybrid options' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
              Explore Training Programs
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Choose from high-demand career fields with excellent job prospects
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/programs/${category.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-slate-100"
              >
                <div className="relative h-48">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-1">{category.name}</h3>
                    <p className="text-sm text-white/80">{category.courses} programs available</p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 mb-4">{category.description}</p>
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    View Programs <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <section className="py-20 bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                Featured Programs
              </h2>
              <p className="text-xl text-slate-400">Our most popular training programs</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/programs/${course.slug}`}
                  className="bg-slate-800 rounded-2xl overflow-hidden hover:bg-slate-700 transition-all group"
                >
                  <div className="relative h-40">
                    <Image
                      src={course.image_url || '/images/heroes/hero-homepage.jpg'}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-bold text-green-400 uppercase tracking-wide">
                      {course.category}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-2 mb-2 group-hover:text-green-400 transition-colors">
                      {course.title}
                    </h3>
                    {course.duration && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Clock className="w-4 h-4" />
                        {course.duration}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-700 transition-all"
              >
                View All Programs <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Micro Classes Section */}
      <section id="micro-classes" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-bold mb-4">
              <Clock className="w-4 h-4" />
              Quick Certifications
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
              Micro Classes
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Short, focused courses to boost your skills and earn certifications quickly
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {microClasses.map((course) => (
              <div
                key={course.id}
                className="bg-slate-50 rounded-xl p-6 hover:shadow-lg transition-all border border-slate-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    {course.category}
                  </span>
                  <span className="text-green-600 font-bold">{course.price}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{course.title}</h3>
                <p className="text-slate-600 text-sm mb-4">{course.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Clock className="w-4 h-4" />
                    {course.duration}
                  </div>
                  <Link
                    href="/apply"
                    className="text-blue-600 font-semibold text-sm hover:text-blue-700"
                  >
                    Enroll Now →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all"
            >
              Apply for Free Training <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* COURSE CATALOG */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CourseCatalog />
        </div>
      </section>

      {/* COURSE COMPLETION TRACKING */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CourseCompletionTracking />
        </div>
      </section>

      {/* PREREQUISITES */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CoursePrerequisiteManagement />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
            Ready to Start Your New Career?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Apply today and find out if you qualify for free WIOA-funded training.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 bg-white text-green-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-50 transition-all"
            >
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/wioa-eligibility"
              className="inline-flex items-center gap-2 bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-800 transition-all"
            >
              Register at Indiana Career Connect
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
