import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getCourseBySlug } from '@/lib/courses/definitions';

export const metadata: Metadata = {
  title: 'HVAC Technician Curriculum | Elevate for Humanity',
  description: 'Full HVAC Technician course curriculum — 16 modules, 88 lessons. EPA 608 Universal, OSHA 30, Residential HVAC Certifications, CPR, Rise Up.',
};

export default function HVACCurriculumPage() {
  const course = getCourseBySlug('hvac-technician');

  if (!course) {
    return <div className="p-8 text-center">Course not found.</div>;
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalMinutes = course.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((ls, l) => ls + (l.durationMinutes || 0), 0),
    0
  );
  const totalHours = Math.round(totalMinutes / 60);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-[200px] sm:h-[260px]">
        <Image src="/images/trades/hero-program-hvac.jpg" alt="HVAC Technician Training" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded">
          <span className="text-sm font-bold text-slate-900">Elevate for Humanity</span>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'HVAC Technician', href: '/programs/hvac-technician' },
            { label: 'Curriculum' },
          ]} />
        </div>
      </div>

      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900">{course.title} — Full Curriculum</h1>
        <p className="text-slate-600 mt-2">{course.subtitle}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 bg-slate-50 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{course.modules.length}</div>
            <div className="text-xs text-slate-500 uppercase">Modules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{totalLessons}</div>
            <div className="text-xs text-slate-500 uppercase">Lessons</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{totalHours}+</div>
            <div className="text-xs text-slate-500 uppercase">Hours (RTI)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{course.estimatedDurationWeeks}</div>
            <div className="text-xs text-slate-500 uppercase">Weeks</div>
          </div>
        </div>

        {/* Credentials */}
        <div className="mt-6 bg-slate-50 rounded-lg p-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase mb-2">Credentials Earned Upon Completion</h2>
          <div className="flex flex-wrap gap-2">
            {['EPA 608 Universal', 'Residential HVAC Cert 1', 'Residential HVAC Cert 2', 'OSHA 30', 'CPR', 'Rise Up'].map((c) => (
              <span key={c} className="bg-white border border-slate-200 text-slate-700 text-sm px-3 py-1 rounded">{c}</span>
            ))}
          </div>
        </div>

        {/* Workforce Tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {course.workforceTags.map((tag) => (
            <span key={tag} className="bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-2 py-1 rounded">{tag}</span>
          ))}
        </div>
      </div>

      {/* Modules */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold text-slate-900 border-b-2 border-slate-900 pb-2 mb-6">Course Modules</h2>

        <div className="space-y-6">
          {course.modules.map((mod, i) => {
            const modMinutes = mod.lessons.reduce((s, l) => s + (l.durationMinutes || 0), 0);
            const quizCount = mod.lessons.filter((l) => l.type === 'quiz').length;
            const labCount = mod.lessons.filter((l) => l.type === 'lab').length;

            return (
              <div key={mod.id} className="border border-slate-200 rounded-lg overflow-hidden">
                {/* Module header */}
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs font-bold text-slate-400">Module {i + 1}</span>
                    <h3 className="text-lg font-bold text-slate-900">{mod.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{mod.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span>{mod.lessons.length} lessons</span>
                    {modMinutes > 0 && <span>{modMinutes} min</span>}
                    {quizCount > 0 && <span>{quizCount} quiz{quizCount > 1 ? 'zes' : ''}</span>}
                    {labCount > 0 && <span>{labCount} lab{labCount > 1 ? 's' : ''}</span>}
                  </div>
                </div>

                {/* Lessons */}
                <div className="divide-y divide-slate-100">
                  {mod.lessons.map((lesson, j) => (
                    <div key={lesson.id} className="px-5 py-3 flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <LessonTypeBadge type={lesson.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-slate-400">{i + 1}.{j + 1}</span>
                          <span className="text-sm font-medium text-slate-900">{lesson.title}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{lesson.description}</p>
                      </div>
                      {lesson.durationMinutes && (
                        <span className="text-xs text-slate-400 flex-shrink-0">{lesson.durationMinutes} min</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <section className="bg-slate-900 py-10">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">HVAC Technician Training</h2>
            <p className="text-slate-400 text-sm">{course.modules.length} modules · {totalLessons} lessons · {course.estimatedDurationWeeks} weeks</p>
          </div>
          <div className="flex gap-3">
            <Link href="/apply?program=hvac-technician" className="bg-white text-slate-900 px-6 py-3 rounded font-semibold text-sm hover:bg-slate-100 transition-colors">Apply Now</Link>
            <Link href="/programs/hvac-technician" className="border border-slate-500 text-white px-6 py-3 rounded font-semibold text-sm hover:border-white transition-colors">Program Details</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function LessonTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    video: 'bg-blue-100 text-blue-700',
    reading: 'bg-amber-100 text-amber-700',
    quiz: 'bg-red-100 text-red-700',
    lab: 'bg-green-100 text-green-700',
    assignment: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${styles[type] || 'bg-slate-100 text-slate-600'}`}>
      {type}
    </span>
  );
}
