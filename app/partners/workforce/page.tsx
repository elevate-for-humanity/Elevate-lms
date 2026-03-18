import { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';

export const metadata: Metadata = {
  title: 'Workforce Agency Partnership | Elevate for Humanity',
  description: 'Partner with Elevate for Humanity on WIOA-funded workforce training. WorkOne centers, workforce boards, and DWD case managers — refer participants and track outcomes.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/workforce' },
};

export default function WorkforcePage() {
  return (
    <PublicLandingPage config={{
      breadcrumbs: [{ label: 'Partners', href: '/partners' }, { label: 'Workforce Agencies' }],
      hero: {
        image: '/images/pages/workforce-partnership-hero.jpg',
        tag: 'Workforce Agencies',
        tagColor: 'text-brand-blue-600',
        title: 'Workforce Agency Partnership',
        subtitle: 'Refer WIOA, Workforce Ready Grant, and JRI participants to Elevate for funded career training. We handle enrollment, training, testing, and outcome reporting.',
      },
      intro: {
        heading: 'A Turnkey Training Partner for Your Agency',
        paragraphs: [
          'Elevate for Humanity is an ETPL-approved training provider serving WorkOne centers, workforce development boards, and DWD case managers across Indiana. Our programs are designed to meet WIOA performance metrics — credential attainment, employment, and earnings gains.',
          'When you refer a participant to Elevate, we take it from there. We verify eligibility, enroll them in the right program, deliver the training, administer certification exams, and report outcomes back to your agency. You get a reliable partner with measurable results.',
        ],
        image: '/images/pages/wioa-meeting.jpg',
      },
      features: {
        heading: 'What Your Agency Gets',
        items: [
          'ETPL-approved programs in HVAC, CDL, healthcare, barbering, and business',
          'DOL Registered Apprenticeship programs (barber and trades)',
          'Real-time enrollment and progress reporting for your case managers',
          'Credential attainment data for WIOA performance reporting',
          'Dedicated agency liaison — one point of contact for all referrals',
          'Employment outcome tracking and 90-day follow-up reports',
          'Flexible cohort scheduling — day, evening, and weekend options',
          'Wrap-around support: transportation assistance, childcare referrals, career counseling',
        ],
      },
      steps: {
        heading: 'How the Referral Process Works',
        items: [
          { title: 'Contact Us', desc: 'Reach out to set up a referral agreement. Most agencies are onboarded within one week.' },
          { title: 'Send Referrals', desc: 'Refer eligible participants via our intake form or direct case manager contact. We confirm eligibility and program fit.' },
          { title: 'We Enroll and Train', desc: 'Elevate handles enrollment paperwork, training delivery, and certification exam scheduling.' },
          { title: 'Receive Outcome Reports', desc: 'We send completion, credential attainment, and employment outcome data back to your agency on your reporting schedule.' },
        ],
      },
      cta: {
        heading: 'Start a Referral Partnership',
        subtitle: 'Most referral agreements are in place within a week. Call (317) 314-3757 or submit the intake form to get started.',
        primaryLabel: 'Submit Intake Form',
        primaryHref: '/apply/intake',
        secondaryLabel: 'Call (317) 314-3757',
        secondaryHref: 'tel:3173143757',
        bgColor: 'bg-brand-blue-700',
      },
    }} />
  );
}
