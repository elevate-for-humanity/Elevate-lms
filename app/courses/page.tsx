import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Clock, Users, Star, ArrowRight, Play, 
  GraduationCap, Briefcase, Award, BookOpen, Sparkles 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

const featuredCategories = [
  { slug: 'healthcare', name: 'Healthcare', image: '/images/pages/cna-patient-care.jpg', courses: 5, description: 'CNA, Medical Assistant, Phlebotomy, CPR & First Aid, and Pharmacy Technician training.' },
  { slug: 'skilled-trades', name: 'Skilled Trades', image: '/images/pages/welding-sparks.jpg', courses: 6, description: 'HVAC, Electrical, Welding, Plumbing, and Construction certifications.' },
  { slug: 'technology', name: 'Technology', image: '/images/pages/it-helpdesk-desk.jpg', courses: 4, description: 'Cybersecurity, IT Help Desk, Software Development, and Networking.' },
  { slug: 'cdl', name: 'CDL & Transportation', image: '/images/pages/cdl-truck-highway.jpg', courses: 3, description: 'Class A and Class B CDL training with job placement assistance.' },
  { slug: 'barber-apprenticeship', name: 'Beauty & Barbering', image: '/images/pages/barber-fade.jpg', courses: 3, description: 'Barber apprenticeships, cosmetology, and nail technician programs.' },
  { slug: 'business', name: 'Business & Finance', image: '/images/pages/bookkeeping-ledger.jpg', courses: 4, description: 'Bookkeeping, Office Administration, Tax Preparation, and Entrepreneurship.' },
];

const microClasses = [
  { id: 'cpr', category: 'Healthcare', title: 'CPR & First Aid (HSI)', description: 'Get CPR and First Aid certified in one day. Required for healthcare, education, and many licensed professions.', duration: '1 day', price: 'Free*' },
  { id: 'osha10', category: 'Safety', title: 'OSHA 10-Hour', description: 'Workplace safety certification covering hazard recognition, fall protection, and PPE requirements.', duration: '2 days', price: 'Free*' },
  { id: 'forklift', category: 'Trades', title: 'Forklift Certification', description: 'OSHA-compliant forklift operator training and certification for warehouse and logistics roles.', duration: '1 day', price: 'Free*' },
  { id: 'riseup', category: 'Professional', title: 'Rise Up Certification', description: 'NRF Rise Up retail industry fundamentals credential for customer service and sales roles.', duration: '2 weeks', price: 'Free*' },
  { id: 'epa608', category: 'Trades', title: 'EPA 608 Certification', description: 'EPA Section 608 refrigerant handling certification required for HVAC technicians.', duration: '1 day', price: 'Free*' },
  { id: 'servsafe', category: 'Hospitality', title: 'ServSafe Food Handler', description: 'Food safety certification for restaurant, catering, and food service professionals.', duration: '1 day', price: 'Free*' },
];

export default async function CoursesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  let featuredCourses: any[] = [];

  if (supabase) {
    try {
      const { data } = await db
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
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Courses' }]} />
        </div>
      </div>

      {/* Hero Section */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/pages/courses-page-9.jpg" alt="Career Training Courses" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Launch Your New Career <span className="block text-brand-green-400">In Weeks, Not Years</span></h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">Industry-recognized certifications in healthcare, skilled trades, technology, and more. Free for eligible Indiana residents through WIOA funding.</p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: GraduationCap, title: 'Industry Certifications', desc: 'Earn credentials employers recognize' },
              { icon: Briefcase, title: 'Job Placement', desc: 'Career services and employer connections' },
              { icon: Award, title: 'WIOA Approved', desc: 'Free training for eligible residents' },
              { icon: BookOpen, title: 'Flexible Learning', desc: 'Online, in-person, and hybrid options' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-14 h-14 bg-brand-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-brand-green-600" />
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
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{category.name}</h3>
                    <p className="text-sm text-slate-600">{category.courses} programs available</p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 mb-4">{category.description}</p>
                  <div className="flex items-center gap-2 text-brand-green-600 font-semibold">
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
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
                Featured Programs
              </h2>
              <p className="text-xl text-slate-500">Our most popular training programs</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/programs/${course.slug}`}
                  className="bg-slate-800 rounded-2xl overflow-hidden hover:bg-slate-700 transition-all group"
                >
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={course.image_url || '/images/pages/workforce-training.jpg'}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-bold text-brand-green-400 uppercase tracking-wide">
                      {course.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2 mb-2 group-hover:text-brand-green-400 transition-colors">
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
                className="inline-flex items-center gap-2 bg-brand-green-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-green-700 transition-all"
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-100 text-brand-blue-800 rounded-full text-sm font-bold mb-4">
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
                className="bg-white rounded-xl p-6 hover:shadow-lg transition-all border border-slate-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="px-3 py-1 bg-brand-blue-100 text-brand-blue-700 text-xs font-bold rounded-full">
                    {course.category}
                  </span>
                  <span className="text-brand-green-600 font-bold">{course.price}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{course.title}</h3>
                <p className="text-slate-600 text-sm mb-4">{course.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Clock className="w-4 h-4" />
                    {course.duration}
                  </div>
                  <Link
                    href="/start"
                    className="text-brand-blue-600 font-semibold text-sm hover:text-brand-blue-700"
                  >
                    Enroll Now →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/start"
              className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-blue-700 transition-all"
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

      {/* Partner course catalogs */}
      <section className="py-8 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Course Catalogs by Provider</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/courses/epa-608" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-blue-300 hover:text-brand-blue-700 transition-colors">
              EPA Section 608 Prep
            </Link>
            <Link href="/courses/careersafe" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-blue-300 hover:text-brand-blue-700 transition-colors">
              CareerSafe OSHA
            </Link>
            <Link href="/courses/hsi" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-blue-300 hover:text-brand-blue-700 transition-colors">
              HSI Safety Training
            </Link>
            <Link href="/courses/nds" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-blue-300 hover:text-brand-blue-700 transition-colors">
              DOT Compliance (NDS)
            </Link>
            <Link href="/courses/nrf" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-blue-300 hover:text-brand-blue-700 transition-colors">
              NRF RISE Up
            </Link>
            <Link href="/courses/capital-readiness" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-blue-300 hover:text-brand-blue-700 transition-colors">
              Capital Readiness
            </Link>
          </div>
        </div>
      </section>

      {/* COURSE COMPLETION TRACKING */}
      <section className="py-16 bg-white">
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
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6">
            Ready to Start Your New Career?
          </h2>
          <p className="text-xl text-brand-green-100 mb-8">
            Apply today and find out if you qualify for free WIOA-funded training.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/start"
              className="inline-flex items-center gap-2 bg-white text-brand-green-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-brand-green-50 transition-all"
            >
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/wioa-eligibility"
              className="inline-flex items-center gap-2 bg-brand-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-brand-green-800 transition-all"
            >
              Register at Indiana Career Connect
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
