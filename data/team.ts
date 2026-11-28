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
  /** Verified degrees, licenses, and certifications. Omit when unverified. */
  credentials?: string[];
}

export const TEAM: TeamMember[] = [
  {
    id: '1',
    name: 'Elizabeth Greene',
    title: 'Founder & Chief Executive Officer',
    orgRole: 'Executive Leadership',
    bio: 'U.S. Army veteran (Unit Supply Specialist), IRS Enrolled Agent (EA), EFIN/PTIN holder, ERO, and SBIN-authorized federal tax software submitter. Elizabeth is also a licensed barber, Indiana substitute teacher, OSHA 10-Hour certified, EPA 608 Certified Proctor (ESCO #358010 and Mainstream Engineering), and Certiport Authorized Testing Center (CATC) operator. She founded Elevate for Humanity — a DOL Registered Apprenticeship Sponsor and Indiana ETPL/WIOA/WRG/JRI-approved workforce provider — and also leads Elevate tax operations and Selfish Inc., a 501(c)(3) nonprofit providing VITA free tax prep and community services.',
    headshotSrc: '/images/team/elizabeth-greene-headshot.webp',
    email: '',
    credentials: [
      'U.S. Army Veteran — Unit Supply Specialist',
      'IRS Enrolled Agent (EA)',
      'EFIN / PTIN holder',
      'Licensed Barber (Indiana)',
      'Indiana Substitute Teacher',
      'OSHA 10-Hour',
      'EPA 608 Certified Proctor (ESCO #358010, Mainstream Engineering)',
      'Certiport Authorized Testing Center (CATC) Operator',
    ],
  },
  {
    id: '2',
    name: 'Jozanna George',
    title: 'Director of Enrollment & Beauty Industry Programs',
    orgRole: 'Nail & Esthetics Industry Leadership',
    bio: 'Jozanna George is a multi-licensed beauty professional holding Nail Technician, Nail Instructor, and Esthetician licenses. Through Mesmerized by Beauty Cosmetology Academy, she leads beauty-industry education and brings hands-on experience in nail care, skincare, sanitation, client consultation, salon and spa professionalism, technical skill development, and student preparation. At Elevate for Humanity, she directs enrollment and beauty-industry programs and supports Nail Technician and Esthetician apprentices from application through career readiness.',
    headshotSrc: '/images/jozanna-george.jpg',
    email: 'jozanna@elevateforhumanity.org',
    credentials: [
      'Indiana Nail Technician License',
      'Indiana Nail Instructor License',
      'Indiana Esthetician License',
    ],
  },
  {
    id: '3',
    name: 'Dr. Carlina Wilkes',
    title: 'Executive Director of Financial Operations & Organizational Compliance',
    orgRole: 'Chair, Financial Literacy',
    bio: 'Dr. Carlina Wilkes brings more than 24 years of federal financial management experience with the Defense Finance and Accounting Service (DFAS) and holds DoD Financial Management Certification Level II. Her expertise includes federal cost accounting, budget development and monitoring, audit readiness, regulatory compliance, financial reporting, and long-term financial planning. At Elevate for Humanity, she oversees financial operations and organizational compliance and leads the Elevate Financial Empowerment Program, helping participants turn financial knowledge into practical plans for stability, independence, and long-term wellness.',
    headshotSrc: '/images/carlina-wilkes.jpg',
    email: 'carlina@elevateforhumanity.org',
    credentials: ['DoD Financial Management Certification Level II'],
  },
  {
    id: '5',
    name: 'Leslie Wafford',
    title: 'Director of Community Services',
    orgRole: 'Community & Supportive Services',
    bio: 'Leslie promotes low-barrier housing access and eviction prevention, helping families navigate housing challenges with her "reach one, teach one" philosophy.',
    headshotSrc: '/images/leslie-wafford.webp',
    email: 'leslie@elevateforhumanity.org',
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
    id: '11',
    name: 'Ameco L. Martin',
    title: 'IT/IS Technology Instructor',
    orgRole: 'Information Technology Programs',
    bio: `Ameco L. Martin is an experienced information technology professional, business leader, and educator who brings technical knowledge, healthcare information systems experience, and real-world business expertise to her role as an IT/IS Technology Instructor with Elevate for Humanity.

Ameco holds a Bachelor's degree in Business Information Systems with a major in Computer Programming. Her professional background includes work as a Clinical Information Systems Specialist and Cerner programmer with Indiana University Health, connecting computer systems, healthcare operations, data, workflow processes, and end-user support.

With more than 27 years of professional experience in healthcare, Ameco's career has evolved from direct patient care and rehabilitation services to healthcare billing, information systems, technology, operations, and executive leadership. She is also an entrepreneur, business consultant, author, and organizational leader with experience developing businesses, implementing administrative systems, training staff, and improving technology-driven workflows.

Her teaching emphasizes hands-on learning, digital literacy, problem-solving, computer and information systems fundamentals, workplace technology, and practical application. She helps students connect technical skills to career opportunities in information technology, information systems, healthcare technology, business technology, and other technology-driven careers. Her philosophy is simple: technology is more than learning a computer - it is learning how to use information, systems, and innovation to create opportunities and solve real-world problems.`,
    headshotSrc: '/images/ameco-martin.jpg',
    email: 'amecosenterprise@gmail.com',
    credentials: ["Bachelor's Degree in Business Information Systems (major: Computer Programming)"],
  },
  {
    id: '12',
    name: 'David Nazario',
    title: 'HVAC Instructor',
    orgRole: 'Skilled Trades Programs',
    bio: 'David Nazario is Elevate for Humanity\u2019s HVAC instructor. He teaches HVAC fundamentals and EPA Section 608 examination preparation through instructor-led and practical sessions, built around a 48-hour hands-on syllabus covering residential split systems, gas furnaces, and core service procedures.',
    // No portrait on file yet — do not substitute a generated or stock image.
  },
  {
    id: '14',
    name: 'Alberta Davis',
    title: 'Testing Center Coordinator & Exam Proctor',
    orgRole: 'Credential Testing',
    bio: 'Alberta Davis serves as a Testing Center Coordinator and Exam Proctor at Elevate for Humanity\u2019s Workforce Credential Testing Center in Indianapolis. She supports the administration of industry-recognized certification exams and workforce assessments for individuals, employers, schools, and workforce development partners. In her role, Alberta coordinates testing appointments, prepares testing stations, and assists candidates through the check-in and identity verification process to ensure each testing session begins smoothly. As an exam proctor, she monitors in-person and live testing sessions to maintain compliance with certification provider policies and exam security standards. Alberta also assists with onsite testing events for partner organizations and workforce programs, helping expand access to credential testing opportunities across the community.',
    email: 'alberta@elevateforhumanity.org',
    credentials: ['Certified Exam Proctor (Certiport, NHA, EPA 608)'],
    // No portrait on file yet — do not substitute a generated or stock image.
  },
  {
    id: '15',
    name: 'Tempestt Barnes',
    title: 'Gary-Area Site Coordinator',
    orgRole: 'Regional Coordination',
    bio: 'Tempestt Barnes is a Gary-area site coordinator for Elevate for Humanity, supporting local partner communications, site planning coordination, and community outreach across Northwest Indiana.',
    // No portrait on file yet — do not substitute a generated or stock image.
  },
  {
    id: '16',
    name: 'Matthew Barnes',
    title: 'Gary-Area Site Coordinator',
    orgRole: 'Regional Coordination',
    bio: 'Matthew Barnes is a Gary-area site coordinator for Elevate for Humanity, supporting local partner communications, site planning coordination, and community outreach across Northwest Indiana.',
    // No portrait on file yet — do not substitute a generated or stock image.
  },
];

export const FOUNDER = TEAM[0];

/** Members to show in the homepage preview (founder + 3 others) */
export const TEAM_PREVIEW = [TEAM[0], TEAM[2], TEAM[1], TEAM[3]];

