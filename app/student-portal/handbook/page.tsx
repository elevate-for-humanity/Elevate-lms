
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Shield, Clock, AlertTriangle, GraduationCap, Heart, Scale, Phone } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/student-portal/handbook' },
  title: 'Student Handbook | Elevate For Humanity',
  description: 'Student handbook with policies, procedures, rights, responsibilities, and resources for Elevate for Humanity students.',
};

const SECTIONS = [
  { id: 'conduct', title: 'Code of Conduct', icon: Shield, content: 'Students are expected to maintain professional behavior at all times. This includes respect for instructors, fellow students, and staff. Harassment, discrimination, and disruptive behavior will not be tolerated and may result in dismissal from the program.' },
  { id: 'attendance', title: 'Attendance Policy', icon: Clock, content: 'Regular attendance is required for all programs. Students must maintain at least 80% attendance to remain in good standing. Absences must be reported to your instructor before class. Three consecutive unexcused absences may result in program withdrawal.' },
  { id: 'academic', title: 'Academic Standards', icon: GraduationCap, content: 'Students must maintain a minimum passing grade as defined by each program. Assignments must be submitted by posted deadlines. Academic dishonesty, including plagiarism and cheating, will result in disciplinary action up to and including dismissal.' },
  { id: 'grievance', title: 'Grievance Procedure', icon: Scale, content: 'Students who wish to file a complaint should first speak with their instructor. If unresolved, submit a written grievance to the Program Director within 10 business days. A formal review will be conducted and a written response provided within 15 business days.' },
  { id: 'safety', title: 'Safety & Emergency', icon: AlertTriangle, content: 'Students must follow all safety protocols for their program area. Report any unsafe conditions immediately. Emergency exits are marked in all facilities. In case of emergency, follow instructor directions and evacuate to designated assembly points.' },
  { id: 'support', title: 'Student Support Services', icon: Heart, content: 'Elevate provides career counseling, tutoring, job placement assistance, and referrals to community resources. Students facing personal challenges that affect their training should contact their enrollment advisor for confidential support.' },
];

export default function StudentHandbookPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Student Portal', href: '/student-portal' }, { label: 'Handbook' }]} />
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/pages/student-portal-page-5.jpg" alt="Student handbook" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Student Handbook</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">Policies, procedures, and resources for all Elevate students.</p>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-8 border-b">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contents</h2>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium px-3 py-1 bg-brand-blue-50 rounded-full">
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Handbook Sections */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 space-y-12">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.id} id={s.id} className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="w-6 h-6 text-brand-blue-600" />
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">{s.title}</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">{s.content}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Phone className="w-8 h-8 text-brand-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Questions About Policies?</h2>
          <p className="text-gray-600 mb-6">Contact your enrollment advisor or reach out to our support team.</p>
          <Link
            href="/support"
            className="bg-brand-blue-600 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
          >
            Contact Support
          </Link>
        </div>
      </section>
    </div>
  );
}
