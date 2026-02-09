import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { 
  Play, 
  Clock, 
  Award, 
  CheckCircle, 
  Star, 
  Users,
  Download,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { CourseDetailClient } from './CourseDetailClient';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  
  if (!supabase) return { title: 'Course Not Found' };

  const { data: course } = await supabase
    .from('career_courses')
    .select('title, description')
    .eq('slug', slug)
    .single();

  if (!course) return { title: 'Course Not Found' };

  return {
    title: `${course.title} | Elevate for Humanity`,
    description: course.description,
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  if (!supabase) {
    notFound();
  }

  const { data: course } = await supabase
    .from('career_courses')
    .select(`
      *,
      features:career_course_features(*),
      modules:career_course_modules(*)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!course) {
    notFound();
  }

  const sortedModules = course.modules?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
  const sortedFeatures = course.features?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];

  const totalDuration = sortedModules.reduce((acc: number, m: any) => acc + (m.duration_minutes || 0), 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Services', href: '/career-services' }, { label: 'Courses', href: '/career-services/courses' }, { label: course.title }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              {course.is_bestseller && (
                <span className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  BESTSELLER
                </span>
              )}
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-blue-200 mb-6">{course.subtitle}</p>
              <p className="text-gray-300 mb-8">{course.description}</p>

              <div className="flex flex-wrap gap-6 mb-8 text-sm">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-blue-400" />
                  <span>{course.lesson_count} video lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span>{course.duration_hours} hours of content</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-400" />
                  <span>Certificate included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
                  <span>4.9 rating</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-4xl font-bold sezzle-hero-price">${Number(course.price).toFixed(0)}</span>
                    {course.original_price && (
                      <span className="text-xl text-gray-400 line-through ml-3">
                        ${Number(course.original_price).toFixed(0)}
                      </span>
                    )}
                  </div>
                  {course.original_price && (
                    <span className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                      Save ${(Number(course.original_price) - Number(course.price)).toFixed(0)}
                    </span>
                  )}
                </div>
                {/* Sezzle Widget - shows "or 4 interest-free payments" */}
                {Number(course.price) >= 35 && Number(course.price) <= 2500 && (
                  <div className="sezzle-hero-widget text-blue-200" />
                )}
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={course.image_url || '/images/heroes/hero-state-funding.jpg'}
                  alt={course.title}
                  width={600}
                  height={400}
                  className="w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition">
                    <Play className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Buy Bar */}
      <CourseDetailClient course={course} />

      {/* What You'll Learn */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">What You'll Get</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {sortedFeatures.map((feature: any, index: number) => (
              <div key={index} className="flex items-start gap-3 bg-white p-4 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{feature.feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Curriculum */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Course Curriculum</h2>
            <p className="text-gray-600">
              {sortedModules.length} lessons • {Math.floor(totalDuration / 60)}h {totalDuration % 60}m total
            </p>
          </div>

          <div className="space-y-3">
            {sortedModules.map((module: any, index: number) => (
              <div 
                key={module.id} 
                className="bg-white border rounded-xl p-4 hover:shadow-md transition"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    module.is_preview 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{module.title}</h3>
                      {module.is_preview && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Preview
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{module.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Play className="w-4 h-4" />
                    {module.duration_minutes} min
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantees */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">30-Day Money Back</h3>
              <p className="text-gray-600 text-sm">Not satisfied? Get a full refund within 30 days, no questions asked.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Lifetime Access</h3>
              <p className="text-gray-600 text-sm">Buy once, access forever. Including all future updates.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Expert Support</h3>
              <p className="text-gray-600 text-sm">Get your questions answered by career experts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-slate-700 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Improve Your Career?</h2>
          <p className="text-blue-100 mb-8">
            Join thousands of professionals who have accelerated their careers with our courses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/career-services/courses/${slug}/checkout`}
              className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-blue-50 transition"
            >
              Enroll Now - ${Number(course.price).toFixed(0)}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/career-services/courses"
              className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              View All Courses
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
