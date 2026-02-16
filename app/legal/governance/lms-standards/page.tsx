import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { FileText, Download, ChevronRight, BookOpen, Award, Users, Clock, Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LMS Governance and Course Standards | Elevate For Humanity',
  description: 'Course creation standards, instructor requirements, certification policies, and learning management governance.',
};

export default function LMSStandardsPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Lms Standards" }]} />
      </div>
<div className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/legal" className="hover:text-white">Legal</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">LMS Standards</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">LMS Governance and Course Standards</h1>
          <p className="text-gray-300">Course creation, instructor requirements, and certification policies</p>
          <div className="flex items-center gap-6 mt-6 text-sm">
            <span className="flex items-center gap-2"><FileText className="w-4 h-4" />EFH-LMS-001</span>
            <span>Version 1.0</span>
            <span>January 2025</span>
            <span>Owner: Director of Education</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex items-center justify-between">
          <div>
            <p className="font-medium text-green-900">Official LMS Standards Document</p>
            <p className="text-sm text-green-700">Authoritative reference for course creation and educational governance.</p>
          </div>
          <a href="/docs/LMS_Governance_and_Course_Standards.pdf" download className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Download className="w-4 h-4" /> PDF
          </a>
        </div>

        <nav className="bg-gray-50 rounded-lg p-6 mb-10">
          <h2 className="font-semibold mb-4">Contents</h2>
          <ol className="space-y-2 text-sm">
            <li><a href="#purpose" className="text-green-600 hover:underline">1. Purpose & Scope</a></li>
            <li><a href="#course-types" className="text-green-600 hover:underline">2. Course Types & Structure</a></li>
            <li><a href="#creation" className="text-green-600 hover:underline">3. Course Creation Standards</a></li>
            <li><a href="#instructors" className="text-green-600 hover:underline">4. Instructor Requirements</a></li>
            <li><a href="#certification" className="text-green-600 hover:underline">5. Certification & Credentials</a></li>
            <li><a href="#quality" className="text-green-600 hover:underline">6. Quality Assurance</a></li>
            <li><a href="#student-policies" className="text-green-600 hover:underline">7. Student Policies</a></li>
            <li><a href="#responsibilities" className="text-green-600 hover:underline">8. Roles & Responsibilities</a></li>
            <li><a href="#versioning" className="text-green-600 hover:underline">9. Versioning & Review</a></li>
          </ol>
        </nav>

        <section id="purpose" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-green-600" />
            1. Purpose & Scope
          </h2>
          <h3 className="text-lg font-semibold mt-6 mb-3">1.1 Purpose</h3>
          <p className="text-gray-700 mb-4">This document establishes standards for course creation, instructor qualifications, certification issuance, and overall learning management system governance. It ensures consistent quality across all educational offerings.</p>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">1.2 Scope</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>All courses hosted on the Elevate For Humanity LMS</li>
            <li>Instructor onboarding and ongoing requirements</li>
            <li>Certification and credential issuance</li>
            <li>Student enrollment, progress tracking, and completion</li>
            <li>Content quality and accessibility standards</li>
          </ul>
        </section>

        <section id="course-types" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Settings className="w-6 h-6 text-green-600" />
            2. Course Types & Structure
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">2.1 Course Categories</h3>
          <table className="w-full border-collapse border mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Category</th>
                <th className="border p-3 text-left">Description</th>
                <th className="border p-3 text-left">Typical Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border p-3">Tax Preparation</td><td className="border p-3">IRS-compliant tax preparer training</td><td className="border p-3">40-80 hours</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Financial Literacy</td><td className="border p-3">Personal finance, budgeting, credit</td><td className="border p-3">10-20 hours</td></tr>
              <tr><td className="border p-3">Professional Development</td><td className="border p-3">Career skills, entrepreneurship</td><td className="border p-3">5-40 hours</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Technology</td><td className="border p-3">Digital skills, software training</td><td className="border p-3">10-60 hours</td></tr>
              <tr><td className="border p-3">Continuing Education</td><td className="border p-3">CE credits for licensed professionals</td><td className="border p-3">2-16 hours</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">2.2 Course Structure Requirements</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Modules:</strong> Courses divided into logical modules (3-10 per course)</li>
            <li><strong>Lessons:</strong> Each module contains 3-8 lessons (15-45 minutes each)</li>
            <li><strong>Assessments:</strong> Minimum one quiz per module, final assessment required</li>
            <li><strong>Resources:</strong> Downloadable materials, reference guides, supplementary content</li>
          </ul>
        </section>

        <section id="creation" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="text-slate-400 flex-shrink-0">•</span>
            3. Course Creation Standards
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.1 Content Requirements</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>Learning Objectives:</strong> Clear, measurable objectives for each module</li>
            <li><strong>Accuracy:</strong> All content fact-checked and current</li>
            <li><strong>Originality:</strong> Original content or properly licensed materials</li>
            <li><strong>Accessibility:</strong> WCAG 2.1 AA compliant (captions, transcripts, alt text)</li>
            <li><strong>Language:</strong> Clear, professional English; reading level appropriate to audience</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.2 Media Standards</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Media Type</th><th className="border p-3 text-left">Requirements</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Video</td><td className="border p-3">1080p minimum, clear audio, closed captions required</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Audio</td><td className="border p-3">Clear quality, transcript provided</td></tr>
              <tr><td className="border p-3">Images</td><td className="border p-3">High resolution, alt text required, proper licensing</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Documents</td><td className="border p-3">PDF format, accessible (tagged), printable</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.3 Assessment Standards</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Questions aligned with stated learning objectives</li>
            <li>Minimum 70% passing score for certifications</li>
            <li>Question bank with randomization for retakes</li>
            <li>Clear feedback for incorrect answers</li>
            <li>Time limits appropriate to content complexity</li>
          </ul>
        </section>

        <section id="instructors" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Users className="w-6 h-6 text-green-600" />
            4. Instructor Requirements
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.1 Qualification Requirements</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Course Category</th><th className="border p-3 text-left">Minimum Qualifications</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Tax Preparation</td><td className="border p-3">Active PTIN, 3+ years experience, IRS Annual Filing Season Program or EA/CPA</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Financial Literacy</td><td className="border p-3">Relevant certification (CFP, AFC) or 5+ years industry experience</td></tr>
              <tr><td className="border p-3">Professional Development</td><td className="border p-3">Demonstrated expertise, professional credentials in subject area</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Technology</td><td className="border p-3">Industry certifications or 3+ years professional experience</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.2 Instructor Onboarding</h3>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-4">
            <li>Application with credentials and sample content</li>
            <li>Background check (for courses involving minors or financial topics)</li>
            <li>Platform training (LMS tools, accessibility requirements)</li>
            <li>Content review and approval process</li>
            <li>Agreement to Instructor Terms and Code of Conduct</li>
          </ol>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.3 Ongoing Requirements</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Maintain active credentials/licenses</li>
            <li>Update course content annually (or as regulations change)</li>
            <li>Respond to student questions within 48 hours</li>
            <li>Maintain minimum 4.0 rating (5-point scale)</li>
            <li>Complete annual platform training updates</li>
          </ul>
        </section>

        <section id="certification" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Award className="w-6 h-6 text-green-600" />
            5. Certification & Credentials
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">5.1 Certificate Types</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Type</th><th className="border p-3 text-left">Requirements</th><th className="border p-3 text-left">Validity</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Completion Certificate</td><td className="border p-3">100% course completion</td><td className="border p-3">Permanent</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Achievement Certificate</td><td className="border p-3">Completion + 70% assessment score</td><td className="border p-3">Permanent</td></tr>
              <tr><td className="border p-3">Professional Certification</td><td className="border p-3">Completion + 80% assessment + practical component</td><td className="border p-3">1-3 years (renewal required)</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">CE Credits</td><td className="border p-3">Per accrediting body requirements</td><td className="border p-3">Per accrediting body</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">5.2 Certificate Contents</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Student name (as registered)</li>
            <li>Course title and description</li>
            <li>Completion date</li>
            <li>Hours completed</li>
            <li>Unique certificate ID (verifiable)</li>
            <li>Issuing organization (Elevate For Humanity)</li>
            <li>Instructor name (for instructor-led courses)</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">5.3 Verification</h3>
          <p className="text-gray-700">All certificates include a unique ID and QR code linking to verification page. Employers and institutions can verify certificate authenticity at elevateforhumanity.org/verify.</p>
        </section>

        <section id="quality" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="text-slate-400 flex-shrink-0">•</span>
            6. Quality Assurance
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">6.1 Course Review Process</h3>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>Initial Review:</strong> Content accuracy, alignment with objectives</li>
            <li><strong>Technical Review:</strong> Media quality, accessibility compliance</li>
            <li><strong>Pilot Testing:</strong> Beta testing with sample students</li>
            <li><strong>Final Approval:</strong> Director of Education sign-off</li>
          </ol>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">6.2 Ongoing Quality Metrics</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Metric</th><th className="border p-3 text-left">Target</th><th className="border p-3 text-left">Action if Below</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Completion Rate</td><td className="border p-3">&gt;60%</td><td className="border p-3">Content review, engagement analysis</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Student Rating</td><td className="border p-3">&gt;4.0/5.0</td><td className="border p-3">Instructor coaching, content revision</td></tr>
              <tr><td className="border p-3">Assessment Pass Rate</td><td className="border p-3">70-90%</td><td className="border p-3">Question review (too easy/hard)</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Support Tickets</td><td className="border p-3">&lt;5% of enrollments</td><td className="border p-3">UX review, content clarification</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">6.3 Content Updates</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Annual review of all courses</li>
            <li>Immediate updates for regulatory changes (tax law, compliance)</li>
            <li>Quarterly review of student feedback</li>
            <li>Version control for all course materials</li>
          </ul>
        </section>

        <section id="student-policies" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Clock className="w-6 h-6 text-green-600" />
            7. Student Policies
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">7.1 Enrollment</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Account required for enrollment</li>
            <li>Prerequisites clearly stated and enforced where applicable</li>
            <li>Enrollment confirmation with course access details</li>
            <li>14-day refund window (if &lt;20% completed)</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">7.2 Progress & Completion</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Progress saved automatically</li>
            <li>Course access for 12 months from enrollment (or as specified)</li>
            <li>Completion requires viewing all content and passing assessments</li>
            <li>Certificate issued within 24 hours of completion</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">7.3 Academic Integrity</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Assessments must be completed independently</li>
            <li>Sharing assessment answers prohibited</li>
            <li>Identity verification for professional certifications</li>
            <li>Violations result in certificate revocation and account suspension</li>
          </ul>
        </section>

        <section id="responsibilities" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Roles & Responsibilities</h2>
          <table className="w-full border-collapse border">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Role</th><th className="border p-3 text-left">Responsibilities</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Director of Education</td><td className="border p-3">Overall LMS governance, course approval, quality standards</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Content Manager</td><td className="border p-3">Course review, accessibility compliance, content updates</td></tr>
              <tr><td className="border p-3">Instructors</td><td className="border p-3">Course creation, student support, content maintenance</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Student Support</td><td className="border p-3">Enrollment issues, technical support, refund processing</td></tr>
              <tr><td className="border p-3">Technical Team</td><td className="border p-3">Platform maintenance, feature development, integrations</td></tr>
            </tbody>
          </table>
        </section>

        <section id="versioning" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Versioning & Review</h2>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Version</th><th className="border p-3 text-left">Date</th><th className="border p-3 text-left">Changes</th></tr></thead>
            <tbody><tr><td className="border p-3">1.0</td><td className="border p-3">January 2025</td><td className="border p-3">Initial authoritative version</td></tr></tbody>
          </table>
          <p className="text-gray-700"><strong>Review Schedule:</strong> Annually, or upon significant changes to educational offerings or accreditation requirements.</p>
        </section>

        <footer className="mt-12 pt-8 border-t text-sm text-gray-500">
          <p><strong>Document ID:</strong> EFH-LMS-001 | <strong>Owner:</strong> Director of Education</p>
          <p className="mt-2">© 2025 Elevate For Humanity. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
