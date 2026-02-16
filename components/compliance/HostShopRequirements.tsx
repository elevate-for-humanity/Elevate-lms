'use client';

import { 
  Building2, 
  
  Shield, 
  ClipboardCheck,
  UserCheck,
  AlertTriangle,
  ChevronRight,
  Globe,
  MapPin,
} from 'lucide-react';

type ProgramTrack = 'barber' | 'cosmetology' | 'esthetician' | 'nail-technician' | 'all';

interface HostShopRequirementsProps {
  programTrack?: ProgramTrack;
  showApprovalProcess?: boolean;
  showMultiRegion?: boolean;
  compact?: boolean;
}

const UNIVERSAL_REQUIREMENTS = [
  'The business must be properly licensed and in good standing in the selected region (e.g., Indiana barber establishment license, cosmetology license, etc.).',
  'A licensed professional appropriate to the program track (Barber, Cosmetology, etc.) must be designated as the on-site supervisor.',
  'The site must agree to apprenticeship documentation (training plan, time/attendance logs, evaluations) and cooperate with compliance verification.',
  'Sanitation, infection control, and workplace safety standards must be followed as required by the licensing board for the region.',
  'Appropriate business insurance is required (general liability, workers\' compensation if applicable).',
  'Apprentices may only perform services within the permitted scope as allowed by regional licensing and supervision.',
];

const TRACK_GUIDELINES: Record<string, { title: string; requirements: string[] }> = {
  barber: {
    title: 'Barber Apprenticeship — Host Shop Guidelines',
    requirements: [
      'Must be a licensed barber establishment or permitted salon in the selected region.',
      'Must designate a licensed barber (or region-authorized equivalent supervisor) to oversee on-the-job training.',
      'Must have adequate stations and tools to support apprentice learning.',
    ],
  },
  cosmetology: {
    title: 'Cosmetology — Host Shop Guidelines',
    requirements: [
      'Must be a licensed cosmetology establishment (salon) in good standing for the selected region.',
      'Must designate a licensed cosmetologist (or region-authorized equivalent supervisor) to oversee on-the-job training.',
      'Must have adequate stations and tools to support apprentice learning.',
    ],
  },
  esthetician: {
    title: 'Esthetics — Host Shop Guidelines',
    requirements: [
      'Must be a licensed establishment permitted to provide esthetics/skincare services for the selected region.',
      'Must designate a licensed esthetician (or region-authorized equivalent supervisor) to oversee on-the-job training.',
      'Must have appropriate treatment space and equipment for skincare services.',
    ],
  },
  'nail-technician': {
    title: 'Nail Technology — Host Shop Guidelines',
    requirements: [
      'Must be a licensed establishment permitted to provide nail services for the selected region.',
      'Must designate a licensed nail technician (or region-authorized equivalent supervisor) to oversee on-the-job training.',
      'Must have appropriate nail stations and sanitation equipment.',
    ],
  },
};

const MULTI_REGION_BULLETS = [
  'Requirements may differ for Indiana, Illinois (including Chicago/Cook County), and other states.',
  'Host site approval is required before placement is finalized.',
  'If a site does not meet regional requirements, you must choose another eligible shop.',
];

const APPROVAL_STEPS = [
  {
    step: 1,
    title: 'Select Region & Submit Shop',
    description: 'Apprentice selects Training Region and submits preferred shop(s) with address, owner/manager contact, and supervisor name/license type.',
  },
  {
    step: 2,
    title: 'License Verification',
    description: 'We verify license status and confirm the supervisor\'s credentials for the selected track and region.',
  },
  {
    step: 3,
    title: 'Agreement Confirmation',
    description: 'We confirm the shop\'s agreement to documentation, evaluations, and region-specific workplace standards.',
  },
  {
    step: 4,
    title: 'Placement Confirmed',
    description: 'Placement is confirmed (or we request an alternate shop if requirements are not met).',
  },
];

export function HostShopRequirements({ 
  programTrack = 'all', 
  showApprovalProcess = true,
  showMultiRegion = true,
  compact = false,
}: HostShopRequirementsProps) {
  const tracksToShow = programTrack === 'all' 
    ? Object.keys(TRACK_GUIDELINES) 
    : [programTrack];

  return (
    <section className={`${compact ? 'py-8' : 'py-16'} bg-slate-50`}>
      <div className="mx-auto max-w-4xl px-6">
        {/* Multi-Region Requirements Callout */}
        {showMultiRegion && (
          <div className="mb-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Multi-Region Requirements
                  <span className="text-sm font-normal bg-white/20 px-2 py-0.5 rounded">Read Before Choosing a Shop</span>
                </h3>
                <p className="text-purple-100 mb-4">
                  We are based in Indiana, but host site requirements vary by region (state licensing boards, 
                  workforce board policies, and employer eligibility standards). Your selected training region's 
                  rules determine which shops are eligible to host your apprenticeship. We verify each host site 
                  based on regional licensing and compliance standards before placement is confirmed.
                </p>
                <ul className="space-y-2">
                  {MULTI_REGION_BULLETS.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-2 text-purple-100">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-brand-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">
                Host Shop Requirements
              </h2>
              <p className="text-slate-600 text-sm">Per Program Track</p>
            </div>
          </div>
          
          <div className="bg-brand-blue-50 border-l-4 border-brand-blue-600 p-4 rounded-r-lg">
            <p className="text-brand-blue-900">
              The shop/salon you choose must meet state/local licensing and workplace standards based on 
              your training region. Host sites must be approved before apprenticeship placement is confirmed.
            </p>
          </div>
        </div>

        {/* Universal Requirements */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-blue-600" />
            Universal Host Site Requirements
          </h3>
          <p className="text-slate-600 text-sm mb-4">
            These requirements apply to ALL apprenticeship tracks:
          </p>
          <ul className="space-y-3">
            {UNIVERSAL_REQUIREMENTS.map((req, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-slate-700">{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Track-Specific Guidelines */}
        <div className="space-y-4 mb-6">
          {tracksToShow.map((track) => {
            const guidelines = TRACK_GUIDELINES[track];
            if (!guidelines) return null;

            return (
              <div key={track} className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                  {guidelines.title}
                </h3>
                <ul className="space-y-3">
                  {guidelines.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <ChevronRight className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Verification Statement */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-amber-900 font-medium">
              Host site approval is required before placement is finalized. Approval includes 
              license verification and a readiness review (supervision, safety, documentation) 
              based on the selected region.
            </p>
          </div>
        </div>

        {/* Shop Approval Process */}
        {showApprovalProcess && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-green-600" />
              Shop Approval Process
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {APPROVAL_STEPS.map((step) => (
                <div key={step.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-black">{step.title}</h4>
                    <p className="text-sm text-slate-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default HostShopRequirements;
