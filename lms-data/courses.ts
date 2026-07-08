import { allPrograms } from '@/lms-data/programs';

export type LessonType = 'video' | 'scorm' | 'pdf' | 'quiz' | 'external';

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  durationMinutes?: number;
  // For video:
  videoUrl?: string;
  // For SCORM (we'll hook JRI / VITA / partner SCORM here):
  scormPackageId?: string;
  // For content:
  description?: string;
}

export interface Module {
  id: string;
  title: string;
  summary?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  programId: string;
  slug: string;
  title: string;
  shortDescription: string;
  longDescription?: string;
  level?: 'intro' | 'intermediate' | 'advanced';
  estimatedWeeks?: number;
  estimatedHoursPerWeek?: number;
  primaryCredentialPartner?: string;
  isJriAligned?: boolean;
  modules: Module[];
}

/**
 * LMS COURSES
 *
 * These courses are companion content for program-specific training.
 * Video content is supplementary - primary instruction comes from
 * partner providers (Choice Medical Institute, Milady, IRS VITA, etc.)
 *
 * Lesson types:
 * - "video": Embedded video content (uses hero videos as placeholders until program-specific content is produced)
 * - "scorm": External SCORM package integration
 * - "pdf": Document-based learning
 * - "external": Links to partner training platforms
 */

