/**
 * Public-facing names for barber RTI (Related Technical Instruction).
 * Do not use third-party curriculum vendor names in learner UI.
 */

export const PRESTIGE_ELEVATION_BARBER_CURRICULUM =
  'Prestige Elevation Barber Curriculum';

/** Hardcoded to avoid circular imports */
const BARBER_COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

/** Short label for nav tabs and compact UI */
export const PRESTIGE_ELEVATION_BARBER_CURRICULUM_SHORT = 'Prestige Elevation Course';

/** Printable / offline companion materials */
export const PRESTIGE_ELEVATION_BARBER_WORKBOOK_LABEL = 'Prestige Elevation Workbook';

export const BARBER_CURRICULUM_COVER =
  '/images/prestige-elevation/barber-curriculum-workbook-cover.svg';

export const BARBER_ORIENTATION_VIDEO =
  '/videos/barber-lessons/barber-apprenticeship-orientation.mp4';

/** Canonical LMS path for Prestige Elevation RTI course */
export const BARBER_LMS_COURSE_PATH = `/lms/courses/${BARBER_COURSE_ID}` as const;

/** @deprecated Use BARBER_LMS_COURSE_PATH */
export const prestigeElevationBarberCoursePath = BARBER_LMS_COURSE_PATH;

/**
 * Static workbook fallback when server cannot resolve first lesson id.
 * Prefer server-resolved `workbookHref` from resolveCourseEntryLinks() on dashboards.
 */
export const PRESTIGE_ELEVATION_BARBER_WORKBOOK_HREF = `${BARBER_LMS_COURSE_PATH}?activity=reading`;

export const PRESTIGE_BARBER_BRAND = {
  instituteName: 'Prestige Barber & Beauty Institute',
  curriculumName: 'Prestige Elevation™ Barbering RTI',
  tagline: 'Elevate Your Future',
  motto: 'Learn. Practice. Master. Elevate.',
} as const;
