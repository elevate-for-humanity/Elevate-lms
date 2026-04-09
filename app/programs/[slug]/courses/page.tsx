import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock, Award, Users, DollarSign } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const name = params.slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return { title: `${name} Courses | Elevate For Humanity` };
}

const CATEGORY_IMAGES: Record<string, string> = {
  healthcare:       '/images/pages/cna-patient-care.jpg',
  'skilled-trades': '/images/pages/hvac-unit.jpg',
  technology:       '/images/pages/it-helpdesk-desk.jpg',
  business:         '/images/pages/tax-prep-desk.jpg',
  transportation:   '/images/pages/cdl-truck-highway.jpg',
  barber:           '/images/pages/barber-fade.jpg',
};

function getCategory(slug: string): string {
  if (/hvac|electrical|welding|plumbing|building|skilled/.test(slug)) return 'skilled-trades';
  if (/tech|web|cyber|network|software/.test(slug)) return 'technology';
  if (/business|tax|accounting|financial|bookkeeping/.test(slug)) return 'business';
  if (/cdl|transport/.test(slug)) return 'transportation';
  if (/barber|beauty|cosmetology|nail|esthetician/.test(slug)) return 'barber';
  return 'healthcare';
}

export default async function ProgramCoursesPage({ params }: { params: { slug: string } }) {
  await requireRole(['student', 'learner', 'admin', 'super_admin', 'staff', 'instructor', 'program_holder']);

  const supabase = await createClient();
  const { slug } = params;

  const { data: program } = await supabase
    .from('programs')
    .select('id, title, slug')
    .eq('slug', slug)
    .single();

  if (!program) notFound();

  const { data: courses } = await supabase
    .from('training_courses')
    .select('id, title, description, price, duration, lessons_count, enrolled_count, certification, image_url')
    .eq('program_id', program.id)
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  const allCourses = courses || [];
  const category = getCategory(slug);
  const fallbackImage = CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES.healthcare;
  const programName = program.title || slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[
        { label: 'Programs', href: '/programs' },
        { label: programName, href: `/programs/${slug}` },
        { label: 'Courses' },
      ]} />

      <section className="relative h-[280px] w-full overflow-hidden">
        <Image src={fallbackImage} alt={`${programName} courses`} fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-3">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">{programName}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Available Courses</h1>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {allCourses.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Enrollment Through Admissions</h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              This program requires enrollment through our admissions process.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/start" className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-xl font-bold transition">Apply Now</Link>
              <Link href="/programs" className="border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium hover:bg-slate-50 transition">Browse Programs</Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  <Image src={course.image_url || fallbackImage} alt={course.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover hover:scale-105 transition-transform duration-300" />
                  {course.price === 0 && <span className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">FREE</span>}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-900 text-base mb-2 leading-snug">{course.title}</h3>
                  {course.description && <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">{course.description}</p>}
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-4">
                    {course.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>}
                    {course.lessons_count && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lessons_count} lessons</span>}
                    {course.enrolled_count > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.enrolled_count} enrolled</span>}
                    {course.certification && <span className="flex items-center gap-1"><Award className="w-3 h-3" />Certificate</span>}
                  </div>
                  <div className="border-t pt-4 flex items-center justify-between gap-3">
                    <div className="font-extrabold text-lg text-slate-900">
                      {course.price === 0 ? <span className="text-green-600">FREE</span> : `$${course.price}`}
                    </div>
                    <Link href={`/lms/courses/${course.id}`} className="flex items-center gap-1.5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition">
                      <DollarSign className="w-3.5 h-3.5" /> Enroll
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
