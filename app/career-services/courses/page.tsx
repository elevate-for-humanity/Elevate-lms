import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Metadata } from 'next';
import { 
  Award,
  ArrowRight,
  Sparkles,
  Video,
  Download,
  MessageSquare
} from 'lucide-react';
import { CareerCoursesClient } from './CareerCoursesClient';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Career Success Courses | Elevate for Humanity',
  description: 'Professional video courses for resume writing, interview preparation, and job search strategies. Self-paced learning with lifetime access.',
};

export const dynamic = 'force-dynamic';

export default async function CareerCoursesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>Unable to load courses. Please try again later.</p>
      </div>
    );
  }

  // Fetch courses from database
  const { data: courses } = await db
    .from('career_courses')
    .select(`
      *,
      features:career_course_features(feature, sort_order)
    `)
    .eq('is_active', true)
    .order('price', { ascending: true });

  // Separate bundle from individual courses
  const bundle = courses?.find((c: any) => c.is_bundle);
  const individualCourses = courses?.filter((c: any) => !c.is_bundle) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Services', href: '/career-services' }, { label: 'Courses' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-brand-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-semibold px-4 py-1 rounded-full mb-4">
              <Sparkles className="w-4 h-4" />
              Self-Paced Video Courses
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Career Success Courses
            </h1>
            <p className="text-xl text-brand-blue-100 mb-8">
              Professional video training to help you land your dream job. Flexible scheduling with instructor support and lifetime access.
            </p>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                <span>HD Video Lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span>Downloadable Resources</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                <span>Certificates Included</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Client Component for Cart Functionality */}
      <CareerCoursesClient 
        courses={individualCourses} 
        bundle={bundle} 
      />

      {/* What's Included */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What&apos;s Included in Every Course</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Video className="w-7 h-7 text-brand-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">HD Video Lessons</h3>
              <p className="text-sm text-gray-600">Professional quality videos you can watch anytime</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-brand-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-7 h-7 text-brand-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Downloadable Resources</h3>
              <p className="text-sm text-gray-600">Templates, worksheets, and checklists</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-7 h-7 text-brand-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Certificate</h3>
              <p className="text-sm text-gray-600">Earn a certificate upon completion</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-brand-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7 text-brand-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Lifetime Access</h3>
              <p className="text-sm text-gray-600">Access your courses forever, including updates</p>
            </div>
          </div>
        </div>

        {/* Free for Students Banner */}
        <div className="mt-16 bg-brand-green-50 border-2 border-brand-green-200 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-brand-green-900 mb-4">
            Enrolled in a Training Program?
          </h2>
          <p className="text-brand-green-700 mb-6 max-w-2xl mx-auto">
            All career services courses are included FREE for students enrolled in our WIOA-funded training programs. 
            Check your eligibility and get started today.
          </p>
          <Link
            href="/wioa-eligibility"
            className="inline-flex items-center bg-brand-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-green-700"
          >
            Check Eligibility
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
}
