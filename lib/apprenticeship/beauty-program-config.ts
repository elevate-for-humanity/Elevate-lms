export const BEAUTY_APPRENTICESHIP_CONFIG = {
  'barber-apprenticeship': {
    label: 'Barbering',
    portalLabel: 'Barber Apprentice Portal',
    hostLabel: 'Host Barbershop',
    syllabusHref: '/docs/syllabi/barber-apprenticeship.md',
  },
  'cosmetology-apprenticeship': {
    label: 'Cosmetology',
    portalLabel: 'Cosmetology Apprentice Portal',
    hostLabel: 'Host Salon',
    syllabusHref: '/docs/syllabi/cosmetology-apprenticeship.md',
  },
  'esthetician-apprenticeship': {
    label: 'Esthetician',
    portalLabel: 'Esthetician Apprentice Portal',
    hostLabel: 'Host Spa or Salon',
    syllabusHref: '/docs/syllabi/professional-esthetician.md',
  },
  'nail-technician-apprenticeship': {
    label: 'Nail Technician',
    portalLabel: 'Nail Technician Apprentice Portal',
    hostLabel: 'Host Nail Salon',
    syllabusHref: '/apprentice/rti',
  },
} as const;

export type BeautyApprenticeshipSlug = keyof typeof BEAUTY_APPRENTICESHIP_CONFIG;

export function getBeautyApprenticeshipConfig(programSlug: string) {
  return BEAUTY_APPRENTICESHIP_CONFIG[programSlug as BeautyApprenticeshipSlug] ?? null;
}
