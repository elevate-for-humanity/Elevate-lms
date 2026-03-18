import { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';

export const metadata: Metadata = {
  title: 'Reentry Workforce Partnership | Elevate for Humanity',
  description: 'Partner with Elevate for Humanity on reentry workforce programs. JRI-funded career training for justice-involved individuals — trades, CDL, healthcare, and barbering.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/reentry' },
};

export default function ReentryPartnerPage() {
  return (
    <PublicLandingPage config={{
      breadcrumbs: [{ label: 'Partners', href: '/partners' }, { label: 'Reentry Organizations' }],
      hero: {
        image: '/images/pages/career-services-page-3.jpg',
        tag: 'Reentry Programs',
        tagColor: 'text-brand-green-600',
        title: 'Reentry Workforce Partnership',
        subtitle: 'Connect justice-involved individuals to JRI-funded career training in trades, CDL, healthcare, and barbering — with background-friendly employer placements.',
      },
      intro: {
        heading: 'Second Chance Career Training That Works',
        paragraphs: [
          'Elevate for Humanity partners with community corrections, probation departments, reentry nonprofits, and case managers to provide career training for justice-involved individuals. Our programs are funded through JRI and WIOA, removing financial barriers to participation.',
          'We focus on fields where background checks are less restrictive and employer demand is high — HVAC, CDL, barbering, and healthcare support roles. Participants earn industry-recognized credentials and leave with real job offers, not just certificates.',
        ],
        image: '/images/pages/career-services-page-7.jpg',
      },
      features: {
        heading: 'Program Features',
        items: [
          'JRI funding may cover full tuition for eligible participants',
          'Programs in HVAC, CDL, barber apprenticeship, CNA, and phlebotomy',
          'Background-friendly employer partnerships across Indiana',
          'Wrap-around support: transportation, childcare, career counseling',
          'Job placement assistance and direct employer introductions',
          'Outcome tracking and reporting for your organization',
          'Case manager portal for real-time participant progress',
          'Flexible scheduling to accommodate supervision requirements',
        ],
      },
      steps: {
        heading: 'How Referrals Work',
        items: [
          { title: 'Identify Candidates', desc: 'Refer individuals who are motivated and eligible for JRI or WIOA funding. No minimum volume required.' },
          { title: 'We Verify Eligibility', desc: 'Our enrollment team confirms funding eligibility, selects the right program, and handles all paperwork.' },
          { title: 'Training Begins', desc: 'Participants attend hands-on training and earn industry certifications. We keep your case managers updated throughout.' },
          { title: 'Employment Placement', desc: 'We connect graduates with background-friendly employers actively hiring in their field and report employment outcomes back to you.' },
        ],
      },
      cta: {
        heading: 'Partner on Reentry',
        subtitle: 'Set up a referral pipeline for your reentry population. Call (317) 314-3757 or submit a referral now.',
        primaryLabel: 'Refer a Participant',
        primaryHref: '/apply/intake',
        secondaryLabel: 'JRI Funding Info',
        secondaryHref: '/funding/jri',
        bgColor: 'bg-brand-green-700',
      },
    }} />
  );
}
