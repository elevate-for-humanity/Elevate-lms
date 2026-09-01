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
    bio: 'U.S. Army veteran (Unit Supply Specialist), IRS Enrolled Agent (EA), EFIN/PTIN holder, ERO, and SBIN-authorized federal tax software submitter. Elizabeth is also a licensed barber, Indiana substitute teacher, OSHA 10-Hour certified, EPA 608 Certified Proctor (ESCO #358010 and Mainstream Engineering), and Certiport Authorized Testing Center (CATC) operator. She founded Elevate for Humanity — a DOL Registered Apprenticeship Sponsor and Indiana ETPL/WIOA/WRG/JRI-approved workforce provider — and also leads Elevate tax operations and Selfish Inc., a 501(c)(3) nonprofit providing VITA free tax prep and community services.',
    headshotSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/team/elizabeth-greene-headshot.webp',
    email: '',
  },
  {
    id: '2',
    name: 'Jozanna George',
    title: 'Director of Enrollment & Beauty Industry Programs',
    orgRole: 'Enrollment & Instruction',
    bio: 'Jozanna is a multi-licensed beauty professional holding Nail Technician, Nail Instructor, and Esthetician licenses. She oversees the nail program at Textures Institute of Cosmetology and manages enrollment operations for Elevate for Humanity.',
    headshotSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/jozanna-george.jpg',
    email: 'jozanna@elevateforhumanity.org',
  },
  {
    id: '3',
    name: 'Dr. Carlina Wilkes',
    title: 'Executive Director of Financial Operations & Organizational Compliance',
    orgRole: 'Financial Empowerment Program Instructor',
    bio: 'Dr. Carlina Wilkes brings more than 24 years of federal financial management experience with the Defense Finance and Accounting Service (DFAS) and holds DoD Financial Management Certification Level II. Her expertise includes federal cost accounting, budget development and monitoring, audit readiness, regulatory compliance, financial reporting, and long-term financial planning. At Elevate for Humanity, she oversees financial operations and organizational compliance and leads the Elevate Financial Empowerment Program, helping participants turn financial knowledge into practical plans for stability, independence, and long-term wellness.',
    headshotSrc: '/images/carlina-wilkes.jpg',
    email: 'carlina@elevateforhumanity.org',
  },
  {
    id: '5',
    name: 'Leslie Wafford',
    title: 'Director of Community Services',
    orgRole: 'Community & Supportive Services',
    bio: 'Leslie promotes low-barrier housing access and eviction prevention, helping families navigate housing challenges with her "reach one, teach one" philosophy.',
    headshotSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/leslie-wafford.webp',
    email: 'leslie@elevateforhumanity.org',
  },
  {
    id: '7',
    name: 'Delores Reynolds',
    title: 'Social Media & Digital Engagement Coordinator',
    orgRole: 'Communications',
    bio: 'Delores manages digital communications, sharing student success stories and promoting program offerings to reach those who can benefit from funded training.',
    headshotSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/delores-reynolds.jpg',
    email: 'delores@elevateforhumanity.org',
  },
  {
    id: '8',
    name: 'Clystjah Woodley',
    title: 'Program Coordinator',
    orgRole: 'Program Operations',
    bio: 'Clystjah supports program operations and student services, helping participants navigate enrollment and stay on track through their training programs.',
    headshotSrc: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/clystjah-woodley.jpg',
    email: 'clystjah@elevateforhumanity.org',
  },
  {
    id: '11',
    name: 'Ameco Martin',
    title: 'Director of Information Technology',
    orgRole: 'Information Technology Programs',
    bio: 'Ameco Martin holds an Associate\'s Degree in Business and a Bachelor\'s Degree in Computer Programming. She is the owner of Ameco\'s Enterprise LLC, located at 6110 West 25th Street, Unit 241022, Indianapolis, IN 46224. She serves as Director of Information Technology at Elevate for Humanity, overseeing all IT and technology credential programs including IT Help Desk / CompTIA A+, Cybersecurity Analyst, Network Administration, Network Support Technician, Web Development, Software Development, Graphic Design, CAD/Drafting, and related business technology programs. She also serves as the dedicated Career Coach embedded full-time at Warren Central High School under Elevate\'s WIOA In-School Youth contract with EmployIndy.',
    headshotSrc: '/images/ameco-martin.jpg',
    email: 'amecosenterprise@gmail.com',
  },
];

export const FOUNDER = TEAM[0];

/** Members to show in the homepage preview (founder + 3 others) */
export const TEAM_PREVIEW = [TEAM[0], TEAM[2], TEAM[1], TEAM[3]];
