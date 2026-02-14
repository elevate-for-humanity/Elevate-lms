export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createPublicClient } from '@/lib/supabase/server';

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
    id: '1',
    name: 'Elizabeth Greene',
    title: 'Founder & Chief Executive Officer',
    image_url: '/images/team/elizabeth-greene.jpg',
    bio: 'Elizabeth founded Elevate for Humanity with a mission to connect everyday people to free workforce training. She also owns Textures Institute of Cosmetology, Greene Staffing Solutions, and Greene Property Management—creating a holistic ecosystem for training, employment, and housing.',
    email: 'elizabeth@elevateforhumanity.org',
  },
  {
    id: '2',
    name: 'Jozanna George',
    title: 'Director of Enrollment & Beauty Industry Programs',
    image_url: '/images/jozanna-george.jpg',
    bio: 'Jozanna is a multi-licensed beauty professional holding Nail Technician, Nail Instructor, and Esthetician licenses. She oversees the nail program at Textures Institute of Cosmetology and manages enrollment operations for Elevate for Humanity.',
    email: 'jozanna@elevateforhumanity.org',
  },
  {
    id: '3',
    name: 'Dr. Carlina Wilkes',
    title: 'Executive Director of Financial Operations & Organizational Compliance',
    image_url: '/images/carlina-wilkes.jpg',
    bio: 'Dr. Wilkes brings 24+ years of federal experience with DFAS, holding DoD Financial Management Certification Level II. She oversees financial operations and compliance at Elevate for Humanity.',
    email: 'carlina@elevateforhumanity.org',
  },
  {
    id: '4',
    name: 'Sharon Douglass',
    title: 'Respiratory Therapy & Health Informatics Specialist',
    image_url: '/images/sharon-douglas.jpg',
    bio: 'Sharon brings 30+ years as a Respiratory Therapist with a Master\'s in Health Informatics. She supports healthcare training programs and workforce readiness initiatives.',
    email: 'sharon@elevateforhumanity.org',
  },
  {
    id: '5',
    name: 'Leslie Wafford',
    title: 'Director of Community Services',
    image_url: '/images/leslie-wafford.jpg',
    bio: 'Leslie promotes low-barrier housing access and eviction prevention, helping families navigate housing challenges with her "reach one, teach one" philosophy.',
    email: 'leslie@elevateforhumanity.org',
  },
  {
    id: '6',
    name: 'Alina Smith, PMHNP',
    title: 'Psychiatric Mental Health Nurse Practitioner',
    image_url: '/images/alina-smith.jpg',
    bio: 'Alina is a board-certified PMHNP from Purdue University, providing mental health assessments, interventions, and medication management for program participants.',
    email: 'alina@elevateforhumanity.org',
  },
  {
    id: '7',
    name: 'Delores Reynolds',
    title: 'Social Media & Digital Engagement Coordinator',
    image_url: '/images/delores-reynolds.jpg',
    bio: 'Delores manages digital communications, sharing student success stories and promoting program offerings to reach those who can benefit from free training.',
    email: 'delores@elevateforhumanity.org',
  },
];

export default async function TeamPage() {
  const supabase = createPublicClient();

  // Fetch team members from database
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  // Only use database data - no fake fallbacks
  const members = teamMembers || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'About', href: '/about' },
              { label: 'Our Team' },
            ]}
          />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[300px] overflow-hidden">
        <Image
          src="/images/heroes/about-team.jpg"
          alt="Our Team"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-6xl mx-auto px-4 w-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
              Our Team
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-200 max-w-2xl">
              Meet the dedicated professionals transforming lives through education and career training.
            </p>
          </div>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-10 sm:py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {members.length > 0 ? (
            <div className="space-y-10 sm:space-y-12 md:space-y-16">
              {members.map((member: any) => (
                <div key={member.id} className="grid md:grid-cols-3 gap-6 sm:gap-8 items-start">
                  <div className="md:col-span-1">
                    <div className="relative w-full aspect-square max-w-[300px] mx-auto rounded-xl overflow-hidden shadow-lg">
                      <Image
                        src={member.image_url || '/images/avatar-default.svg'}
                        alt={member.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">
                      {member.name}
                    </h2>
                    <p className="text-lg text-blue-600 font-medium mb-4">
                      {member.title}
                    </p>
                    {member.bio && (
                      <div className="prose prose-slate max-w-none">
                        {member.bio.split('\n\n').map((paragraph: string, idx: number) => (
                          <p key={idx} className="text-slate-600 mb-4">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    )}
                    {member.email && (
                      <p className="mt-4">
                        <a href={`mailto:${member.email}`} className="text-blue-600 hover:underline">
                          {member.email}
                        </a>
                      </p>
                    )}
                    {member.linkedin_url && (
                      <a
                        href={member.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-2 text-blue-600 hover:underline"
                      >
                        LinkedIn Profile
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">Contact us to learn more about our team.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Join Our Mission
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            We are always looking for passionate individuals to join our team.
          </p>
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            View Open Positions
          </Link>
        </div>
      </section>
    </div>
  );
}
