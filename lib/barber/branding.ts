import { BARBER_COURSE_ID } from '@/lib/barber/constants';

export const BARBER_CURRICULUM_COVER =
  '/images/prestige-elevation/barber-curriculum-workbook-cover.svg';

export const BARBER_ORIENTATION_VIDEO =
  '/videos/barber-lessons/barber-apprenticeship-orientation.mp4';

export const BARBER_LMS_COURSE_PATH = `/lms/courses/${BARBER_COURSE_ID}` as const;

export const PRESTIGE_BARBER_BRAND = {
  instituteName: 'Prestige Barber & Beauty Institute',
  curriculumName: 'Prestige Elevation™ Barbering RTI',
  tagline: 'Elevate Your Future',
  motto: 'Learn. Practice. Master. Elevate.',
} as const;
