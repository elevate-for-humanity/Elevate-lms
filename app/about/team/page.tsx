import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/about/team',
  },
  title: 'Our Team | Elevate For Humanity',
  description:
    "Meet the dedicated professionals leading Elevate For Humanity's mission to transform lives through education and career training.",
};

// Fallback team data when database is empty
const fallbackTeam = [
  {
    id: '1', slug: 'elizabeth-greene',
    name: 'Elizabeth Greene',
    title: 'Founder & Chief Executive Officer',
    image_url: '/images/team/elizabeth-greene-headshot.jpg',
    bio: 'U.S. Army veteran (Unit Supply Specialist), IRS Enrolled Agent (EA), EFIN and PTIN holder, licensed barber, Indiana substitute teacher, EPA 608 Certified Proctor. Elizabeth founded Elevate for Humanity to connect people to funded workforce training. She also operates SupersonicFastCash, a tax preparation software company.',
    email: '',
  },
  {
    id: '2', slug: 'jozanna-george',
    name: 'Jozanna George',
    title: 'Director of Enrollment & Beauty Industry Programs',
    image_url: '/images/jozanna-george.jpg',
    bio: 'Jozanna is a multi-licensed beauty professional holding Nail Technician, Nail Instructor, and Esthetician licenses. She oversees the nail program at Textures Institute of Cosmetology and manages enrollment operations for Elevate for Humanity.',
    email: 'jozanna@elevateforhumanity.org',
  },
  {
    id: '3', slug: 'carlina-wilkes',
    name: 'Dr. Carlina Wilkes',
    title: 'Executive Director of Financial Operations & Organizational Compliance',
    image_url: '/images/carlina-wilkes.jpg',
    bio: 'Dr. Wilkes brings 24+ years of federal experience with DFAS, holding DoD Financial Management Certification Level II. She oversees financial operations and compliance at Elevate for Humanity.',
    email: 'carlina@elevateforhumanity.org',
  },
  {
    id: '5', slug: 'leslie-wafford',
    name: 'Leslie Wafford',
    title: 'Director of Community Services',
    image_url: '/images/leslie-wafford.jpg',
    photoPosition: 'object-top',
    bio: 'Leslie promotes low-barrier housing access and eviction prevention, helping families navigate housing challenges with her "reach one, teach one" philosophy.',
    email: 'leslie@elevateforhumanity.org',
  },
  {
    id: '6', slug: 'alina-smith',
    name: 'Alina Smith, PMHNP',
    title: 'Psychiatric Mental Health Nurse Practitioner',
    image_url: '/images/alina-smith.jpg',
    bio: 'Alina is a board-certified PMHNP from Purdue University, providing mental health assessments, interventions, and medication management for program participants.',
    email: 'alina@elevateforhumanity.org',
  },
  {
    id: '7', slug: 'delores-reynolds',
    name: 'Delores Reynolds',
    title: 'Social Media & Digital Engagement Coordinator',
    image_url: '/images/delores-reynolds.jpg',
    bio: 'Delores manages digital communications, sharing student success stories and promoting program offerings to reach those who can benefit from funded training.',
    email: 'delores@elevateforhumanity.org',
  },
  {
    id: '8', slug: 'clystjah-woodley',
    name: 'Clystjah Woodley',
    title: 'Program Coordinator',
    image_url: '/images/clystjah-woodley.jpg',
    bio: 'Clystjah supports program operations and student services, helping participants navigate enrollment and stay on track through their training programs.',
    email: 'clystjah@elevateforhumanity.org',
  },
  {
    id: '9', slug: 'jesse-wilkerson',
    name: 'Jesse J. Wilkerson',
    title: 'Principal — Architecture & Design-Build',
    image_url: '/images/team/jesse-wilkerson.jpg',
    bio: 'Jesse J. Wilkerson is the Principal of Jesse J. Wilkerson & Associates S-Corp, an architectural and design firm specializing in construction trade integration, architectural planning, and built environment solutions. With a strong focus on architecture aligned with real-world construction and workforce development, Jesse leads projects that bridge architectural design, site operations, and trade execution across commercial, industrial, and institutional environments. His work emphasizes practical design, structural coordination, compliance, and efficient construction workflows, ensuring that architectural planning supports both skilled trades and modern infrastructure needs.',
    email: '',
  },
  {
    id: '11', slug: 'amir-naseen',
    name: 'Amir Naseen',
    title: 'Credit Repair Specialist',
    image_url: '/images/team/amir-naseen.jpg',
    bio: 'Amir Naseen serves as a Credit Repair Specialist supporting financial readiness and workforce advancement initiatives. He specializes in credit education, credit profile analysis, and strategic dispute processes that help individuals improve financial stability and access employment, housing, and training opportunities. Amir works closely with clients to review credit reports, identify inaccuracies, develop corrective action plans, and provide guidance on responsible credit management aligned with long-term financial growth. His approach focuses on compliance, documentation accuracy, and ethical credit restoration practices that support career development, workforce participation, and economic empowerment within structured training and support programs.',
    email: '',
  },
];

