import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { CoursePlayer } from './CoursePlayer';
import { ArrowLeft, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Learning: ${slug} | Elevate for Humanity`,
  };
}

export default async function CourseLearnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  if (!supabase) {
    redirect('/login');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/career-services/courses/${slug}/learn`);
  }

  // Get course with modules
  const { data: course } = await supabase
    .from('career_courses')
    .select(`
      *,
      modules:career_course_modules(*)
    `)
    .eq('slug', slug)
    .single();

  if (!course) {
    notFound();
  }

  // Check if user has purchased this course
  const { data: purchase } = await supabase
    .from('career_course_purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .eq('status', 'completed')
    .single();

  // If bundle, check if user purchased the bundle
  let hasBundleAccess = false;
  if (!purchase) {
    const { data: bundlePurchase } = await supabase
      .from('career_course_purchases')
      .select(`
        id,
        course:career_courses!inner(bundle_course_ids)
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed');

    hasBundleAccess = bundlePurchase?.some((bp: any) => 
      bp.course?.bundle_course_ids?.includes(course.id)
    ) || false;
  }

  const hasAccess = !!purchase || hasBundleAccess;

  // Sort modules
  const sortedModules = course.modules?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-brand-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h1>
          <p className="text-gray-600 mb-6">
            You need to purchase this course to access the content.
          </p>
          <div className="space-y-3">
            <Link
              href={`/career-services/courses/${slug}`}
              className="block w-full bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700"
            >
              View Course Details
            </Link>
            <Link
              href="/career-services/courses"
              className="block w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50"
            >
              Browse All Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/career-services/courses/my-courses" 
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-white font-semibold">{course.title}</h1>
              <p className="text-gray-400 text-sm">{sortedModules.length} lessons</p>
            </div>
          </div>
        </div>
      </header>

      {/* Course Player */}
      <CoursePlayer 
        course={course} 
        modules={sortedModules} 
      />
    </div>
  );
}
