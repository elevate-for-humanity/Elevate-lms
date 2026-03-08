/**
 * Canonical team data — single source of truth.
 * Sourced from existing repo content (app/about/team/page.tsx fallbackTeam).
 * Used by: /about/team, /team, homepage "Meet the Team" section.
 *
 * Do NOT fabricate bios or credentials. If data is missing, use placeholder text.
 */

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  orgRole?: string;
  bio: string;
  headshotSrc?: string;
  email?: string;
  linkedin?: string;
}

export const TEAM: TeamMember[] = [
  {
    id: '1',
    name: 'Elizabeth Greene',
    title: 'Founder & Chief Executive Officer',
    orgRole: 'Executive Leadership',
    bio: 'U.S. military veteran, IRS Enrolled Agent (EA), EFIN and PTIN holder, licensed barber, Indiana substitute teacher, EPA 608 Certified Proctor. Elizabeth founded Elevate for Humanity to connect people to funded workforce training. She also operates SupersonicFastCash, a tax preparation software company.',
    headshotSrc: '/images/team/elizabeth-greene-headshot.jpg',
    email: '',
  },
  {
    id: '2',
    name: 'Jozanna George',
    title: 'Director of Enrollment & Beauty Industry Programs',
    orgRole: 'Enrollment & Instruction',
    bio: 'Jozanna is a multi-licensed beauty professional holding Nail Technician, Nail Instructor, and Esthetician licenses. She oversees the nail program at Textures Institute of Cosmetology and manages enrollment operations for Elevate for Humanity.',
    headshotSrc: '/images/jozanna-george.jpg',
    email: 'jozanna@elevateforhumanity.org',
  },
  {
    id: '3',
    name: 'Dr. Carlina Wilkes',
    title: 'Executive Director of Financial Operations & Organizational Compliance',
    orgRole: 'Grants & Compliance',
    bio: 'Dr. Wilkes brings 24+ years of federal experience with DFAS, holding DoD Financial Management Certification Level II. She oversees financial operations and compliance at Elevate for Humanity.',
    headshotSrc: '/images/carlina-wilkes.jpg',
    email: 'carlina@elevateforhumanity.org',
  },
  {
    id: '4',
    name: 'Sharon Douglass',
    title: 'Respiratory Therapy & Health Informatics Specialist',
    orgRole: 'Healthcare Programs',
    bio: 'Sharon brings 30+ years as a Respiratory Therapist with a Master\'s in Health Informatics. She supports healthcare training programs and workforce readiness initiatives.',
    headshotSrc: '/images/sharon-douglas.jpg',
    email: 'sharon@elevateforhumanity.org',
  },
  {
    id: '5',
    name: 'Leslie Wafford',
    title: 'Director of Community Services',
    orgRole: 'Community & Supportive Services',
    bio: 'Leslie promotes low-barrier housing access and eviction prevention, helping families navigate housing challenges with her "reach one, teach one" philosophy.',
    headshotSrc: '/images/leslie-wafford.jpg',
    email: 'leslie@elevateforhumanity.org',
  },
  {
    id: '6',
    name: 'Alina Smith, PMHNP',
    title: 'Psychiatric Mental Health Nurse Practitioner',
    orgRole: 'Behavioral Health',
    bio: 'Alina is a board-certified PMHNP from Purdue University, providing mental health assessments, interventions, and medication management for program participants.',
    headshotSrc: '/images/alina-smith.jpg',
    email: 'alina@elevateforhumanity.org',
  },
  {
    id: '7',
    name: 'Delores Reynolds',
    title: 'Social Media & Digital Engagement Coordinator',
    orgRole: 'Communications',
    bio: 'Delores manages digital communications, sharing student success stories and promoting program offerings to reach those who can benefit from funded training.',
    headshotSrc: '/images/delores-reynolds.jpg',
    email: 'delores@elevateforhumanity.org',
  },
  {
    id: '8',
    name: 'Clystjah Woodley',
    title: 'Program Coordinator',
    orgRole: 'Program Operations',
    bio: 'Clystjah supports program operations and student services, helping participants navigate enrollment and stay on track through their training programs.',
    headshotSrc: '/images/clystjah-woodley.jpg',
    email: 'clystjah@elevateforhumanity.org',
  },
  {
    id: '9',
    name: 'Alberta Davis',
    title: 'Testing Center Coordinator & Exam Proctor',
    orgRole: 'Credential Testing',
    bio: 'Alberta Davis serves as a Testing Center Coordinator and Exam Proctor at Elevate for Humanity\'s Workforce Credential Testing Center in Indianapolis. She supports the administration of industry-recognized certification exams and workforce assessments for individuals, employers, schools, and workforce development partners.\n\nIn her role, Alberta coordinates testing appointments, prepares testing stations, and assists candidates through the check-in and identity verification process to ensure each testing session begins smoothly. As an exam proctor, she monitors in-person and live testing sessions to maintain compliance with certification provider policies and exam security standards.\n\nAlberta also assists with onsite testing events for partner organizations and workforce programs, helping expand access to credential testing opportunities across the community. Through her work, she helps maintain a secure, organized, and professional testing environment where candidates can focus on earning the certifications needed to advance in the workforce.',
    headshotSrc: '/images/alberta-davis.jpg',
    email: 'alberta@elevateforhumanity.org',
  },
];

export const FOUNDER = TEAM[0];

/** Members to show in the homepage preview (founder + 3 others) */
export const TEAM_PREVIEW = [TEAM[0], TEAM[2], TEAM[1], TEAM[3]];
