import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignMOUForm } from './SignMOUForm';
import { FileText, Shield } from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign MOU | Elevate For Humanity',
  description:
    'Review and digitally sign your Program Partner Memorandum of Understanding.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/sign-mou',
  },
};

const MOU_CONTENT = {
  barber: {
    programLabel: 'Barber Apprenticeship Program — DOL Registered Apprenticeship',
    siteLabel: 'barber shop',
    supervisorLabel: 'journeyperson barber',
    licenseLabel: 'Indiana Barber Shop License',
    supervisorLicenseLabel: 'mentor/journeyperson barber licenses',
    employerResponsibilities: [
      'Provide a minimum of <strong>2,000 hours per year</strong> of structured On-the-Job Learning (OJL) to each enrolled apprentice',
      'Assign a qualified journeyperson barber (licensed in Indiana) as mentor for each apprentice at a ratio not to exceed 1 mentor per 4 apprentices',
      'Maintain a safe, compliant, and professional work environment meeting all Indiana State Board of Cosmetology and Barber Examiners requirements',
      'Track and submit apprentice OJL hours monthly using Sponsor-provided forms',
      'Pay apprentices no less than the progressive wage schedule established in the Standards of Apprenticeship',
      'Maintain current Indiana barber shop license and all required permits throughout the term of this MOU',
      'Provide copies of all mentor/journeyperson barber licenses to the Sponsor upon request',
      'Comply with all applicable federal and state equal opportunity and non-discrimination requirements (29 CFR Part 30)',
      'Notify the Sponsor within 5 business days of any apprentice termination, leave of absence, or change in employment status',
      'Participate in quarterly program reviews and audits conducted by the Sponsor or U.S. DOL',
    ],
    docRequirements: [
      'Valid Indiana Barber Shop License (full copy, all pages)',
      'All mentor/journeyperson barber licenses (full copy, front and back)',
      'Federal Employer Identification Number (EIN)',
      'Current business address and contact information',
      'Signed Employer Training Site Agreement (separate from this MOU)',
    ],
  },
  cosmetology: {
    programLabel: 'Cosmetology Apprenticeship Program — DOL Registered Apprenticeship',
    siteLabel: 'licensed salon',
    supervisorLabel: 'supervising cosmetologist',
    licenseLabel: 'Indiana Salon License',
    supervisorLicenseLabel: 'supervising cosmetologist licenses',
    employerResponsibilities: [
      'Provide a minimum of <strong>2,000 hours per year</strong> of structured On-the-Job Learning (OJL) to each enrolled apprentice',
      'Designate a licensed cosmetologist (Indiana IPLA) as supervising cosmetologist for each apprentice at a ratio not to exceed 1 supervisor per 4 apprentices',
      'Maintain a safe, compliant, and professional salon environment meeting all Indiana State Board of Cosmetology and Barber Examiners requirements',
      'Track and submit apprentice OJL hours monthly using Sponsor-provided forms',
      'Pay apprentices no less than the progressive wage schedule established in the Standards of Apprenticeship',
      'Maintain current Indiana salon license and all required permits throughout the term of this MOU',
      'Provide copies of all supervising cosmetologist licenses to the Sponsor upon request',
      'Maintain current workers\' compensation insurance covering all apprentices',
      'Comply with all applicable federal and state equal opportunity and non-discrimination requirements (29 CFR Part 30)',
      'Notify the Sponsor within 5 business days of any apprentice termination, leave of absence, or change in employment status',
      'Participate in quarterly program reviews and audits conducted by the Sponsor or U.S. DOL',
    ],
    docRequirements: [
      'Valid Indiana Salon License (full copy, all pages)',
      'All supervising cosmetologist licenses (full copy, front and back)',
      'Current workers\' compensation insurance certificate',
      'Federal Employer Identification Number (EIN)',
      'Current business address and contact information',
      'Signed Employer Training Site Agreement (separate from this MOU)',
    ],
  },
};

