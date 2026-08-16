import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Clock, Award, ArrowRight } from 'lucide-react';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';

export const metadata: Metadata = {
  title: 'Career Courses | Career Services',
  keywords: ['career courses', 'professional development', 'skills training'],
  description: 'Enhance your career with our professional development courses. Build skills that employers value.',
};

export default function CareerServicesCoursesPage() {
  const courses = [
    { title: 'Professional Communication', desc: 'Master workplace communication, email etiquette, and presentation skills.', hours: 8, icon: BookOpen },
    { title: 'Resume Writing Workshop', desc: 'Learn to write resumes that pass ATS screening and catch recruiter attention.', hours: 4, icon: Award },
    { title: 'Interview Skills Bootcamp', desc: 'Practice common interview questions and learn how to make a great impression.', hours: 6, icon: Clock },
    { title: 'Time Management', desc: 'Develop strategies to manage your time effectively and boost productivity.', hours: 4, icon: Clock },
    { title: 'Customer Service Excellence', desc: 'Learn the skills that make customers happy and boost your value.', hours: 8, icon: BookOpen },
    { title: 'Leadership Fundamentals', desc: 'Build the foundation for supervisory and management roles.', hours: 12, icon: Award },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PictureFirstPageHero
        image="/images/pages/courses-page-13.webp"
        alt="Professional development class and career skills training"
        eyebrow="Professional Development"
        title="Career Courses & Workshops"
        description="Short courses designed to strengthen professional skills and make you more valuable to employers."
        actions={(
          <>
            <Link href="/career-services/contact" className="inline-flex items-center rounded-lg bg-brand-red-600 px-7 py-3 font-bold text-white transition-colors hover:bg-brand-red-700">Enroll Now</Link>
            <Link href="/programs" className="inline-flex items-center rounded-lg border-2 border-slate-300 bg-white px-7 py-3 font-bold text-slate-900 transition-colors hover:border-slate-500">View Full Programs</Link>
          </>
        )}
      />

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-center text-2xl font-bold text-slate-950 md:text-3xl">Available Courses</h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-slate-700">Quick courses to enhance your professional skills.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div key={course.title} className="rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-brand-blue-200 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue-100">
                  <course.icon className="h-6 w-6 text-brand-blue-700" />
                </div>
                <h3 className="mb-2 font-bold text-slate-950">{course.title}</h3>
                <p className="mb-4 text-sm text-slate-700">{course.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">{course.hours} hours</span>
                  <Link href="/career-services/contact" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-700 hover:underline">Enroll <ArrowRight className="h-3 w-3" /></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-950 md:text-3xl">Need Custom Training?</h2>
          <p className="mb-8 text-slate-700">We can create custom courses for your workforce. Contact us to discuss your needs.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/career-services/contact" className="inline-flex items-center rounded-lg bg-brand-blue-700 px-8 py-4 font-bold text-white transition-colors hover:bg-brand-blue-800">Contact Career Services</Link>
            <Link href="/programs" className="inline-flex items-center rounded-lg border-2 border-slate-300 px-8 py-4 font-bold text-slate-800 transition-colors hover:bg-slate-50">Explore Programs</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
