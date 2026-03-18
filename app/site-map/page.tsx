import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sitemap | Elevate for Humanity',
  description: 'Browse all pages and features of the Elevate for Humanity platform.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/site-map',
  },
};

const sitemapSections = [
  {
    title: 'Training Programs',
    links: [
      { name: 'All Programs', href: '/programs' },
      { name: 'Healthcare', href: '/programs/healthcare' },
      { name: 'CNA Training', href: '/programs/cna' },
      { name: 'Skilled Trades', href: '/programs/skilled-trades' },
      { name: 'CDL Training', href: '/programs/cdl-training' },
      { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
      { name: 'Cosmetology', href: '/programs/cosmetology-apprenticeship' },
      { name: 'Tax Preparation', href: '/programs/tax-preparation' },
      { name: 'Technology', href: '/programs/technology' },
      { name: 'Apprenticeships', href: '/programs/apprenticeships' },
    ],
  },
  {
    title: 'Tax Services',
    links: [
      { name: 'Tax Services Overview', href: '/tax' },
      { name: 'SupersonicFastCash', href: '/supersonic-fast-cash' },
      { name: 'SupersonicFastCash Pricing', href: '/supersonic-fast-cash/pricing' },
      { name: 'SupersonicFastCash Services', href: '/supersonic-fast-cash/services' },
      { name: 'SupersonicFastCash Locations', href: '/supersonic-fast-cash/locations' },
      { name: 'SupersonicFastCash Careers', href: '/supersonic-fast-cash/careers' },
    ],
  },
  {
    title: 'Rise Foundation',
    links: [
      { name: 'Rise Foundation Home', href: '/rise-foundation' },
      { name: 'Programs', href: '/rise-foundation/programs' },
      { name: 'Trauma Recovery', href: '/rise-foundation/trauma-recovery' },
      { name: 'Addiction Rehabilitation', href: '/rise-foundation/addiction-rehabilitation' },
      { name: 'Divorce Support', href: '/rise-foundation/divorce-support' },
      { name: 'Events', href: '/rise-foundation/events' },
      { name: 'Get Involved', href: '/rise-foundation/get-involved' },
      { name: 'Donate', href: '/rise-foundation/donate' },
    ],
  },
  {
    title: 'For Students',
    links: [
      { name: 'Apply Now', href: '/apply' },
      { name: 'Student Application', href: '/apply/student' },
      { name: 'WIOA Eligibility', href: '/wioa-eligibility' },
      { name: 'Funding Options', href: '/funding' },
      { name: 'Financial Aid', href: '/financial-aid' },
      { name: 'Student Portal', href: '/student-portal' },
      { name: 'Course Catalog', href: '/courses' },
      { name: 'Career Services', href: '/career-services' },
      { name: 'Student Handbook', href: '/student-handbook' },
    ],
  },
  {
    title: 'For Employers',
    links: [
      { name: 'Employer Overview', href: '/employers' },
      { name: 'Hire Graduates', href: '/hire-graduates' },
      { name: 'Post a Job', href: '/employers/post-job' },
      { name: 'Employer Portal', href: '/employer/dashboard' },
      { name: 'Host Apprentices', href: '/employers/apprenticeships' },
      { name: 'Employer Benefits', href: '/employers/benefits' },
      { name: 'Workforce Partners', href: '/workforce-partners' },
    ],
  },
  {
    title: 'Platform & LMS',
    links: [
      { name: 'Platform Overview', href: '/platform' },
      { name: 'Course Catalog', href: '/courses' },
      { name: 'Community Hub', href: '/community' },
      { name: 'Store Demos', href: '/store/demos' },
    ],
  },
  {
    title: 'Store & Licensing',
    links: [
      { name: 'Store', href: '/store' },
      { name: 'Licensing', href: '/store/licensing' },
      { name: 'License Pricing', href: '/license/pricing' },
      { name: 'Franchise', href: '/franchise' },
    ],
  },
  {
    title: 'Career Services',
    links: [
      { name: 'Career Services Overview', href: '/career-services' },
      { name: 'Resume Building', href: '/career-services/resume-building' },
      { name: 'Interview Prep', href: '/career-services/interview-prep' },
      { name: 'Job Placement', href: '/career-services/job-placement' },
      { name: 'Career Counseling', href: '/career-services/career-counseling' },
      { name: 'Networking Events', href: '/career-services/networking-events' },
      { name: 'Ongoing Support', href: '/career-services/ongoing-support' },
    ],
  },
  {
    title: 'Funding & Grants',
    links: [
      { name: 'Funding Overview', href: '/funding' },
      { name: 'WIOA Funding', href: '/funding/wioa' },
      { name: 'JRI Funding', href: '/funding/jri' },
      { name: 'DOL Programs', href: '/funding/dol' },
      { name: 'Federal Programs', href: '/funding/federal-programs' },
      { name: 'State Programs', href: '/funding/state-programs' },
      { name: 'Grant Programs', href: '/funding/grant-programs' },
      { name: 'WRG', href: '/funding/wrg' },
    ],
  },
  {
    title: 'Partners',
    links: [
      { name: 'Training Providers', href: '/partners/training-provider' },
      { name: 'Partner Portal', href: '/partners/portal' },
      { name: 'Workforce Partners', href: '/workforce-partners' },
      { name: 'Partner Application', href: '/partner/apply' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'FAQ', href: '/faq' },
      /* Blog hidden until posts are published */
      { name: 'Help Center', href: '/support/help' },
      { name: 'Calendar', href: '/calendar' },
      { name: 'Events', href: '/events' },
      { name: 'Webinars', href: '/webinars' },
      { name: 'News', href: '/news' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About Us', href: '/about' },
      { name: 'Leadership Team', href: '/about/team' },
      { name: 'Meet the Founder', href: '/founder' },
      { name: 'Careers', href: '/careers' },
      { name: 'Contact', href: '/contact' },
      { name: 'Locations', href: '/locations' },
    ],
  },
  {
    title: 'Nonprofit',
    links: [
      { name: 'Donate', href: '/donate' },
      { name: 'Philanthropy', href: '/philanthropy' },
      { name: 'Rise Foundation', href: '/rise-foundation' },
    ],
  },
  {
    title: 'Legal & Policies',
    links: [
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Terms of Service', href: '/terms-of-service' },
      { name: 'Accessibility', href: '/accessibility' },
      { name: 'Compliance', href: '/compliance' },
      { name: 'FERPA', href: '/ferpa' },
      { name: 'Equal Opportunity', href: '/equal-opportunity' },
      { name: 'Refund Policy', href: '/refund-policy' },
      { name: 'Academic Integrity', href: '/academic-integrity' },
    ],
  },
  {
    title: 'Portals & Dashboards',
    links: [
      { name: 'Student Portal', href: '/student-portal' },
      { name: 'Employer Portal', href: '/employer-portal' },
      { name: 'Partner Portal', href: '/partner-portal' },
      { name: 'Admin Dashboard', href: '/admin/dashboard' },
      { name: 'Login', href: '/login' },
      { name: 'Sign Up', href: '/signup' },
    ],
  },
];

export default async function SitemapPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch dynamic sitemap data
  const { data: programs } = await db
    .from('programs')
    .select('name, slug')
    .eq('status', 'active');

  return (
    <>
      <main className="min-h-screen bg-white">
        {/* Breadcrumbs */}
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <Breadcrumbs items={[{ label: 'Site Map' }]} />
          </div>
        </div>

        <div className="bg-brand-blue-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Sitemap</h1>
            <p className="text-brand-blue-100 text-lg">
              Browse all pages and features of the Elevate for Humanity platform.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {sitemapSections.map((section) => (
              <div key={section.title} className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                  {section.title}
                </h2>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-slate-600 hover:text-brand-blue-600 hover:underline transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-white rounded-xl shadow-sm p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="text-slate-600 mb-6">
              Contact our support team and we&apos;ll help you find the right page.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition"
              >
                Contact Us
              </Link>
              <Link
                href="/support/help"
                className="px-6 py-3 bg-white text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition"
              >
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
