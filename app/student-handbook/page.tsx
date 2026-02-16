import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { BookOpen, Download, ChevronRight, FileText, Shield, Users, Clock, Award } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Student Handbook | Elevate For Humanity',
  description: 'Complete guide to policies, procedures, and expectations for students in our training programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/student-handbook',
  },
};

export const dynamic = 'force-dynamic';

export default async function StudentHandbookPage() {
  const supabase = await createClient();
  if (!supabase) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1><p className="text-gray-600">Please try again later.</p></div></div>;
  }
  const { data: { user } } = await supabase.auth.getUser();

  const { data: handbook } = await supabase
    .from('documents')
    .select('*')
    .eq('type', 'student-handbook')
    .eq('is_active', true)
    .single();

  const { data: acknowledgment } = user ? await supabase
    .from('handbook_acknowledgments')
    .select('*')
    .eq('user_id', user.id)
    .eq('handbook_type', 'student')
    .single() : { data: null };

  const sections = [
    { title: 'Welcome & Mission', description: 'Our commitment to your success', icon: BookOpen },
    { title: 'Program Expectations', description: 'Attendance, participation, and conduct', icon: Users },
    { title: 'Academic Policies', description: 'Grading, assessments, and certifications', icon: Award },
    { title: 'Code of Conduct', description: 'Professional behavior standards', icon: Shield },
    { title: 'Attendance Policy', description: 'Requirements and procedures', icon: Clock },
    { title: 'Support Services', description: 'Resources available to you', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Student Handbook' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-[350px] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/heroes/student-progress.jpg)' }}
        />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Student Handbook</h1>
          <p className="text-xl text-brand-blue-100 max-w-2xl">
            Your complete guide to policies, procedures, and expectations during your training program.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Download Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-brand-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Student Handbook 2024</h2>
                <p className="text-sm text-gray-500">
                  Last updated: {handbook?.updated_at ? new Date(handbook.updated_at).toLocaleDateString() : 'January 2024'}
                </p>
              </div>
            </div>
            {handbook?.file_url ? (
              <a
                href={handbook.file_url}
                className="flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-blue-700"
              >
                <Download className="w-4 h-4" /> Download PDF
              </a>
            ) : (
              <button className="flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-blue-700">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            )}
          </div>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="font-semibold text-lg mb-6">Table of Contents</h2>
          <div className="space-y-3">
            {sections.map((section, index) => (
              <Link
                key={section.title}
                href={`#section-${index + 1}`}
                className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition group"
              >
                <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center group-hover:bg-brand-blue-100">
                  <section.icon className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{section.title}</h3>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-blue-600" />
              </Link>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          <section id="section-1" className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Welcome & Mission</h2>
            <p className="text-gray-600 mb-4">
              Welcome to Elevate For Humanity! We are committed to providing you with the skills, 
              knowledge, and support you need to launch a successful career. Our mission is to 
              break the cycle of poverty through workforce development.
            </p>
            <p className="text-gray-600">
              As a student, you are joining a community of learners dedicated to personal and 
              professional growth. We believe in your potential and are here to support you 
              every step of the way.
            </p>
          </section>

          <section id="section-2" className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Program Expectations</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-brand-blue-600 rounded-full mt-2"></span>
                Attend all scheduled classes and training sessions
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-brand-blue-600 rounded-full mt-2"></span>
                Participate actively in discussions and activities
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-brand-blue-600 rounded-full mt-2"></span>
                Complete all assignments and assessments on time
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-brand-blue-600 rounded-full mt-2"></span>
                Maintain professional conduct at all times
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-brand-blue-600 rounded-full mt-2"></span>
                Communicate proactively with instructors and staff
              </li>
            </ul>
          </section>

          <section id="section-3" className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Academic Policies</h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Grading</h3>
                <p>Programs use a competency-based assessment model. You must demonstrate proficiency in all required skills to earn your certification.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Certifications</h3>
                <p>Upon successful completion, you will receive industry-recognized certifications that qualify you for employment in your field.</p>
              </div>
            </div>
          </section>

          <section id="section-4" className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Code of Conduct</h2>
            <p className="text-gray-600 mb-4">
              All students are expected to conduct themselves professionally and respectfully. 
              This includes treating fellow students, instructors, and staff with dignity and respect.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-800 mb-2">Prohibited Conduct</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Harassment or discrimination of any kind</li>
                <li>• Academic dishonesty or cheating</li>
                <li>• Possession of weapons or illegal substances</li>
                <li>• Disruptive behavior in class</li>
              </ul>
            </div>
          </section>

          <section id="section-5" className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Attendance Policy</h2>
            <p className="text-gray-600 mb-4">
              Regular attendance is essential for your success. Students must maintain at least 
              80% attendance to remain in good standing.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">Absence Procedures</h3>
              <p className="text-sm text-yellow-700">
                If you must miss class, notify your instructor as soon as possible. 
                Excessive absences may result in dismissal from the program.
              </p>
            </div>
          </section>

          <section id="section-6" className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Support Services</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Career Services</h3>
                <p className="text-sm text-gray-600">Resume help, interview prep, and job placement assistance</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Academic Support</h3>
                <p className="text-sm text-gray-600">Tutoring, study groups, and additional instruction</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Personal Support</h3>
                <p className="text-sm text-gray-600">Counseling referrals and emergency assistance</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Technology Support</h3>
                <p className="text-sm text-gray-600">Help with LMS, equipment, and software</p>
              </div>
            </div>
          </section>
        </div>

        {/* Acknowledgment */}
        {user && !acknowledgment && (
          <div className="mt-8 bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Acknowledge Handbook</h3>
            <form action="/api/handbook/acknowledge" method="POST">
              <input type="hidden" name="type" value="student" />
              <label className="flex items-start gap-3 mb-4">
                <input type="checkbox" name="confirm" required className="mt-1" />
                <span className="text-sm text-gray-600">
                  I have read and understand the Student Handbook. I agree to abide by all policies and procedures.
                </span>
              </label>
              <button
                type="submit"
                className="bg-brand-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-blue-700"
              >
                Acknowledge
              </button>
            </form>
          </div>
        )}

        {acknowledgment && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
            <p className="text-green-700">
              • You acknowledged this handbook on {new Date(acknowledgment.acknowledged_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
