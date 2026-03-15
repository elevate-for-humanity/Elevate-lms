import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { BookOpen, Download, ChevronRight, FileText, Shield, Users, Clock, Award, ShieldAlert } from 'lucide-react';
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
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1><p className="text-gray-600">Please try again later.</p></div></div>;
  }
  const { data: { user } } = await supabase.auth.getUser();

  // Handbook content is rendered from hardcoded sections below.
  // This query is for optional metadata (last updated date, PDF download link).
  const { data: handbook } = await db
    .from('documents')
    .select('*')
    .eq('document_type', 'student-handbook')
    .eq('owner_type', 'system')
    .limit(1)
    .maybeSingle();

  const { data: acknowledgment } = user ? await db
    .from('handbook_acknowledgments')
    .select('*')
    .eq('user_id', user.id)
    .eq('handbook_type', 'student')
    .single() : { data: null };

  const sections = [
    { title: '1. Welcome & Mission', description: 'Who we are and what we expect', icon: BookOpen },
    { title: '2. Program Expectations', description: 'Attendance, participation, and conduct', icon: Users },
    { title: '3. Attendance Policy', description: 'Minimum 80% required — federal requirement for funded students', icon: Clock },
    { title: '4. Code of Conduct', description: 'Professional behavior standards — non-negotiable', icon: Shield },
    { title: '5. Academic Integrity', description: 'Your credentials must be earned', icon: Award },
    { title: '6. Your Rights', description: 'FERPA, ADA, nondiscrimination, grievance', icon: Shield },
    { title: '7. Support Services', description: 'Career, academic, barrier removal, technology', icon: FileText },
    { title: '8. Grievance Procedure', description: 'How to file a complaint without retaliation', icon: FileText },
    { title: '9. Disciplinary Process', description: 'Warning → probation → dismissal', icon: Shield },
    { title: '10. Contact', description: 'How to reach us', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Student Handbook' }]} />
        </div>
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/pages/student-handbook-page-1.jpg" alt="Hero image" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Student Handbook</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">Your complete guide to policies, procedures, and expectations during your training program.</p>
          </div>
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
                className="flex items-center gap-2 bg-brand-blue-600 text-slate-900 px-5 py-2.5 rounded-lg font-medium hover:bg-brand-blue-700"
              >
                <Download className="w-4 h-4" /> Download PDF
              </a>
            ) : (
              <button className="flex items-center gap-2 bg-brand-blue-600 text-slate-900 px-5 py-2.5 rounded-lg font-medium hover:bg-brand-blue-700">
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
                className="flex items-center gap-4 p-4 rounded-lg hover:bg-white transition group"
              >
                <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center group-hover:bg-brand-blue-100">
                  <section.icon className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{section.title}</h3>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-brand-blue-600" />
              </Link>
            ))}
          </div>
        </div>

        {/* Non-negotiable banner */}
        <div className="bg-red-50 border-l-4 border-red-600 p-5 rounded-r-xl mb-8 flex gap-3">
          <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-900 mb-1">These policies are not up for negotiation.</p>
            <p className="text-red-800 text-sm">
              Every policy in this handbook applies to every student in every program. None of it is
              optional. If something is unclear, ask your program coordinator before your first session —
              not after an incident occurs.
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">

          <section id="section-1" className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">1. Welcome & Mission</h2>
            <p className="text-gray-700 mb-4">
              Elevate for Humanity provides career training, credentialing, and job placement support
              to job seekers, returning citizens, veterans, and underserved communities across Indiana.
              Our programs are designed to get you employed in a skilled trade or career field with
              industry-recognized credentials.
            </p>
            <p className="text-gray-700">
              You are here because you chose to invest in yourself. We take that seriously. In return,
              we expect you to show up, do the work, and conduct yourself as the professional you are
              training to become.
            </p>
          </section>

          <section id="section-2" className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">2. Program Expectations</h2>
            <p className="text-gray-700 mb-4">
              These are not suggestions. They are the minimum standards required to remain enrolled.
            </p>
            <ul className="space-y-3 text-gray-700">
              {[
                'Attend every scheduled session. Attendance is tracked and reported to funding agencies.',
                'Arrive on time. Arriving more than 15 minutes late counts as a half-absence.',
                'Complete all assignments, assessments, and hands-on competency demonstrations.',
                'Maintain professional conduct at all times — in class, at employer sites, and online.',
                'Communicate proactively. If something comes up, contact your coordinator before missing a session, not after.',
                'Register with WorkOne if you are receiving WIOA funding. This is a federal requirement, not optional.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-brand-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="section-3" className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">3. Attendance Policy</h2>
            <p className="text-gray-700 mb-4">
              <strong>Minimum 80% attendance is required to remain in good standing.</strong> This is
              not a guideline — it is a condition of your enrollment and, for funded students, a
              condition of your funding.
            </p>
            <div className="space-y-3 text-gray-700">
              <p><strong>Excused absences:</strong> Notify your program coordinator within 24 hours of any absence. Documentation may be required (medical, court, emergency). Excused absences still count toward your attendance percentage.</p>
              <p><strong>Unexcused absences:</strong> Three consecutive unexcused absences will result in a probation notice. A fourth may result in dismissal from the program.</p>
              <p><strong>Tardiness:</strong> Arriving more than 15 minutes late counts as a half-absence. Leaving more than 15 minutes early counts as a half-absence.</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>For WIOA-funded students:</strong> Attendance records are submitted to Indiana DWD.
                Falling below 80% attendance may result in suspension of your funding. This is federal
                policy — Elevate cannot override it.
              </p>
            </div>
          </section>

          <section id="section-4" className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">4. Code of Conduct</h2>
            <p className="text-gray-700 mb-4">
              You are training to enter a professional field. The conduct standards here mirror what
              employers expect. Violating them is not just a handbook issue — it reflects on your
              readiness for employment.
            </p>
            <div className="space-y-3 text-gray-700 mb-4">
              <p><strong>Treat everyone with respect.</strong> This includes fellow students, instructors, staff, and anyone you encounter at employer sites. Harassment, bullying, or discrimination of any kind will result in immediate dismissal.</p>
              <p><strong>No weapons, alcohol, or illegal substances</strong> on any training site or employer site, at any time. Violation results in immediate dismissal with no appeal.</p>
              <p><strong>No recording</strong> of instructors, staff, or fellow students without explicit consent.</p>
              <p><strong>Dress appropriately</strong> per your program&apos;s dress code. Your coordinator will provide specifics at orientation.</p>
              <p><strong>No sharing of LMS login credentials.</strong> Your account is yours. Sharing it is academic dishonesty.</p>
            </div>
            <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-brand-red-800 mb-2">Immediate Dismissal — No Warning</h3>
              <ul className="text-sm text-brand-red-700 space-y-1">
                <li>• Violence or threats of violence toward any person</li>
                <li>• Possession of weapons or illegal substances on site</li>
                <li>• Sexual harassment or assault</li>
                <li>• Falsifying attendance or program records</li>
              </ul>
            </div>
          </section>

          <section id="section-5" className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">5. Academic Integrity</h2>
            <p className="text-gray-700 mb-3">
              Your credentials mean something because they are earned. Cheating undermines that — for
              you and for every other student in the program.
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2"><span className="text-brand-blue-600 font-bold mt-0.5">—</span> All submitted work must be your own.</li>
              <li className="flex items-start gap-2"><span className="text-brand-blue-600 font-bold mt-0.5">—</span> Plagiarism or cheating on any exam or assessment results in immediate dismissal from the program.</li>
              <li className="flex items-start gap-2"><span className="text-brand-blue-600 font-bold mt-0.5">—</span> AI-generated content submitted as your own original work is prohibited.</li>
              <li className="flex items-start gap-2"><span className="text-brand-blue-600 font-bold mt-0.5">—</span> Do not share exam questions, answers, or assessment materials with other students.</li>
            </ul>
          </section>

          <section id="section-6" className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">6. Your Rights as a Student</h2>
            <p className="text-gray-700 mb-4">
              These rights are guaranteed. Elevate is obligated to honor them. If you believe any
              have been violated, you have the right to file a grievance without retaliation.
            </p>
            <ul className="space-y-3 text-gray-700">
              <li><strong>Right to a safe, respectful learning environment.</strong> No student should feel unsafe or disrespected at any Elevate training site.</li>
              <li><strong>Right to inspect your educational records under FERPA.</strong> You may request to view your records at any time. Contact your program coordinator.</li>
              <li><strong>Right to reasonable accommodations</strong> for documented disabilities under the ADA and Section 504. Request accommodations at enrollment — do not wait until you are struggling.</li>
              <li><strong>Right to file a grievance without retaliation.</strong> See Section 8 for the process.</li>
              <li><strong>Right to withdraw from the program at any time.</strong> See your enrollment agreement for the refund policy.</li>
              <li><strong>Right to nondiscrimination.</strong> Elevate does not discriminate on the basis of race, color, religion, sex, national origin, age, disability, or any other protected characteristic. This is federal law under WIOA Section 188.</li>
            </ul>
          </section>

          <section id="section-7" className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">7. Support Services</h2>
            <p className="text-gray-700 mb-4">
              These services exist to help you succeed. Use them. Asking for help is not a sign of
              weakness — it is what professionals do.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Career Services', desc: 'Resume writing, interview preparation, and job placement assistance. Available to all students during and after program completion.' },
                { title: 'Academic Support', desc: 'Additional instruction, tutoring coordination, and study resources. Contact your coordinator if you are falling behind — do not wait.' },
                { title: 'Barrier Removal', desc: 'Case management support for transportation, childcare, housing, and other barriers. WIOA-funded students may be eligible for supportive services.' },
                { title: 'Technology Support', desc: 'Help with LMS access, device issues, and software. Contact your coordinator or use the platform help desk.' },
              ].map((s) => (
                <div key={s.title} className="p-4 bg-white rounded-lg">
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-600">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="section-8" className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">8. Grievance Procedure</h2>
            <p className="text-gray-700 mb-3">
              If you have a complaint about a student, instructor, staff member, or program condition:
            </p>
            <ol className="space-y-3 text-gray-700 list-decimal list-inside">
              <li><strong>Step 1:</strong> Speak with your program coordinator. Most issues are resolved here within 2 business days.</li>
              <li><strong>Step 2:</strong> If unresolved within 5 business days, submit a written grievance to <strong>elevate4humanityedu@gmail.com</strong> with subject line &quot;Student Grievance.&quot;</li>
              <li><strong>Step 3:</strong> Elevate will respond in writing within 10 business days.</li>
              <li><strong>Step 4:</strong> If still unresolved, you may contact the Indiana Commission for Higher Education or the U.S. Department of Education.</li>
            </ol>
            <p className="text-sm text-gray-500 mt-3">
              Filing a grievance will not affect your enrollment status or result in retaliation of any kind.
            </p>
          </section>

          <section id="section-9" className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">9. Disciplinary Process</h2>
            <p className="text-gray-700 mb-3">
              For most violations, the process is: verbal warning → written warning → probation → dismissal.
              Serious violations skip directly to dismissal (see Section 4).
            </p>
            <p className="text-gray-700">
              You have the right to respond in writing to any written warning or probation notice within
              5 business days. Your response will be placed in your file and considered before any
              further action is taken.
            </p>
          </section>

          <section id="section-10" className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">10. Contact</h2>
            <div className="space-y-1 text-gray-700">
              <p><strong>Program Coordinator:</strong> Assigned at enrollment</p>
              <p><strong>Phone:</strong> (317) 314-3757</p>
              <p><strong>Email:</strong> elevate4humanityedu@gmail.com</p>
              <p><strong>Address:</strong> 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240</p>
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
                className="bg-brand-blue-600 text-slate-900 px-6 py-2 rounded-lg font-medium hover:bg-brand-blue-700"
              >
                Acknowledge
              </button>
            </form>
          </div>
        )}

        {acknowledgment && (
          <div className="mt-8 bg-brand-green-50 border border-brand-green-200 rounded-xl p-6">
            <p className="text-brand-green-700">
              • You acknowledged this handbook on {new Date(acknowledgment.acknowledged_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
