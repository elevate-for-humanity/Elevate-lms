import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import {
  Shield,
  AlertTriangle,
  BookOpen,
  FileText,
  Users,
  Phone,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Academic Integrity Policy | Elevate for Humanity',
  description: 'Academic honesty, plagiarism policy, and code of conduct',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/academic-integrity',
  },
};

export default async function AcademicIntegrityPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch academic integrity policy
  const { data: policy } = await supabase
    .from('legal_documents')
    .select('*')
    .eq('type', 'academic_integrity')
    .single();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Academic Integrity' }]} />
        </div>
      </div>
      
      {/* Hero Section */}
      <section className="relative h-[400px] md:h-[500px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/facilities-new/facility-1.jpg"
          alt="Academic Integrity"
          fill
          className="object-cover brightness-50"
          quality={100}
          priority
          sizes="100vw"
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Academic Integrity Policy
          </h1>
          <p className="text-xl md:text-2xl">
            Upholding Honesty, Ethics, and Professional Standards
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 sm:px-6 sm:py-12">
        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-4 sm:p-6 md:p-8 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">
            Our Commitment to Academic Honesty
          </h2>
          <p className="text-black mb-4">
            At Elevate for Humanity, we are committed to maintaining the highest
            standards of academic integrity. Academic honesty is fundamental to
            the learning process and essential for preparing students for
            professional careers.
          </p>
          <p className="text-black mb-4">
            All students, faculty, and staff are expected to uphold these
            principles and contribute to a culture of honesty, trust, and
            ethical behavior.
          </p>
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
            <p className="text-brand-blue-900 font-semibold">
              Academic integrity means doing your own work, giving credit where
              credit is due, and being honest in all academic endeavors.
            </p>
          </div>
        </div>

        {/* What is Academic Dishonesty */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-4 sm:p-6 md:p-8 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-black mb-6">
            What Constitutes Academic Dishonesty?
          </h2>

          <div className="space-y-6">
            {/* Plagiarism */}
            <div className="border-l-4 border-red-500 pl-6">
              <h3 className="text-base sm:text-lg font-bold text-black mb-3 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-brand-orange-600" />
                Plagiarism
              </h3>
              <p className="text-black mb-3">
                Using someone else's words, ideas, or work without proper
                attribution.
              </p>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="font-semibold text-red-900 mb-2">
                  Examples of Plagiarism:
                </p>
                <ul className="space-y-2 text-red-800 text-sm">
                  <li>
                    • Copying text from websites, books, or articles without
                    citation
                  </li>
                  <li>• Submitting someone else's work as your own</li>
                  <li>
                    • Paraphrasing without giving credit to the original source
                  </li>
                  <li>
                    • Using AI-generated content without disclosure and proper
                    attribution
                  </li>
                  <li>• Copying another student's assignment or project</li>
                  <li>• Purchasing or downloading papers from the internet</li>
                </ul>
              </div>
            </div>

            {/* Cheating */}
            <div className="border-l-4 border-orange-500 pl-6">
              <h3 className="text-base sm:text-lg font-bold text-black mb-3 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-brand-orange-600" />
                Cheating
              </h3>
              <p className="text-black mb-3">
                Using unauthorized materials or assistance during assessments.
              </p>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="font-semibold text-orange-900 mb-2">
                  Examples of Cheating:
                </p>
                <ul className="space-y-2 text-orange-800 text-sm">
                  <li>
                    • Using notes, books, or devices during closed-book exams
                  </li>
                  <li>• Looking at another student's exam or answers</li>
                  <li>• Sharing answers during tests or quizzes</li>
                  <li>
                    • Using unauthorized technology or apps during assessments
                  </li>
                  <li>• Taking photos of exams to share with others</li>
                  <li>• Having someone else take an exam for you</li>
                </ul>
              </div>
            </div>

            {/* Unauthorized Collaboration */}
            <div className="border-l-4 border-yellow-500 pl-6">
              <h3 className="text-base sm:text-lg font-bold text-black mb-3 flex items-center gap-2">
                <Users className="w-6 h-6 text-yellow-600" />
                Unauthorized Collaboration
              </h3>
              <p className="text-black mb-3">
                Working with others when individual work is required.
              </p>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="font-semibold text-yellow-900 mb-2">Examples:</p>
                <ul className="space-y-2 text-yellow-800 text-sm">
                  <li>• Completing individual assignments as a group</li>
                  <li>• Sharing completed work with other students</li>
                  <li>• Dividing work on individual projects</li>
                  <li>• Allowing others to copy your work</li>
                </ul>
                <p className="text-yellow-900 text-sm mt-3">
                  <strong>Note:</strong> Collaboration is encouraged when
                  explicitly permitted by the instructor. Always ask if you're
                  unsure whether collaboration is allowed.
                </p>
              </div>
            </div>

            {/* Falsification */}
            <div className="border-l-4 border-brand-blue-500 pl-6">
              <h3 className="text-base sm:text-lg font-bold text-black mb-3 flex items-center gap-2">
                <FileText className="w-6 h-6 text-brand-blue-600" />
                Falsification of Records
              </h3>
              <p className="text-black mb-3">
                Altering or fabricating academic records or documentation.
              </p>
              <div className="bg-brand-blue-50 rounded-lg p-4">
                <p className="font-semibold text-brand-blue-900 mb-2">Examples:</p>
                <ul className="space-y-2 text-brand-blue-800 text-sm">
                  <li>• Forging signatures on documents</li>
                  <li>• Altering grades or transcripts</li>
                  <li>• Fabricating data or research results</li>
                  <li>• Falsifying attendance records</li>
                  <li>• Submitting false documentation for absences</li>
                  <li>• Misrepresenting hours worked or services performed</li>
                </ul>
              </div>
            </div>

            {/* Multiple Submissions */}
            <div className="border-l-4 border-brand-blue-500 pl-6">
              <h3 className="text-base sm:text-lg font-bold text-black mb-3 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-brand-blue-600" />
                Multiple Submissions
              </h3>
              <p className="text-black mb-3">
                Submitting the same work for multiple courses without
                permission.
              </p>
              <div className="bg-brand-blue-50 rounded-lg p-4">
                <p className="text-brand-blue-800 text-sm">
                  Students must obtain explicit permission from all instructors
                  involved before submitting the same or substantially similar
                  work for credit in more than one course.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Consequences */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-4 sm:p-6 md:p-8 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-black mb-6">
            Consequences of Academic Dishonesty
          </h2>
          <p className="text-black mb-6">
            Violations of academic integrity are taken seriously and will result
            in disciplinary action. The severity of consequences depends on the
            nature and frequency of the violation.
          </p>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
              <h3 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                <span className="bg-yellow-200 text-yellow-900 px-3 py-2 rounded-full text-sm">
                  1st Offense
                </span>
                First Violation
              </h3>
              <ul className="space-y-2 text-yellow-800 text-sm ml-6">
                <li>• Written warning placed in student file</li>
                <li>• Zero grade on the assignment or assessment</li>
                <li>• Required meeting with instructor and academic advisor</li>
                <li>• Completion of academic integrity workshop</li>
                <li>• Probationary status for remainder of term</li>
              </ul>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 sm:p-6">
              <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                <span className="bg-orange-200 text-orange-900 px-3 py-2 rounded-full text-sm">
                  2nd Offense
                </span>
                Second Violation
              </h3>
              <ul className="space-y-2 text-orange-800 text-sm ml-6">
                <li>• Failure (F) in the course</li>
                <li>• Academic probation for one full term</li>
                <li>• Meeting with Dean of Students</li>
                <li>
                  • Notation on academic transcript (may be removed upon
                  graduation)
                </li>
                <li>• Possible suspension from program</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
              <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                <span className="bg-red-200 text-red-900 px-3 py-2 rounded-full text-sm">
                  3rd Offense
                </span>
                Third Violation or Severe Cases
              </h3>
              <ul className="space-y-2 text-red-800 text-sm ml-6">
                <li>• Dismissal from the program</li>
                <li>• Permanent notation on transcript</li>
                <li>• No refund of tuition or fees</li>
                <li>• Ineligibility for re-admission</li>
                <li>• Notification to licensing boards (if applicable)</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 bg-slate-100 rounded-lg p-4">
            <p className="text-black text-sm">
              <strong>Note:</strong> Particularly egregious violations (such as
              falsifying clinical records, forging signatures, or systematic
              cheating) may result in immediate dismissal regardless of prior
              violations.
            </p>
          </div>
        </div>

        {/* How to Avoid Violations */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-4 sm:p-6 md:p-8 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-black mb-6">
            How to Maintain Academic Integrity
          </h2>

          <div className="grid md:grid-cols-2 gap-4 sm:p-6">
            <div className="bg-green-50 rounded-lg p-4 sm:p-6">
              <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                Do's
              </h3>
              <ul className="space-y-2 text-green-800 text-sm">
                <li>• Always cite your sources properly</li>
                <li>• Use quotation marks for direct quotes</li>
                <li>• Ask instructors if collaboration is allowed</li>
                <li>• Keep your work secure and private</li>
                <li>• Start assignments early to avoid pressure</li>
                <li>• Seek help from instructors or tutors</li>
                <li>• Use plagiarism checkers before submitting</li>
                <li>• Disclose use of AI tools when required</li>
                <li>• Take notes in your own words</li>
                <li>• Report suspected violations</li>
              </ul>
            </div>

            <div className="bg-red-50 rounded-lg p-4 sm:p-6">
              <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-brand-orange-600" />
                Don'ts
              </h3>
              <ul className="space-y-2 text-red-800 text-sm">
                <li>✗ Don't copy from any source without citation</li>
                <li>✗ Don't share your work with other students</li>
                <li>✗ Don't use unauthorized materials during exams</li>
                <li>✗ Don't submit work you didn't create</li>
                <li>✗ Don't fabricate data or information</li>
                <li>✗ Don't take shortcuts under pressure</li>
                <li>✗ Don't assume "everyone does it"</li>
                <li>✗ Don't help others cheat</li>
                <li>✗ Don't reuse old assignments</li>
                <li>✗ Don't ignore academic integrity policies</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Proper Citation */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-4 sm:p-6 md:p-8 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-black mb-6">
            Proper Citation Guidelines
          </h2>
          <p className="text-black mb-4">
            When using information from other sources, you must give proper
            credit. Here are basic guidelines:
          </p>

          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-black mb-2">
                When to Cite:
              </h3>
              <ul className="space-y-1 text-black text-sm ml-4">
                <li>• Direct quotations from any source</li>
                <li>• Paraphrased ideas or information</li>
                <li>• Statistics, data, or research findings</li>
                <li>• Images, charts, or graphs from other sources</li>
                <li>• Specific theories or methodologies</li>
                <li>• Any information that is not common knowledge</li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-black mb-2">
                Citation Formats:
              </h3>
              <p className="text-black text-sm mb-2">
                Use the citation format specified by your instructor (APA, MLA,
                Chicago, etc.). If no format is specified, use APA format.
              </p>
              <p className="text-black text-sm">
                <strong>Resources:</strong> Ask your instructor for citation
                guides or visit the library for assistance with proper citation
                formatting.
              </p>
            </div>
          </div>
        </div>

        {/* Reporting Violations */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-4 sm:p-6 md:p-8 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-black mb-6">
            Reporting Academic Dishonesty
          </h2>
          <p className="text-black mb-4">
            If you witness or suspect academic dishonesty, you have a
            responsibility to report it. All reports are taken seriously and
            handled confidentially.
          </p>

          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 sm:p-6">
            <h3 className="font-semibold text-brand-blue-900 mb-3">How to Report:</h3>
            <ul className="space-y-2 text-brand-blue-800 text-sm">
              <li>• Speak directly with the course instructor</li>
              <li>• Contact the Dean of Students</li>
              <li>• Submit an anonymous report through the student portal</li>
              <li>• Email: elevate4humanityedu@gmail.com</li>
              <li>• Phone: 317-314-3757</li>
            </ul>
            <p className="text-brand-blue-900 text-sm mt-4">
              <strong>Protection:</strong> Students who report violations in
              good faith will not face retaliation. The institution prohibits
              any form of retaliation against those who report academic
              dishonesty.
            </p>
          </div>
        </div>

        {/* Student Pledge */}
        <div className="bg-white rounded-xl p-4 sm:p-4 sm:p-6 md:p-8 text-white mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Academic Integrity Pledge</h2>
          <div className="bg-white/10 rounded-lg p-4 sm:p-6">
            <p className="text-brand-blue-100 italic mb-4">
              "I pledge to uphold the highest standards of academic integrity. I
              will do my own work, give credit where credit is due, and be
              honest in all my academic endeavors. I understand that academic
              dishonesty undermines my education and the value of my
              credentials. I commit to maintaining these standards throughout my
              time at Elevate for Humanity."
            </p>
            <p className="text-brand-blue-200 text-sm">
              All students acknowledge this pledge upon enrollment and are
              expected to uphold it throughout their academic career.
            </p>
          </div>
        </div>

        {/* Resources */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-4 sm:p-6 md:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-black mb-6">
            Resources & Support
          </h2>
          <div className="grid md:grid-cols-3 gap-4 sm:p-6">
            <div>
              <h3 className="font-semibold text-black mb-2">
                Academic Support
              </h3>
              <p className="text-sm text-black mb-2">
                Get help with assignments and studying
              </p>
              <Link
                href="/support"
                className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold"
              >
                Visit Support Center →
              </Link>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-2">
                Student Handbook
              </h3>
              <p className="text-sm text-black mb-2">
                Review all academic policies
              </p>
              <Link
                href="/student-handbook"
                className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold"
              >
                Read Handbook →
              </Link>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-2">Questions?</h3>
              <p className="text-sm text-black mb-2">
                Contact Student Services
              </p>
              <a
                href="mailto:elevate4humanityedu@gmail.com"
                className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold"
              >
                Email Support →
              </a>
            </div>
          </div>
        </div>
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Apply today for free career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              Visit Support Center
            </a>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
