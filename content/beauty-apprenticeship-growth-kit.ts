import { BARBER_APPRENTICESHIP } from '@/data/programs/barber-apprenticeship';
import { COSMETOLOGY } from '@/data/programs/cosmetology-apprenticeship';
import { NAIL_TECH } from '@/data/programs/nail-technician-apprenticeship';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { isRAPIDSProgram } from '@/lib/compliance/rapids-config';

export type BeautyTrackKey = 'barber' | 'cosmetology' | 'nail';

export const BEAUTY_TRACKS: Record<BeautyTrackKey, { label: string; path: string; program: ProgramSchema }> = {
  barber: {
    label: 'Barber Apprenticeship',
    path: '/programs/barber-apprenticeship',
    program: BARBER_APPRENTICESHIP,
  },
  cosmetology: {
    label: 'Cosmetology Apprenticeship',
    path: '/programs/cosmetology-apprenticeship',
    program: COSMETOLOGY,
  },
  nail: {
    label: 'Nail Technician Apprenticeship',
    path: '/programs/nail-technician-apprenticeship',
    program: NAIL_TECH,
  },
};

export function trainingHours(program: ProgramSchema): number {
  return Object.values(program.hoursBreakdown).reduce((sum, value) => sum + value, 0);
}

export function fundingCopy(program: ProgramSchema): string {
  if (program.funding?.wioa_eligible && program.funding?.etpl_approved) {
    return 'This program is marked WIOA-eligible and ETPL-approved in the canonical program record. Local WorkOne authorization and participant eligibility are still required; funding is not guaranteed.';
  }
  return program.funding?.fundingNotes
    || 'Funding varies by program and participant. Staff must not promise WIOA tuition coverage unless the current program record and WorkOne authorization support that claim.';
}

export function registrationCopy(program: ProgramSchema): string {
  return isRAPIDSProgram(program.slug)
    ? 'This track is listed in Elevate’s canonical Registered Apprenticeship program registry.'
    : 'This track is an apprenticeship pathway in the platform; staff must confirm current DOL/RAPIDS registration status before describing this specific track as federally registered.';
}

export function backlinkSnippet(track: BeautyTrackKey): string {
  const config = BEAUTY_TRACKS[track];
  const role = track === 'barber' ? 'Host Shop' : 'Host Salon';
  return `We are a proud Elevate for Humanity ${role} partner for the ${config.label}: https://www.elevateforhumanity.org${config.path}`;
}

export function applicantSms(track: BeautyTrackKey): string {
  const config = BEAUTY_TRACKS[track];
  const program = config.program;
  const hours = trainingHours(program).toLocaleString();
  const funding = program.funding?.wioa_eligible && program.funding?.etpl_approved
    ? 'Ask WorkOne to review your funding eligibility.'
    : 'Ask Elevate about current funding, employer-paid, supportive-service, and self-pay options.';
  return `Hey [Name]! Elevate’s ${config.label} is open. Train through a supervised host-site pathway with ${hours} structured hours. ${funding} Apply: https://www.elevateforhumanity.org${config.path}`;
}

export const SOCIAL_CAPTIONS = {
  applicant: `Skip the guesswork and choose the exact beauty license path you want. Elevate now has dedicated Barbering, Cosmetology, and Nail Technician apprenticeship pages with host-site training, program-specific hours, funding status, and direct application links. Funding eligibility varies by program and participant; it is reviewed before enrollment. #IndianaApprenticeship #EarnWhileYouLearn #BarberApprentice #CosmetologyApprenticeship #NailTech`,
  hostShop: `Indiana salon, spa, and barbershop owners: build talent in-house through the Elevate Host Site network. Elevate supports sponsor governance, related instruction, digital hour tracking, documents, and progress verification while your licensed team provides supervised on-the-job learning. Apply to become a Host Site at Elevate for Humanity.`,
  reelHook: `How do beauty apprenticeships work in Indiana? Pick the exact license path, apply to the track, complete supervised host-site training plus required instruction, track progress digitally, and prepare for licensing requirements. Funding and placement depend on the specific program and participant—check your track before you enroll.`,
} as const;

export const SOCIAL_IMAGE_PROMPTS = {
  professional: 'Professional modern social media photograph: diverse young adults learning in a bright contemporary salon with a licensed mentor, premium minimal composition, clean negative space for text, natural daylight, realistic workforce-development photography, 4:5 portrait.',
  barber: 'Cinematic modern industrial barbershop, licensed barber mentoring an apprentice on a clean fade using clippers, premium leather chairs, warm editorial lighting, realistic textures, high-end magazine photography, 9:16 vertical cover.',
} as const;

export const ADMISSIONS_PHONE_CHECKLIST = [
  'Identify the exact license path: Barbering, Cosmetology, or Nail Technician. Do not leave the lead categorized only as “beauty.”',
  'State the training model accurately: supervised host-site learning plus required related instruction. Do not promise wages, placement, licensing, or funding that the canonical record does not guarantee.',
  'Ask whether the applicant already has a licensed shop/salon that may want to host them or needs placement assistance.',
  'Record city/region, host-site status, WorkOne/case-manager status, and preferred contact method in CRM.',
  'Send the direct canonical track URL while the applicant is still on the call.',
  'Use the program-specific funding record. Never substitute organization-level ETPL status for a track-level WIOA eligibility claim.',
] as const;

