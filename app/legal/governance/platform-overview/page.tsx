import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { FileText, Download, ChevronRight, Building2, Users, Shield, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Platform Overview and Governance | Elevate For Humanity',
  description: 'Comprehensive overview of the Elevate For Humanity platform architecture, governance model, and operational standards.',
};

export default function PlatformOverviewPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Platform Overview" }]} />
      </div>
{/* Document Header */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/legal" className="hover:text-white">Legal</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Platform Overview</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Platform Overview and Governance</h1>
          <p className="text-gray-300">Authoritative reference for platform architecture, user roles, and governance model</p>
          <div className="flex items-center gap-6 mt-6 text-sm">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Document ID: EFH-GOV-001
            </span>
            <span>Version 1.0</span>
            <span>Last Updated: January 2025</span>
            <span>Owner: Executive Leadership</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Download Banner */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8 flex items-center justify-between">
          <div>
            <p className="font-medium text-orange-900">Official Document</p>
            <p className="text-sm text-orange-700">This is the authoritative version. All other references must align with this document.</p>
          </div>
          <a href="/docs/Platform_Overview_and_Governance.pdf" download
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
            <Download className="w-4 h-4" /> Download PDF
          </a>
        </div>

        {/* Table of Contents */}
        <div className="bg-gray-50 rounded-lg p-6 mb-10">
          <h2 className="font-semibold mb-4">Table of Contents</h2>
          <ol className="space-y-2 text-sm">
            <li><a href="#purpose" className="text-orange-600 hover:underline">1. Purpose and Scope</a></li>
            <li><a href="#components" className="text-orange-600 hover:underline">2. Platform Components</a></li>
            <li><a href="#users" className="text-orange-600 hover:underline">3. User Types and Roles</a></li>
            <li><a href="#governance" className="text-orange-600 hover:underline">4. Governance Model</a></li>
            <li><a href="#content" className="text-orange-600 hover:underline">5. Content and Language Controls</a></li>
            <li><a href="#versioning" className="text-orange-600 hover:underline">6. Versioning and Review Cadence</a></li>
          </ol>
        </div>

        {/* Section 1 */}
        <section id="purpose" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-sm font-bold">1</span>
            Purpose and Scope
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">1.1 Purpose</h3>
          <p className="text-gray-700 mb-4">
            This document establishes the authoritative reference for the Elevate For Humanity platform ecosystem. It defines what the platform is, how it operates, who uses it, and how decisions are made. All other documentation, marketing materials, and operational procedures must align with this document.
          </p>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">1.2 Scope</h3>
          <p className="text-gray-700 mb-4">This document covers:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>The complete Elevate For Humanity platform ecosystem</li>
            <li>All user-facing applications and services</li>
            <li>Administrative and operational systems</li>
            <li>Third-party integrations that affect user experience</li>
          </ul>
          
          <p className="text-gray-700 mb-4">This document does not cover:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Internal HR policies (separate document)</li>
            <li>Financial accounting procedures (separate document)</li>
            <li>Physical facility operations (separate document)</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3">1.3 Audience</h3>
          <p className="text-gray-700">
            This document is intended for: executive leadership, board members, regulatory reviewers, enterprise partners, government agency buyers, auditors, and senior operational staff. It may be shared externally upon request.
          </p>
        </section>

        {/* Section 2 */}
        <section id="components" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-sm font-bold">2</span>
            Platform Components
          </h2>

          <p className="text-gray-700 mb-6">
            The Elevate For Humanity platform consists of four integrated components, each serving distinct functions while sharing common infrastructure, authentication, and data governance.
          </p>

          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="w-6 h-6 text-orange-600" />
                <h3 className="text-lg font-semibold">2.1 Main Website (elevateforhumanity.org)</h3>
              </div>
              <p className="text-gray-700 mb-3"><strong>Function:</strong> Public-facing information, program discovery, application intake, and organizational communication.</p>
              <p className="text-gray-700 mb-3"><strong>Primary Users:</strong> Prospective students, employers, partners, general public.</p>
              <p className="text-gray-700"><strong>Key Capabilities:</strong> Program catalog, eligibility screening, application submission, event registration, resource library, contact and support.</p>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold">2.2 Learning Management System (LMS)</h3>
              </div>
              <p className="text-gray-700 mb-3"><strong>Function:</strong> Course delivery, student progress tracking, assessments, certifications, and instructor management.</p>
              <p className="text-gray-700 mb-3"><strong>Primary Users:</strong> Enrolled students, instructors, program administrators, partner organizations.</p>
              <p className="text-gray-700"><strong>Key Capabilities:</strong> Course content delivery, video lessons, quizzes and assessments, progress tracking, certificate generation, attendance recording, grade management.</p>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold">2.3 Store (E-Commerce)</h3>
              </div>
              <p className="text-gray-700 mb-3"><strong>Function:</strong> Product sales, course purchases, program enrollment payments, and merchandise.</p>
              <p className="text-gray-700 mb-3"><strong>Primary Users:</strong> Students, employers, general customers.</p>
              <p className="text-gray-700"><strong>Key Capabilities:</strong> Product catalog, shopping cart, secure checkout (Stripe), order management, digital delivery, refund processing.</p>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold">2.4 Supersonic Fast Cash (Tax Services)</h3>
              </div>
              <p className="text-gray-700 mb-3"><strong>Function:</strong> Tax preparation services and optional refund advance products.</p>
              <p className="text-gray-700 mb-3"><strong>Primary Users:</strong> Tax clients (students and community members).</p>
              <p className="text-gray-700 mb-3"><strong>Key Capabilities:</strong> Tax intake, document collection, return preparation, e-filing, refund tracking, optional refund advance application.</p>
              <p className="text-gray-700"><strong>Legal Entity:</strong> Operated by Supersonic Fast Cash LLC, a separate legal entity. See Tax Preparation and Refund Advance Operations document for complete details.</p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section id="users" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-sm font-bold">3</span>
            User Types and Roles
          </h2>

          <p className="text-gray-700 mb-6">
            The platform implements role-based access control. Each user is assigned exactly one primary role that determines their permissions and available features.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-3 text-left">Role</th>
                  <th className="border p-3 text-left">Description</th>
                  <th className="border p-3 text-left">Access Level</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3 font-medium">Student</td>
                  <td className="border p-3">Enrolled learner in one or more programs</td>
                  <td className="border p-3">Own courses, progress, certificates, profile</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border p-3 font-medium">Instructor</td>
                  <td className="border p-3">Course creator and facilitator</td>
                  <td className="border p-3">Assigned courses, enrolled students, grading</td>
                </tr>
                <tr>
                  <td className="border p-3 font-medium">Staff</td>
                  <td className="border p-3">Operational team member</td>
                  <td className="border p-3">Student management, attendance, reports</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border p-3 font-medium">Delegate</td>
                  <td className="border p-3">Partner organization representative</td>
                  <td className="border p-3">Referred students, partnership reports</td>
                </tr>
                <tr>
                  <td className="border p-3 font-medium">Program Holder</td>
                  <td className="border p-3">Licensed program operator</td>
                  <td className="border p-3">Program analytics, student outcomes, revenue</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border p-3 font-medium">Admin</td>
                  <td className="border p-3">Platform administrator</td>
                  <td className="border p-3">All operational functions, user management</td>
                </tr>
                <tr>
                  <td className="border p-3 font-medium">Super Admin</td>
                  <td className="border p-3">System owner with full access</td>
                  <td className="border p-3">All functions including system configuration</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-3">3.1 Role Assignment</h3>
          <p className="text-gray-700 mb-4">
            Roles are assigned during account creation or by an administrator. Role changes require administrative approval and are logged in the audit trail. Users cannot self-assign elevated roles.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-3">3.2 Role Separation</h3>
          <p className="text-gray-700">
            Financial operations (refunds, payouts) require Admin or Super Admin role. Student data access is limited to staff with legitimate educational interest. Personal data exports require identity verification.
          </p>
        </section>

        {/* Section 4 */}
        <section id="governance" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-sm font-bold">4</span>
            Governance Model
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3">4.1 Decision Authority</h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-3 text-left">Decision Type</th>
                  <th className="border p-3 text-left">Authority</th>
                  <th className="border p-3 text-left">Review Required</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3">New program launch</td>
                  <td className="border p-3">Executive Leadership</td>
                  <td className="border p-3">Board notification</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border p-3">Pricing changes</td>
                  <td className="border p-3">Executive Leadership</td>
                  <td className="border p-3">Finance review</td>
                </tr>
                <tr>
                  <td className="border p-3">Policy updates</td>
                  <td className="border p-3">Compliance Owner</td>
                  <td className="border p-3">Legal review</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border p-3">Course content changes</td>
                  <td className="border p-3">Program Director</td>
                  <td className="border p-3">Quality review</td>
                </tr>
                <tr>
                  <td className="border p-3">User role elevation</td>
                  <td className="border p-3">Admin</td>
                  <td className="border p-3">Audit log</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border p-3">Data deletion requests</td>
                  <td className="border p-3">Data Protection Officer</td>
                  <td className="border p-3">Compliance verification</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-3">4.2 Change Management</h3>
          <p className="text-gray-700 mb-4">
            All platform changes follow a defined process: proposal, review, approval, implementation, verification. Changes affecting user data, payments, or compliance require documented approval before deployment.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-3">4.3 Audit and Accountability</h3>
          <p className="text-gray-700">
            The platform maintains audit logs for: user authentication events, role changes, data access, payment transactions, and administrative actions. Logs are retained for 7 years and are available for regulatory review upon request.
          </p>
        </section>

        {/* Section 5 */}
        <section id="content" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-sm font-bold">5</span>
            Content and Language Controls
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3">5.1 Claims Policy</h3>
          <p className="text-gray-700 mb-4">
            All public claims about outcomes, success rates, or benefits must be: (a) supported by documented evidence, (b) scoped to specific programs and time periods, (c) include appropriate disclaimers, and (d) reviewed by the Compliance Owner before publication.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-3">5.2 Prohibited Language</h3>
          <p className="text-gray-700 mb-4">The following are prohibited in any user-facing content:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Guaranteed outcomes without qualification</li>
            <li>Income claims without documented basis</li>
            <li>Comparison claims without evidence</li>
            <li>Urgency tactics that create false scarcity</li>
            <li>Testimonials without verification</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3">5.3 Required Disclosures</h3>
          <p className="text-gray-700">
            Specific disclosures are required for: eligibility-restricted programs, payment plans, refund policies, certification requirements, and employment assistance limitations. See Compliance and Disclosure Framework for complete requirements.
          </p>
        </section>

        {/* Section 6 */}
        <section id="versioning" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-sm font-bold">6</span>
            Versioning and Review Cadence
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3">6.1 Document Control</h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-3 text-left">Version</th>
                  <th className="border p-3 text-left">Date</th>
                  <th className="border p-3 text-left">Author</th>
                  <th className="border p-3 text-left">Changes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3">1.0</td>
                  <td className="border p-3">January 2025</td>
                  <td className="border p-3">Executive Leadership</td>
                  <td className="border p-3">Initial authoritative version</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-3">6.2 Review Schedule</h3>
          <p className="text-gray-700 mb-4">
            This document is reviewed: (a) annually as part of governance review, (b) upon significant platform changes, (c) upon regulatory or legal developments affecting operations, (d) upon request by board or external auditors.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-3">6.3 Amendment Process</h3>
          <p className="text-gray-700">
            Amendments require: written proposal, Executive Leadership review, legal review for compliance sections, board notification for material changes, and version increment with change log entry.
          </p>
        </section>

        {/* Related Documents */}
        <section className="border-t pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Related Documents</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/legal/governance/security" className="block p-4 border rounded-lg hover:bg-gray-50">
              <p className="font-medium">Security and Data Protection Statement</p>
              <p className="text-sm text-gray-500">EFH-SEC-001</p>
            </Link>
            <Link href="/legal/governance/compliance" className="block p-4 border rounded-lg hover:bg-gray-50">
              <p className="font-medium">Compliance and Disclosure Framework</p>
              <p className="text-sm text-gray-500">EFH-CMP-001</p>
            </Link>
            <Link href="/legal/governance/lms" className="block p-4 border rounded-lg hover:bg-gray-50">
              <p className="font-medium">LMS Governance and Course Standards</p>
              <p className="text-sm text-gray-500">EFH-LMS-001</p>
            </Link>
            <Link href="/legal/governance/store" className="block p-4 border rounded-lg hover:bg-gray-50">
              <p className="font-medium">Store, Payments, and Licensing Framework</p>
              <p className="text-sm text-gray-500">EFH-PAY-001</p>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t text-sm text-gray-500">
          <p><strong>Document ID:</strong> EFH-GOV-001</p>
          <p><strong>Classification:</strong> Internal / Shareable upon request</p>
          <p><strong>Owner:</strong> Executive Leadership, Elevate For Humanity</p>
          <p><strong>Contact:</strong> elevate4humanityedu@gmail.com</p>
          <p className="mt-4">© 2025 Elevate For Humanity. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
