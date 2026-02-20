
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { FileText, Download, ChevronRight, UserPlus, Layout, Accessibility, MessageSquare, HelpCircle, Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Onboarding and User Experience Standards | Elevate For Humanity',
  description: 'User onboarding flows, accessibility standards, support channels, and UX guidelines for the platform.',
};

export default function OnboardingUXPage() {

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Onboarding Ux" }]} />
      </div>
<div className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/legal" className="hover:text-white">Legal</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Onboarding & UX</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Onboarding and User Experience Standards</h1>
          <p className="text-gray-300">User journeys, accessibility, support, and experience guidelines</p>
          <div className="flex items-center gap-6 mt-6 text-sm">
            <span className="flex items-center gap-2"><FileText className="w-4 h-4" />EFH-UX-001</span>
            <span>Version 1.0</span>
            <span>January 2025</span>
            <span>Owner: Director of Product</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-8 flex items-center justify-between">
          <div>
            <p className="font-medium text-teal-900">Official UX Standards Document</p>
            <p className="text-sm text-teal-700">Authoritative reference for onboarding, accessibility, and user experience.</p>
          </div>
          <a href="/docs/Onboarding_User_Experience_Standards.pdf" download className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
            <Download className="w-4 h-4" /> PDF
          </a>
        </div>

        <nav className="bg-gray-50 rounded-lg p-6 mb-10">
          <h2 className="font-semibold mb-4">Contents</h2>
          <ol className="space-y-2 text-sm">
            <li><a href="#purpose" className="text-teal-600 hover:underline">1. Purpose & Scope</a></li>
            <li><a href="#onboarding" className="text-teal-600 hover:underline">2. Onboarding Flows</a></li>
            <li><a href="#accessibility" className="text-teal-600 hover:underline">3. Accessibility Standards</a></li>
            <li><a href="#design" className="text-teal-600 hover:underline">4. Design System</a></li>
            <li><a href="#support" className="text-teal-600 hover:underline">5. Support Channels</a></li>
            <li><a href="#communication" className="text-teal-600 hover:underline">6. User Communication</a></li>
            <li><a href="#feedback" className="text-teal-600 hover:underline">7. Feedback & Improvement</a></li>
            <li><a href="#responsibilities" className="text-teal-600 hover:underline">8. Roles & Responsibilities</a></li>
            <li><a href="#versioning" className="text-teal-600 hover:underline">9. Versioning & Review</a></li>
          </ol>
        </nav>

        <section id="purpose" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Layout className="w-6 h-6 text-teal-600" />
            1. Purpose & Scope
          </h2>
          <h3 className="text-lg font-semibold mt-6 mb-3">1.1 Purpose</h3>
          <p className="text-gray-700 mb-4">This document establishes standards for user onboarding, accessibility, support, and overall user experience across all Elevate For Humanity platforms. It ensures consistent, accessible, and supportive experiences for all users.</p>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">1.2 Scope</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Account creation and onboarding flows</li>
            <li>Accessibility compliance and implementation</li>
            <li>Design system and UI consistency</li>
            <li>Support channels and response standards</li>
            <li>User communication and notifications</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">1.3 User Types</h3>
          <table className="w-full border-collapse border">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">User Type</th><th className="border p-3 text-left">Primary Journey</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Student</td><td className="border p-3">Course enrollment, learning, certification</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Instructor</td><td className="border p-3">Course creation, student management</td></tr>
              <tr><td className="border p-3">Tax Client</td><td className="border p-3">Tax prep, refund advance, document upload</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Store Customer</td><td className="border p-3">Browse, purchase, download</td></tr>
              <tr><td className="border p-3">Partner/Delegate</td><td className="border p-3">Student referral, reporting</td></tr>
            </tbody>
          </table>
        </section>

        <section id="onboarding" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-teal-600" />
            2. Onboarding Flows
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">2.1 Account Creation</h3>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>Entry Point:</strong> Clear CTA on homepage, contextual signup prompts</li>
            <li><strong>Information Collection:</strong> Minimal required fields (email, password, name)</li>
            <li><strong>Email Verification:</strong> Confirmation email within 1 minute</li>
            <li><strong>Profile Completion:</strong> Optional additional info, progressive disclosure</li>
            <li><strong>Welcome:</strong> Personalized welcome screen with next steps</li>
          </ol>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">2.2 Role-Specific Onboarding</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Role</th><th className="border p-3 text-left">Onboarding Steps</th><th className="border p-3 text-left">Time to Value</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Student</td><td className="border p-3">Interest selection → Course recommendations → First lesson</td><td className="border p-3">&lt;5 minutes</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Instructor</td><td className="border p-3">Credential verification → Platform training → First course draft</td><td className="border p-3">1-3 days</td></tr>
              <tr><td className="border p-3">Tax Client</td><td className="border p-3">Service selection → Document checklist → Appointment/upload</td><td className="border p-3">&lt;10 minutes</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Store Customer</td><td className="border p-3">Browse → Purchase → Download (no account required)</td><td className="border p-3">&lt;3 minutes</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">2.3 Onboarding Principles</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Progressive Disclosure:</strong> Show information as needed, not all at once</li>
            <li><strong>Quick Wins:</strong> Enable meaningful action within first session</li>
            <li><strong>Guidance:</strong> Tooltips, walkthroughs for new features</li>
            <li><strong>Recovery:</strong> Easy to resume if interrupted</li>
            <li><strong>Personalization:</strong> Tailor experience based on stated goals</li>
          </ul>
        </section>

        <section id="accessibility" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Accessibility className="w-6 h-6 text-teal-600" />
            3. Accessibility Standards
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.1 Compliance Target</h3>
          <p className="text-gray-700 mb-4">All platform components must meet <strong>WCAG 2.1 Level AA</strong> standards. This ensures accessibility for users with visual, auditory, motor, and cognitive disabilities.</p>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.2 Implementation Requirements</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Category</th><th className="border p-3 text-left">Requirements</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Visual</td><td className="border p-3">4.5:1 contrast ratio, resizable text, no color-only indicators</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Auditory</td><td className="border p-3">Captions for video, transcripts for audio, visual alerts</td></tr>
              <tr><td className="border p-3">Motor</td><td className="border p-3">Keyboard navigation, large click targets (44x44px), no time limits</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Cognitive</td><td className="border p-3">Clear language, consistent navigation, error prevention</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.3 Technical Implementation</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Semantic HTML (proper heading hierarchy, landmarks)</li>
            <li>ARIA labels for interactive elements</li>
            <li>Focus management for modals and dynamic content</li>
            <li>Skip links for main content</li>
            <li>Form labels and error messages associated with inputs</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">3.4 Testing & Validation</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Automated testing with axe-core on every deployment</li>
            <li>Manual testing with screen readers (NVDA, VoiceOver)</li>
            <li>Keyboard-only navigation testing</li>
            <li>Annual third-party accessibility audit</li>
            <li>User testing with people with disabilities</li>
          </ul>
        </section>

        <section id="design" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Settings className="w-6 h-6 text-teal-600" />
            4. Design System
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.1 Visual Identity</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>Primary Colors:</strong> Orange (#F97316), Gray (#1F2937)</li>
            <li><strong>Typography:</strong> Inter for UI, system fonts as fallback</li>
            <li><strong>Spacing:</strong> 4px base unit, consistent padding/margins</li>
            <li><strong>Border Radius:</strong> 8px for cards, 4px for buttons</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.2 Component Standards</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Component</th><th className="border p-3 text-left">Standards</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Buttons</td><td className="border p-3">Clear hierarchy (primary, secondary, ghost), loading states</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Forms</td><td className="border p-3">Labels above inputs, inline validation, clear error messages</td></tr>
              <tr><td className="border p-3">Navigation</td><td className="border p-3">Consistent placement, breadcrumbs for deep pages</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Cards</td><td className="border p-3">Consistent padding, clear visual hierarchy</td></tr>
              <tr><td className="border p-3">Modals</td><td className="border p-3">Focus trap, escape to close, clear actions</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">4.3 Responsive Design</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Mobile-first approach</li>
            <li>Breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)</li>
            <li>Touch-friendly targets on mobile (minimum 44x44px)</li>
            <li>Collapsible navigation on smaller screens</li>
          </ul>
        </section>

        <section id="support" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-teal-600" />
            5. Support Channels
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">5.1 Available Channels</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Channel</th><th className="border p-3 text-left">Availability</th><th className="border p-3 text-left">Response Time</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Help Center (Self-Service)</td><td className="border p-3">24/7</td><td className="border p-3">Immediate</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Email Support</td><td className="border p-3">24/7 submission</td><td className="border p-3">&lt;24 hours</td></tr>
              <tr><td className="border p-3">Live Chat</td><td className="border p-3">9am-6pm EST, Mon-Fri</td><td className="border p-3">&lt;5 minutes</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Phone Support</td><td className="border p-3">9am-5pm EST, Mon-Fri</td><td className="border p-3">&lt;2 minutes wait</td></tr>
              <tr><td className="border p-3">Community Forum</td><td className="border p-3">24/7</td><td className="border p-3">Varies (peer support)</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">5.2 Support Tiers</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>Tier 1:</strong> General inquiries, account issues, basic troubleshooting</li>
            <li><strong>Tier 2:</strong> Technical issues, billing disputes, complex problems</li>
            <li><strong>Tier 3:</strong> Engineering escalation, security issues, executive escalation</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">5.3 Service Level Agreements</h3>
          <table className="w-full border-collapse border">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Priority</th><th className="border p-3 text-left">Description</th><th className="border p-3 text-left">Resolution Target</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Critical</td><td className="border p-3">Platform down, security breach</td><td className="border p-3">4 hours</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">High</td><td className="border p-3">Feature broken, payment issues</td><td className="border p-3">24 hours</td></tr>
              <tr><td className="border p-3">Medium</td><td className="border p-3">Non-blocking issues, questions</td><td className="border p-3">48 hours</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Low</td><td className="border p-3">Feature requests, minor issues</td><td className="border p-3">5 business days</td></tr>
            </tbody>
          </table>
        </section>

        <section id="communication" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-teal-600" />
            6. User Communication
          </h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">6.1 Email Communication</h3>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Type</th><th className="border p-3 text-left">Purpose</th><th className="border p-3 text-left">Opt-Out</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Transactional</td><td className="border p-3">Order confirmations, password resets, security alerts</td><td className="border p-3">Cannot opt out</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Service</td><td className="border p-3">Course updates, deadline reminders, account changes</td><td className="border p-3">Limited opt-out</td></tr>
              <tr><td className="border p-3">Marketing</td><td className="border p-3">Promotions, new courses, newsletters</td><td className="border p-3">Full opt-out</td></tr>
            </tbody>
          </table>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">6.2 In-App Notifications</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Non-intrusive notification center</li>
            <li>Categorized by type (courses, account, promotions)</li>
            <li>User-controllable preferences</li>
            <li>Clear, actionable messages</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">6.3 Communication Standards</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Clear, jargon-free language</li>
            <li>Personalized where appropriate (name, relevant content)</li>
            <li>Mobile-optimized email templates</li>
            <li>Unsubscribe link in all marketing emails</li>
            <li>CAN-SPAM and GDPR compliant</li>
          </ul>
        </section>

        <section id="feedback" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Feedback & Improvement</h2>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">7.1 Feedback Collection</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li><strong>In-App Feedback:</strong> Contextual feedback buttons throughout platform</li>
            <li><strong>NPS Surveys:</strong> Quarterly Net Promoter Score surveys</li>
            <li><strong>Course Ratings:</strong> Post-completion course and instructor ratings</li>
            <li><strong>Support Feedback:</strong> Post-interaction satisfaction surveys</li>
            <li><strong>User Research:</strong> Periodic interviews and usability testing</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">7.2 Feedback Processing</h3>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-4">
            <li>All feedback logged and categorized</li>
            <li>Weekly review of feedback themes</li>
            <li>Prioritization based on impact and frequency</li>
            <li>Roadmap integration for validated improvements</li>
            <li>Close-the-loop communication for implemented suggestions</li>
          </ol>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">7.3 Success Metrics</h3>
          <table className="w-full border-collapse border">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Metric</th><th className="border p-3 text-left">Target</th><th className="border p-3 text-left">Measurement</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">NPS Score</td><td className="border p-3">&gt;50</td><td className="border p-3">Quarterly survey</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">CSAT (Support)</td><td className="border p-3">&gt;90%</td><td className="border p-3">Post-interaction survey</td></tr>
              <tr><td className="border p-3">Onboarding Completion</td><td className="border p-3">&gt;80%</td><td className="border p-3">Analytics tracking</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Time to First Value</td><td className="border p-3">&lt;5 minutes</td><td className="border p-3">Analytics tracking</td></tr>
              <tr><td className="border p-3">Accessibility Score</td><td className="border p-3">&gt;95%</td><td className="border p-3">Automated testing</td></tr>
            </tbody>
          </table>
        </section>

        <section id="responsibilities" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Roles & Responsibilities</h2>
          <table className="w-full border-collapse border">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Role</th><th className="border p-3 text-left">Responsibilities</th></tr></thead>
            <tbody>
              <tr><td className="border p-3">Director of Product</td><td className="border p-3">Overall UX strategy, standards ownership, roadmap</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">UX Designer</td><td className="border p-3">Design system, user research, accessibility compliance</td></tr>
              <tr><td className="border p-3">Frontend Engineers</td><td className="border p-3">Implementation, accessibility testing, performance</td></tr>
              <tr className="bg-gray-50"><td className="border p-3">Support Manager</td><td className="border p-3">Support operations, SLA compliance, team training</td></tr>
              <tr><td className="border p-3">Content Team</td><td className="border p-3">Help center content, communication templates</td></tr>
            </tbody>
          </table>
        </section>

        <section id="versioning" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Versioning & Review</h2>
          <table className="w-full border-collapse border mb-4">
            <thead><tr className="bg-gray-100"><th className="border p-3 text-left">Version</th><th className="border p-3 text-left">Date</th><th className="border p-3 text-left">Changes</th></tr></thead>
            <tbody><tr><td className="border p-3">1.0</td><td className="border p-3">January 2025</td><td className="border p-3">Initial authoritative version</td></tr></tbody>
          </table>
          <p className="text-gray-700"><strong>Review Schedule:</strong> Bi-annually, or upon significant platform changes or accessibility standard updates.</p>
        </section>

        <footer className="mt-12 pt-8 border-t text-sm text-gray-500">
          <p><strong>Document ID:</strong> EFH-UX-001 | <strong>Owner:</strong> Director of Product</p>
          <p className="mt-2">© 2025 Elevate For Humanity. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
