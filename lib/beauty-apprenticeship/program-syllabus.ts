import type { BeautyApprenticeshipSlug } from '@/lib/beauty-apprenticeship/constants';
import { PRESTIGE_ELEVATION_BARBER_CURRICULUM } from '@/lib/barber/branding';

export type ProgramSyllabusInfo = {
  slug: BeautyApprenticeshipSlug;
  title: string;
  syllabusPath: string;
  rtiLabel: string;
  hostRequirement: string;
};

export const BEAUTY_PROGRAM_SYLLABI: Record<BeautyApprenticeshipSlug, ProgramSyllabusInfo> = {
  'barber-apprenticeship': {
    slug: 'barber-apprenticeship',
    title: 'Barber Apprenticeship',
    syllabusPath: '/docs/syllabi/barber-apprenticeship.md',
    rtiLabel: PRESTIGE_ELEVATION_BARBER_CURRICULUM,
    hostRequirement:
      'Host barbershops must use the published barber apprenticeship syllabus and stay on the same weekly module as the apprentice’s LMS theory assignments so instructors coach the matching subject.',
  },
  'cosmetology-apprenticeship': {
    slug: 'cosmetology-apprenticeship',
    title: 'Cosmetology Apprenticeship',
    syllabusPath: '/docs/syllabi/beauty-career-educator.md',
    rtiLabel: 'Elevate LMS Cosmetology Theory',
    hostRequirement:
      'Host salons must follow the cosmetology apprenticeship syllabus module schedule and align floor coaching with the apprentice’s daily LMS theory unit.',
  },
  'nail-technician-apprenticeship': {
    slug: 'nail-technician-apprenticeship',
    title: 'Nail Technician Apprenticeship',
    syllabusPath: '/docs/syllabi/professional-esthetician.md',
    rtiLabel: 'Elevate LMS Nail Theory',
    hostRequirement:
      'Host nail salons must use the program syllabus so practical coaching matches the apprentice’s current theory module on Elevate LMS.',
  },
  'esthetician-apprenticeship': {
    slug: 'esthetician-apprenticeship',
    title: 'Esthetician Apprenticeship',
    syllabusPath: '/docs/syllabi/professional-esthetician.md',
    rtiLabel: 'Elevate LMS Esthetics Theory',
    hostRequirement:
      'Host spas/salons must follow the esthetician syllabus weekly outline so on-site instruction matches LMS bookwork.',
  },
};
