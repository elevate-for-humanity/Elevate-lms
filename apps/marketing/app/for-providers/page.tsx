import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ShieldCheck, ClipboardCheck, BookOpen, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Providers | Elevate for Humanity',
  description: 'For Providers page content.',
};

// ── Two distinct roles ────────────────────────────────────────────────────────
//
// PROGRAM HOLDER  — an organization that hosts and runs training on the ground.
//   Examples: barbershop, cosmetology school, employer site, community org.
//   They sign an MOU, manage attendance, and have a portal.
//
// TRAINING PROVIDER — an org that delivers curriculum and holds credential
//   authority (NHA, EPA, DOL). Elevate is the primary provider; partners can
//   co-deliver under Elevate's credential umbrella.
//
// Most applicants are Program Holders. Training Providers go through a separate
// vetting process for credential authority.

const PROGRAM_HOLDER_STEPS = [
  { icon: FileText,      label: 'Apply',          desc: 'Submit the program holder application — org info, location, program type.' },
  { icon: ShieldCheck,   label: 'Verify',         desc: 'Identity and org verification. Typically 3–5 business days.' },
  { icon: ClipboardCheck,label: 'Sign MOU',       desc: 'Review and sign the Memorandum of Understanding.' },
  { icon: BookOpen,      label: 'Onboard',        desc: 'Complete orientation, upload required documents, set up your portal.' },
  { icon: Users,         label: 'Launch',         desc: 'Enroll learners, track attendance, and submit compliance reports.' },
];

const WHAT_YOU_GET = [
  'Access to Elevate\'s curriculum library and LMS',
  'DOL-registered apprenticeship framework',
  'Credential authority under Elevate\'s NHA and EPA agreements',
  'Compliance reporting tools (WIOA, FSSA, JRI)',
  'Dedicated program holder portal',
  'Instructor support and professional development',
  'Marketing and enrollment support',
];

const WHO_APPLIES = [
  { label: 'Barbershops & Salons',       desc: 'Host DOL-registered barber or cosmetology apprentices.' },
  { label: 'Employers',                  desc: 'Run on-the-job training or apprenticeship programs for your workforce.' },
  { label: 'Community Organizations',    desc: 'Deliver workforce training to your community with Elevate\'s curriculum.' },
  { label: 'Healthcare Facilities',      desc: 'Train CNAs, QMAs, or peer recovery specialists on-site.' },
  { label: 'Workforce Agencies',         desc: 'Refer and co-enroll WIOA, FSSA, or JRI participants.' },
  { label: 'Training Organizations',     desc: 'Co-deliver curriculum under Elevate\'s credential authority.' },
];

export default function ForProvidersPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">For Providers</h1>
          <p className="text-blue-200">Workforce development resources.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Back to Home</Link>
        </div>
      </section>
    </div>
  );
}