export default async function SignMOUPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/program-holder/sign-mou');

  // Determine which MOU to show based on program holder's mou_type.
  // Live DB values: 'universal', 'custom_hvac_codelivery', 'custom_cosmetology_codelivery'.
  // There are no null or 'barber' records — do not fall back silently.
  const { data: programHolder } = await supabase
    .from('program_holders')
    .select('mou_type, primary_program_id')
    .eq('user_id', user.id)
    .single();

  const rawMouType = programHolder?.mou_type ?? null;

  // Map DB mou_type values to MOU_CONTENT keys
  const MOU_TYPE_MAP: Record<string, keyof typeof MOU_CONTENT> = {
    'custom_cosmetology_codelivery': 'cosmetology',
    'custom_hvac_codelivery':        'barber', // HVAC uses barber MOU structure for now
    'universal':                     'barber', // Universal defaults to barber (most common)
  };

  const mouKey = rawMouType ? MOU_TYPE_MAP[rawMouType] : null;

  // If mou_type is unrecognized or missing, surface an explicit error rather than
  // rendering the wrong legal document.
  if (!mouKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <p className="text-2xl font-bold text-slate-900 mb-3">MOU Not Configured</p>
          <p className="text-slate-600 text-sm mb-4">
            Your program type ({rawMouType ?? 'unknown'}) does not have a configured MOU template.
            Contact your coordinator to resolve this before signing.
          </p>
          <Link href="/program-holder/support" className="text-brand-blue-600 hover:underline text-sm">Contact Support</Link>
        </div>
      </div>
    );
  }

  const mou = MOU_CONTENT[mouKey];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Program Holder', href: '/program-holder' }, { label: 'Sign MOU' }]} />
      </div>

      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <InstitutionalHeader
            documentType="Memorandum of Understanding"
            title="Program Partner Agreement"
            subtitle="Review and digitally sign your partnership agreement."
            noDivider
          />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <Shield className="text-brand-blue-600 mb-2" size={24} />
            <h3 className="font-semibold text-black text-sm">Legally Binding</h3>
            <p className="text-xs text-black mt-1">Digital signatures have the same legal effect as handwritten signatures</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <Shield className="text-brand-blue-600 mb-2" size={24} />
            <h3 className="font-semibold text-black text-sm">Secure Process</h3>
            <p className="text-xs text-black mt-1">Your signature is encrypted and stored securely</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <FileText className="text-brand-blue-600 mb-2" size={24} />
            <h3 className="font-semibold text-black text-sm">Instant Processing</h3>
            <p className="text-xs text-black mt-1">Receive confirmation immediately upon signing</p>
          </div>
        </div>

        {/* MOU Document */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 mb-8">
          <div className="border-b border-slate-200 pb-6 mb-6">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Version 2.0 — Effective 2025</p>
            <h2 className="text-2xl font-bold text-black mb-1">Employer Training Site Memorandum of Understanding</h2>
            <p className="text-sm text-slate-600">{mou.programLabel}</p>
            <p className="text-sm text-slate-600 mt-2">
              RAPIDS Program No.: <strong>2025-IN-132301</strong> &nbsp;|&nbsp; Sponsor: <strong>2Exclusive LLC-S (DBA: Elevate for Humanity Technical and Career Institute)</strong>
            </p>
          </div>

          <div className="prose prose-slate max-w-none space-y-4 text-sm text-slate-800">
            <p>This Memorandum of Understanding (<strong>&quot;MOU&quot;</strong>) is entered into between <strong>2Exclusive LLC-S, doing business as Elevate for Humanity Technical and Career Institute</strong> (<strong>&quot;Sponsor&quot;</strong>), a DOL Registered Apprenticeship Sponsor (RAPIDS: 2025-IN-132301), and the Employer Training Site identified below (<strong>&quot;Employer&quot;</strong>).</p>

            <h3 className="text-base font-bold text-black mt-6 mb-2">1. Purpose</h3>
            <p>This MOU establishes the terms under which the Employer will serve as a training site for the Sponsor&apos;s DOL Registered {mouType === 'cosmetology' ? 'Cosmetology' : 'Barber'} Apprenticeship Program. This agreement is governed by the Standards of Apprenticeship registered with the U.S. Department of Labor, Office of Apprenticeship, pursuant to 29 CFR Parts 29 and 30.</p>

            <h3 className="text-base font-bold text-black mt-6 mb-2">2. Employer Responsibilities</h3>
            <ul className="list-disc pl-6 space-y-2">
              {mou.employerResponsibilities.map((r, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: r }} />
              ))}
            </ul>

            <h3 className="text-base font-bold text-black mt-6 mb-2">3. Sponsor Responsibilities</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Recruit, screen, and enroll qualified apprentice candidates</li>
              <li>Provide all Related Technical Instruction (RTI) — minimum 144 hours per year — through approved curriculum</li>
              <li>Register each apprentice with the U.S. DOL RAPIDS system within 30 days of enrollment</li>
              <li>Provide ongoing case management, compliance support, and program coordination</li>
              <li>Issue Certificates of Completion upon successful program completion</li>
              <li>Handle all WIOA, WRG, and grant compliance reporting</li>
              <li>Facilitate any available wage reimbursement or grant funding to the Employer where applicable</li>
            </ul>

            <h3 className="text-base font-bold text-black mt-6 mb-2">4. Documentation Requirements</h3>
            <p>The Employer must maintain a complete and current profile in the Sponsor&apos;s system, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              {mou.docRequirements.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
            <p className="font-semibold text-red-700">Incomplete profiles will result in suspension of apprentice placements until all required documentation is on file.</p>

            <h3 className="text-base font-bold text-black mt-6 mb-2">5. Term</h3>
            <p>This MOU shall remain in effect for <strong>one (1) year</strong> from the date of execution and shall automatically renew annually unless terminated by either party.</p>

            <h3 className="text-base font-bold text-black mt-6 mb-2">6. Termination</h3>
            <p>Either party may terminate this MOU with <strong>thirty (30) days written notice</strong>. The Sponsor may terminate immediately for cause, including but not limited to: license revocation, failure to pay apprentice wages, unsafe working conditions, or material breach of DOL Standards of Apprenticeship.</p>

            <h3 className="text-base font-bold text-black mt-6 mb-2">7. Confidentiality &amp; FERPA</h3>
            <p>Both parties agree to protect all student/apprentice personally identifiable information (PII) in accordance with the Family Educational Rights and Privacy Act (FERPA) and applicable state law. Apprentice records may not be shared with third parties without written consent.</p>

            <h3 className="text-base font-bold text-black mt-6 mb-2">8. Equal Opportunity</h3>
            <p>The Employer agrees to provide equal opportunity in apprenticeship without discrimination based on race, color, religion, national origin, sex, sexual orientation, age, or disability, in accordance with 29 CFR Part 30 and all applicable federal and state laws.</p>

            <h3 className="text-base font-bold text-black mt-6 mb-2">9. Governing Law</h3>
            <p>This MOU shall be governed by the laws of the State of Indiana and applicable federal regulations, including 29 CFR Parts 29 and 30.</p>

            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <p><strong>Sponsor:</strong> 2Exclusive LLC-S (DBA: Elevate for Humanity Technical and Career Institute)</p>
              <p className="mt-1"><strong>RAPIDS Program No.:</strong> 2025-IN-132301 &nbsp;|&nbsp; <strong>RTI Provider ID:</strong> 208029</p>
              <p className="mt-1">8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240 &nbsp;|&nbsp; (317) 314-3757</p>
            </div>
          </div>
        </div>

        {/* Signature Form */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-black mb-6">Sign Agreement</h2>
          <SignMOUForm />
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-black">
            Questions?{' '}
            <Link href="/contact" className="text-brand-blue-600 hover:text-brand-blue-700 font-medium">Contact us</Link>{' '}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