export const HOST_SHOP_QUICK_START = [
  {
    title: 'Employment and wage compliance',
    bullets: [
      'Use the employment classification and wage progression required by the applicable registered standards, wage law, and approved employer agreement.',
      'Do not treat unlicensed apprentices as independent contractors when that conflicts with law or the approved apprenticeship arrangement.',
      'Keep payroll and wage-progression records available for audit.',
    ],
  },
  {
    title: 'Supervision and hour tracking',
    bullets: [
      'Provide supervision required by the applicable Indiana licensing rules and program standards.',
      'Review and verify practical/OJL hours in the Elevate Host Shop portal on the required cadence.',
      'Use competency sign-offs only when the apprentice has demonstrated the skill under the approved supervision process.',
    ],
  },
  {
    title: 'Related technical instruction',
    bullets: [
      'Ensure the apprentice has time to remain current with required RTI/LMS work.',
      'Do not count unverified theory or practical activity as completed program hours.',
      'Escalate attendance, academic, or safety concerns through the Host Shop portal.',
    ],
  },
  {
    title: 'Inspection and audit readiness',
    bullets: [
      'Maintain current shop and supervisor licensing records.',
      'Keep the active apprenticeship/employer agreement and recent hour records accessible.',
      'Use Elevate’s document workspace rather than relying on informal texts or paper-only records.',
    ],
  },
] as const;

export const MILESTONE_MAP = {
  cosmetology: [
    { hours: 250, milestone: 'Sanitation, shampooing, blow-dry, workstation and basic client-service validation.' },
    { hours: 1000, milestone: 'Mid-program competency review covering cutting, color/chemical safety, client consultation, and portfolio progress.' },
    { hours: 2000, milestone: 'Program-hour completion review, portfolio, licensing preparation, and final competency verification.' },
  ],
  barber: [
    { hours: 300, milestone: 'Sanitation, tool handling, clipper fundamentals, workstation safety, and supervised service basics.' },
    { hours: 1100, milestone: 'Mid-program review covering fades/tapers, shaving, client service, and documented skill progression.' },
    { hours: 2000, milestone: 'OJL completion review plus confirmation that the separate 144 RTI hours and required competencies are complete.' },
  ],
  nail: [
    { hours: 150, milestone: 'Natural nail anatomy, sanitation, standard manicuring and pedicuring under supervision.' },
    { hours: 400, milestone: 'Mid-program review covering enhancements, gels/acrylic systems, client safety, and portfolio progress.' },
    { hours: 600, milestone: 'Final supervised-hours review, sanitation competency, portfolio, and licensing preparation.' },
  ],
} as const;

export function workOnePitch(track: BeautyTrackKey): string {
  const config = BEAUTY_TRACKS[track];
  return `Good morning/afternoon. I am contacting you on behalf of Elevate for Humanity regarding our ${config.label}. The pathway combines supervised employer-based learning with related technical instruction and documented progress. ${registrationCopy(config.program)} ${fundingCopy(config.program)} We would like your career advisors to use the current program page and funding record when reviewing participants so no applicant is promised coverage that has not been authorized. The direct program page is https://www.elevateforhumanity.org${config.path}.`;
}

export function nurtureSequence(track: BeautyTrackKey) {
  const config = BEAUTY_TRACKS[track];
  const funding = fundingCopy(config.program);
  return [
    {
      delayMinutes: 0,
      subject: `We received your ${config.label} interest — here are the next steps`,
      body: `Hi [Apprentice Name],\n\nThank you for your interest in Elevate’s ${config.label}. Your next steps are to complete the application, confirm your city and host-site needs, and review the exact program requirements. ${funding}\n\nA coordinator can help you understand placement, required documents, payment/funding options, and the training schedule.\n\nProgram page: https://www.elevateforhumanity.org${config.path}\n\nElevate Admissions`,
    },
    {
      delayMinutes: 2880,
      subject: `See how the ${config.label} host-site model works`,
      body: `Hi [Apprentice Name],\n\nThe Elevate model combines supervised training in an approved host site with required instruction and digital progress tracking. You build real workplace experience while completing the program requirements for your selected track. Employment, funding, and placement depend on the approved arrangement and are not guaranteed by the application alone.\n\nIf you have a preferred licensed shop or salon, reply with its name and city so our team can review whether it can enter the Host Site process.\n\nElevate Admissions`,
    },
    {
      delayMinutes: 5760,
      subject: `Complete your ${config.label} placement profile`,
      body: `Hi [Apprentice Name],\n\nTo keep your application moving, confirm whether you already have a possible host site or need placement assistance. We also need your city/region and current WorkOne or case-manager status, if applicable.\n\nFinish or review your track here: https://www.elevateforhumanity.org${config.path}\n\nElevate Admissions`,
    },
  ];
}

export const PRESS_RELEASE_DRAFT = `FOR IMMEDIATE RELEASE\n\nELEVATE FOR HUMANITY EXPANDS BEAUTY AND GROOMING APPRENTICESHIP PATHWAYS IN INDIANA\n\nINDIANAPOLIS, IN — Elevate for Humanity has expanded dedicated public pathways for Barbering, Cosmetology, and Nail Technician apprenticeship training. The pages separate program hours, host-site expectations, related instruction, application steps, and track-specific funding information so applicants and workforce partners can review the correct requirements before enrollment.\n\nElevate operates Registered Apprenticeship infrastructure and an Indiana workforce-training platform. Program-specific registration and funding claims are published only when they are supported by the current canonical program record. Host-site availability varies by region.\n\nProspective apprentices and licensed Indiana businesses interested in becoming Host Sites can learn more at www.elevateforhumanity.org.\n\nAbout Elevate for Humanity\nElevate for Humanity provides career training, apprenticeship infrastructure, credentialing, employer coordination, and workforce technology serving learners, employers, and partner agencies.`;
