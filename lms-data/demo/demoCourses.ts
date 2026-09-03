export type CourseDeliveryType = 'video' | 'scorm' | 'blended';

export interface DemoCourseModule {
  id: string;
  title: string;
  type: 'video' | 'quiz' | 'reading' | 'external';
  duration?: string;
  note?: string;
}

export interface DemoCourse {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  deliveryType: CourseDeliveryType;
  partner?: string;
  programId?: string;
  estimatedHours?: string;
  scormPackageId?: string;
  modules: DemoCourseModule[];
}

export const demoCourses: DemoCourse[] = [
  {
    id: 'course-jri-core',
    slug: 'job-ready-indy-core',
    title: 'Job Ready Indy – Core Work Readiness',
    shortDescription:
      'Soft skills, professionalism, communication, and workplace expectations to get and keep a job.',
    deliveryType: 'scorm',
    partner: 'JRI / EmployIndy',
    programId: 'prog-cna',
    estimatedHours: '15–20 hours',
    modules: [
      {
        id: 'm1',
        title: 'Welcome to Job Ready Indy',
        type: 'external',
        duration: '20 min',
        note: 'Delivered via SCORM 2004 package from EmployIndy.',
      },
      {
        id: 'm2',
        title: 'Professionalism & Work Ethic',
        type: 'external',
        duration: '60 min',
        note: 'SCORM module – tracked in external system.',
      },
      {
        id: 'm3',
        title: 'Communication & Teamwork',
        type: 'external',
        duration: '60 min',
      },
      {
        id: 'm4',
        title: 'Attendance, Reliability & Next Steps',
        type: 'external',
        duration: '45 min',
      },
    ],
  },
  {
    id: 'course-barber-apprentice-foundations',
    slug: 'barber-apprentice-foundations',
    title: 'Barber Apprentice Foundations',
    shortDescription:
      'Barber theory, shop culture, safety, and customer service wrapped around Milady content.',
    deliveryType: 'blended',
    partner: 'Milady / Barber Academy',
    programId: 'prog-barber',
    estimatedHours: '40–60 hours (blended)',
    modules: [
      {
        id: 'm1',
        title: 'Welcome & Shop Culture',
        type: 'video',
        duration: '10 min',
        note: 'Intro video from Elevate / shop owner.',
      },
      {
        id: 'm2',
        title: 'Milady Theory Segment 1',
        type: 'external',
        duration: '90 min',
        note: 'Delivered via Milady platform; this module shell links out.',
      },
      {
        id: 'm3',
        title: 'Customer Service & Chair-Side Manner',
        type: 'video',
        duration: '20 min',
      },
      {
        id: 'm4',
        title: 'On-the-Job Learning Checklist',
        type: 'reading',
        duration: '15 min',
        note: 'Printable checklist for apprenticeship hours.',
      },
    ],
  },
  {
    id: 'course-tax-vita-onramp',
    slug: 'tax-vita-onramp',
    title: 'Tax & VITA On-Ramp',
    shortDescription:
      "Orientation into IRS VITA, Link & Learn, and Elevate's office skills modules.",
    deliveryType: 'blended',
    partner: 'IRS VITA + Intuit',
    programId: 'prog-tax-vita',
    estimatedHours: '20–30 hours',
    modules: [
      {
        id: 'm1',
        title: 'Welcome to VITA & Community Tax Work',
        type: 'video',
        duration: '10 min',
      },
      {
        id: 'm2',
        title: 'IRS Link & Learn Orientation',
        type: 'external',
        duration: '60 min',
        note: 'Learner is guided to Link & Learn to create an account and start IRS certification.',
      },
      {
        id: 'm3',
        title: 'Intuit Tax Practice Lab Intro',
        type: 'external',
        duration: '45 min',
      },
      {
        id: 'm4',
        title: 'Office Skills & Client Care',
        type: 'video',
        duration: '20 min',
      },
    ],
  },
];

export function getDemoCourseBySlug(slug: string): DemoCourse | undefined {
  return demoCourses.find((c) => c.slug === slug);
}

export function getDemoCoursesForStudent() {
  return demoCourses;
}