export default async function TeamPage() {
  // Use canonical team data from data/team.ts — the DB has fake seed data
  const members = fallbackTeam;

  return (
    <div className="min-h-screen bg-white">      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'About', href: '/about' },
              { label: 'Our Team' },
            ]}
          />
        </div>
      </div>

      {/* Hero — image only, no text overlay */}
      <section className="relative h-[300px] sm:h-[400px] overflow-hidden">
        <Image src="/images/pages/team-hero.jpg" alt="Elevate for Humanity team" fill sizes="100vw" className="object-cover" priority />
      </section>

      {/* Team Grid — 3 across, Elizabeth centered top */}
      <section className="py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Elizabeth — centered top */}
          <div className="flex justify-center mb-8">
            <Link href={`/about/team/${members[0].slug}`} className="group block w-44">
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition">
                <Image
                  src={members[0].image_url || '/images/avatar-default.svg'}
                  alt={members[0].name}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                  sizes="176px"
                />
              </div>
              <div className="mt-3 text-center">
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-red-600 transition">{members[0].name}</h3>
                <p className="text-xs text-slate-500">{members[0].title}</p>
                <p className="text-xs text-brand-red-600 font-semibold mt-1">View Bio →</p>
              </div>
            </Link>
          </div>

          {/* Middle members — 3 across */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 justify-items-center">
            {members.slice(1, -1).map((member: any) => (
              <Link key={member.id} href={`/about/team/${member.slug}`} className="group block w-44">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition">
                  <Image
                    src={member.image_url || '/images/avatar-default.svg'}
                    alt={member.name}
                    fill
                    className={`object-cover group-hover:scale-105 transition duration-300 ${member.photoPosition || ''}`}
                    sizes="176px"
                  />
                </div>
                <div className="mt-3 text-center">
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-red-600 transition">{member.name}</h3>
                  <p className="text-xs text-slate-500">{member.title}</p>
                  <p className="text-xs text-brand-red-600 font-semibold mt-1">View Bio →</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Last member — centered bottom */}
          <div className="flex justify-center mt-8">
            <Link href={`/about/team/${members[members.length - 1].slug}`} className="group block w-44">
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition">
                <Image
                  src={members[members.length - 1].image_url || '/images/avatar-default.svg'}
                  alt={members[members.length - 1].name}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                  sizes="176px"
                />
              </div>
              <div className="mt-3 text-center">
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-red-600 transition">{members[members.length - 1].name}</h3>
                <p className="text-xs text-slate-500">{members[members.length - 1].title}</p>
                <p className="text-xs text-brand-red-600 font-semibold mt-1">View Bio →</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Join Our Mission
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            We are always looking for passionate individuals to join our team.
          </p>
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
          >
            View Open Positions
          </Link>
        </div>
      </section>
    </div>
  );
}
