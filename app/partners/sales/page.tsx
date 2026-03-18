import { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';

export const metadata: Metadata = {
  title: 'LMS Licensing & API Access | Elevate for Humanity',
  description: 'License the Elevate LMS platform or request API access for your training organization. Workforce training technology built for WIOA, apprenticeships, and career certification programs.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/sales' },
};

export default function SalesPage() {
  return (
    <PublicLandingPage config={{
      breadcrumbs: [{ label: 'Partners', href: '/partners' }, { label: 'LMS Licensing & API' }],
      hero: {
        image: '/images/pages/lms-page-3.jpg',
        tag: 'LMS Licensing & API Access',
        tagColor: 'text-brand-blue-600',
        title: 'License the Elevate Platform',
        subtitle: 'Enrollment, learning management, career services, and compliance reporting — built specifically for WIOA-funded programs, apprenticeships, and career certification training.',
      },
      intro: {
        heading: 'Workforce Training Technology Built for the Field',
        paragraphs: [
          'The Elevate platform powers enrollment, learning management, career services, and compliance reporting for workforce training providers. It is built specifically for WIOA-funded programs, DOL Registered Apprenticeships, and career certification training — not adapted from a generic LMS.',
          'License the platform for your organization with your branding, programs, and workflows. We handle hosting, security, updates, and technical support. You focus on training.',
        ],
        image: '/images/pages/platform-page-4.jpg',
      },
      features: {
        heading: 'Platform Capabilities',
        items: [
          'Online enrollment and application processing with eligibility screening',
          'Learning management system with course builder and quiz engine',
          'Student progress tracking, checkpoint gating, and certification issuance',
          'Career services portal with resume builder and job matching',
          'Employer portal for job posting and certified candidate browsing',
          'WIOA and DOL compliance reporting with data exports',
          'Instructor portal for grading, attendance, and sign-off workflows',
          'Admin dashboard with analytics, cohort management, and audit logs',
          'API access for integration with case management and state systems',
          'White-label branding — your logo, colors, and domain',
        ],
      },
      steps: {
        heading: 'How Licensing Works',
        items: [
          { title: 'Request a Demo', desc: 'Contact us for a 30-minute walkthrough of the platform tailored to your program type.' },
          { title: 'Scope Your Build', desc: 'We identify which modules you need and configure the platform for your programs and workflows.' },
          { title: 'Sign the License Agreement', desc: 'We execute a licensing agreement covering hosting, support, data ownership, and pricing.' },
          { title: 'Go Live', desc: 'Your branded platform is live within 2–4 weeks. We provide onboarding and ongoing technical support.' },
        ],
      },
      cta: {
        heading: 'Request a Demo',
        subtitle: 'See the platform in action. Contact us for a walkthrough and pricing information.',
        primaryLabel: 'Request a Demo',
        primaryHref: '/contact',
        secondaryLabel: 'View Platform Features',
        secondaryHref: '/platform',
        bgColor: 'bg-brand-blue-700',
      },
    }} />
  );
}