export const courses: Course[] = [
  {
    id: 'course-cna-core',
    programId: 'prog-cna',
    slug: 'cna-career-foundations',
    title: 'CNA Career Foundations',
    shortDescription:
      'Core CNA knowledge plus work-readiness skills aligned with Choice Medical Institute and long-term care employers.',
    longDescription:
      'This course braids core CNA theory, basic skills, and job readiness. It is meant to sit alongside your state-approved CNA provider (Choice Medical Institute) as a support layer, not a replacement.',
    level: 'intro',
    estimatedWeeks: 6,
    estimatedHoursPerWeek: 8,
    primaryCredentialPartner: 'Choice Medical Institute',
    modules: [
      {
        id: 'cna-module-1',
        title: 'Getting Ready for CNA Training',
        summary:
          'Understand the CNA role, expectations, and how Elevate supports you through the process.',
        lessons: [
          {
            id: 'cna-lesson-1-1',
            title: 'Welcome to Your CNA Pathway',
            type: 'video',
            durationMinutes: 8,
            videoUrl: '/videos/cna-welcome.mp4',
            description:
              'Elizabeth or an Elevate instructor welcomes learners, explains the CNA pathway, and how JRI/WRG/WEX/OJT may support training.',
          },
          {
            id: 'cna-lesson-1-2',
            title: 'What a CNA Actually Does Day-to-Day',
            type: 'video',
            durationMinutes: 10,
            videoUrl: '/videos/cna-day-in-life.mp4',
            description:
              'Day-in-the-life overview of a CNA in long-term care, including teamwork, pace, and emotional load.',
          },
        ],
      },
      {
        id: 'cna-module-2',
        title: 'Professionalism, Soft Skills & Work Readiness',
        summary: 'JRI-style soft skills and workplace readiness content connected to CNA settings.',
        lessons: [
          {
            id: 'cna-lesson-2-1',
            title: 'Showing Up: Attendance, Reliability & Boundaries',
            type: 'video',
            durationMinutes: 12,
            videoUrl: '/videos/cna-professionalism.mp4',
          },
          {
            id: 'cna-lesson-2-2',
            title: 'Communication with Residents, Families & Staff',
            type: 'video',
            durationMinutes: 14,
            videoUrl: '/videos/cna-communication.mp4',
          },
        ],
      },
    ],
  },
  {
    id: 'course-barber-apprentice-core',
    programId: 'prog-barber',
    slug: 'barber-apprenticeship-core',
    title: 'Barber Apprenticeship Core',
    shortDescription:
      'Milady-aligned barber apprenticeship support course focusing on shop expectations, client care, and hours tracking.',
    longDescription:
      'This course is a companion to your licensed barber shop apprenticeship and Milady theory resources. It keeps all the expectations, shop culture, and career moves in one place.',
    level: 'intro',
    estimatedWeeks: 24,
    estimatedHoursPerWeek: 20,
    primaryCredentialPartner: 'Milady / Barber Academy Partners',
    modules: [
      {
        id: 'barber-module-1',
        title: 'Welcome to the Shop',
        summary: 'Orientation to the barbershop as a professional environment, not a hangout.',
        lessons: [
          {
            id: 'barber-lesson-1-1',
            title: 'Barbershop Culture & Expectations',
            type: 'video',
            durationMinutes: 10,
            videoUrl: '/videos/barber-shop-culture.mp4',
          },
          {
            id: 'barber-lesson-1-2',
            title: 'Client Experience & Building Loyal Clients',
            type: 'video',
            durationMinutes: 12,
            videoUrl: '/videos/barber-client-experience.mp4',
          },
        ],
      },
      {
        id: 'barber-module-2',
        title: 'Hours, Logs & Apprenticeship Rules',
        summary: 'How to log hours, stay in compliance, and not lose your license opportunity.',
        lessons: [
          {
            id: 'barber-lesson-2-1',
            title: 'Logging Your Apprenticeship Hours',
            type: 'video',
            durationMinutes: 8,
            videoUrl: '/videos/barber-hours-logging.mp4',
          },
          {
            id: 'barber-lesson-2-2',
            title: 'Working with Elevate & Your Shop Owner',
            type: 'video',
            durationMinutes: 9,
            videoUrl: '/videos/barber-elevate-partnership.mp4',
          },
        ],
      },
    ],
  },
  {
    id: 'course-tax-vita-core',
    programId: 'prog-tax-vita',
    slug: 'tax-vita-career-launch',
    title: 'Tax, VITA & Career Launch',
    shortDescription:
      'Intro to tax prep, IRS VITA, Link & Learn, and how tax experience connects to office and IT roles.',
    longDescription:
      'This course is designed to sit on top of IRS Link & Learn, VITA training, and Intuit resources. Elevate uses it to prepare learners to serve in tax/VITA roles and transition into office, customer service, or IT tracks.',
    level: 'intro',
    estimatedWeeks: 10,
    estimatedHoursPerWeek: 6,
    primaryCredentialPartner: 'IRS VITA / Intuit / Link & Learn',
    isJriAligned: true,
    modules: [
      {
        id: 'tax-module-1',
        title: 'What is VITA and How Does It Work?',
        summary:
          "Understand the IRS VITA program, volunteer roles, and how this fits in Elevate's ecosystem.",
        lessons: [
          {
            id: 'tax-lesson-1-1',
            title: 'Overview of VITA & Link & Learn',
            type: 'video',
            durationMinutes: 10,
            videoUrl: '/videos/tax-vita-overview.mp4',
          },
          {
            id: 'tax-lesson-1-2',
            title: 'Connecting Tax Experience to Career Paths',
            type: 'video',
            durationMinutes: 12,
            videoUrl: '/videos/hero-home-fast.mp4',
          },
          {
            id: 'tax-lesson-1-3',
            title: 'Launch IRS Link & Learn / VITA Training',
            type: 'scorm',
            scormPackageId: 'vita-link-learn-1',
            description:
              'This will open your IRS Link & Learn / VITA training environment in a new tab, or a SCORM host once connected.',
          },
        ],
      },
      {
        id: 'tax-module-2',
        title: 'Soft Skills for Tax & Office Environments',
        summary:
          'Customer service, confidentiality, and professional behavior in a tax or office setting.',
        lessons: [
          {
            id: 'tax-lesson-2-1',
            title: 'Confidentiality & Ethics',
            type: 'video',
            durationMinutes: 8,
            videoUrl: '/videos/tax-confidentiality.mp4',
          },
          {
            id: 'tax-lesson-2-2',
            title: 'Customer Service Mindset in Tax Season',
            type: 'video',
            durationMinutes: 9,
            videoUrl: '/videos/tax-customer-service.mp4',
          },
        ],
      },
    ],
  },
];

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

export function getCoursesForProgram(programId: string): Course[] {
  return courses.filter((c) => c.programId === programId);
}

export function getAllCoursesWithProgramMeta() {
  return courses.map((course) => {
    const program = allPrograms.find((p) => p.id === course.programId) || null;
    return { course, program };
  });
}
