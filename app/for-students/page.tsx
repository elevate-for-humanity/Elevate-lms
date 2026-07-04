import { Metadata } from 'next';
import { GraduationCap, BookOpen, Award, ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `For Students | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Resources and information for students enrolled in our programs.',
};

export default function ForStudentsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">For Students</h1>
          <p className="text-xl text-blue-100">Your gateway to learning and career success.</p>
        </div>
      </section>
      
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          <a href="/lms/courses" className="bg-white p-8 rounded-xl border border-slate-200 text-center hover:shadow-lg transition">
            <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">My Courses</h3>
            <p className="text-slate-600">Access your enrolled courses.</p>
          </a>
          <a href="/lms/grades" className="bg-white p-8 rounded-xl border border-slate-200 text-center hover:shadow-lg transition">
            <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Grades</h3>
            <p className="text-slate-600">View your grades and progress.</p>
          </a>
          <a href="/lms/certificates" className="bg-white p-8 rounded-xl border border-slate-200 text-center hover:shadow-lg transition">
            <GraduationCap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Certificates</h3>
            <p className="text-slate-600">Download your certificates.</p>
          </a>
        </div>
      </section>
    </div>
  );
}
