import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Clock, Award, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Career Courses | Career Services',
  keywords: ["career courses", "professional development", "skills training"],
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
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-red-500 to-brand-orange-500" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-red-500/20 text-brand-red-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" />
              Professional Development
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Career Courses & Workshops
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Short courses designed to boost your professional skills and make you more valuable to employers.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/career-services/contact" className="inline-flex items-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Enroll Now
              </Link>
              <Link href="/programs" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                View Full Programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-4">Available Courses</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">Quick courses to enhance your professional skills.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.title} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg hover:border-brand-blue-200 transition-all">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <course.icon className="w-6 h-6 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{course.title}</h3>
                <p className="text-sm text-slate-600 mb-4">{course.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{course.hours} hours</span>
                  <Link href="/career-services/contact" className="text-sm text-brand-blue-600 font-semibold inline-flex items-center gap-1 hover:text-brand-blue-700">
                    Enroll <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Need Custom Training?</h2>
          <p className="text-slate-600 mb-8">We can create custom courses for your workforce. Contact us to discuss your needs.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/career-services/contact" className="inline-flex items-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Contact Career Services
            </Link>
            <Link href="/programs" className="inline-flex items-center border-2 border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-4 px-8 rounded-lg transition-colors">
              Explore Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
