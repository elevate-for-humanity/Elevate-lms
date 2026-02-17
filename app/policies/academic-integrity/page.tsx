import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Academic Integrity Policy | Elevate for Humanity',
  description: 'Standards for honest academic work, prohibited behaviors, and consequences for violations of academic integrity.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/academic-integrity',
  },
};

export default function AcademicIntegrityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Academic Integrity" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Academic Integrity Policy</h1>
            <p className="text-sm text-gray-600">Last Updated: January 11, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              Elevate for Humanity is committed to maintaining the highest standards of academic integrity. 
              This policy establishes expectations for honest academic work and outlines consequences for violations. 
              Academic integrity is fundamental to the educational process and essential for the value of credentials we issue.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Core Principles</h2>
            <p className="text-black mb-4">Students are expected to:</p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Submit original work that represents their own effort and understanding</li>
              <li>Properly cite and attribute all sources used in assignments and projects</li>
              <li>Follow all instructions regarding collaboration and resource use</li>
              <li>Maintain honesty in all academic activities including exams, assignments, and assessments</li>
              <li>Report suspected violations of academic integrity</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Prohibited Behaviors</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Cheating</h3>
            <p className="text-black mb-4">Includes but not limited to:</p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Using unauthorized materials during exams or assessments</li>
              <li>Copying answers from other students</li>
              <li>Using prohibited technology or devices during testing</li>
              <li>Obtaining advance copies of exams or assignments</li>
              <li>Submitting work completed by someone else</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Plagiarism</h3>
            <p className="text-black mb-4">Includes but not limited to:</p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Copying text, ideas, or work from sources without proper citation</li>
              <li>Paraphrasing content without attribution</li>
              <li>Submitting purchased or downloaded papers as original work</li>
              <li>Using AI-generated content without disclosure (see AI Usage Policy)</li>
              <li>Self-plagiarism (resubmitting previous work without permission)</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Unauthorized Collaboration</h3>
            <p className="text-black mb-4">Includes but not limited to:</p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Working with others on assignments designated as individual work</li>
              <li>Sharing answers or solutions with other students</li>
              <li>Allowing others to copy your work</li>
              <li>Dividing group work unfairly and claiming credit for others' contributions</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Fabrication and Falsification</h3>
            <p className="text-black mb-4">Includes but not limited to:</p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Inventing or altering data, citations, or research results</li>
              <li>Falsifying attendance or participation records</li>
              <li>Submitting false documentation or credentials</li>
              <li>Misrepresenting the completion of required activities</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Consequences for Violations</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">First Offense</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Written warning placed in student file</li>
                <li>Zero grade on the assignment or assessment</li>
                <li>Required meeting with instructor and program director</li>
                <li>Completion of academic integrity training module</li>
              </ul>
            </div>

            <div className="bg-brand-orange-50 border-l-4 border-brand-orange-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Second Offense</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Failure of the course</li>
                <li>Academic probation for remainder of enrollment</li>
                <li>Notation on academic transcript</li>
                <li>Possible suspension from program (1-6 months)</li>
              </ul>
            </div>

            <div className="bg-brand-red-50 border-l-4 border-brand-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Third Offense or Severe Violations</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Dismissal from the program</li>
                <li>Permanent notation on transcript</li>
                <li>Revocation of any credentials earned</li>
                <li>No refund of tuition or fees</li>
                <li>Ineligibility for re-enrollment</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Reporting Violations</h2>
            <p className="text-black mb-4">
              Students, instructors, and staff who suspect academic integrity violations should report them promptly:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Email: <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a></li>
              <li>Phone: (317) 314-3757</li>
              <li>In-person: Visit the Academic Affairs office</li>
              <li>Anonymous reporting available through student portal</li>
            </ul>
            <p className="text-black mb-6">
              All reports are investigated confidentially. Retaliation against individuals who report violations is prohibited.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Appeal Process</h2>
            <p className="text-black mb-4">
              Students have the right to appeal academic integrity decisions:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li>Submit written appeal within 10 business days of notification</li>
              <li>Include evidence and explanation supporting your position</li>
              <li>Appeal reviewed by Academic Integrity Committee</li>
              <li>Decision rendered within 15 business days</li>
              <li>Committee decision is final</li>
            </ol>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Resources and Support</h2>
            <p className="text-black mb-4">
              We provide resources to help students maintain academic integrity:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Citation guides and writing support through Learning Center</li>
              <li>Academic integrity training modules (required for all students)</li>
              <li>Tutoring and study skills workshops</li>
              <li>Instructor office hours for clarification on assignments</li>
              <li>Library resources for research and proper attribution</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Questions</h2>
            <p className="text-black mb-4">
              For questions about this policy or specific situations:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Email:</strong> <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a></li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
              <li><strong>Office Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST</li>
            </ul>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/student-code" className="text-brand-blue-600 hover:underline">Student Code of Conduct</a></li>
                <li><a href="/policies/ai-usage" className="text-brand-blue-600 hover:underline">AI Usage Policy</a></li>
                <li><a href="/policies/progress" className="text-brand-blue-600 hover:underline">Progress Policy</a></li>
                <li><a href="/policies/revocation" className="text-brand-blue-600 hover:underline">Credential Revocation Policy</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
