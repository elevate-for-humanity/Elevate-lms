import { Metadata } from 'next';
import Link from 'next/link';
import { Users, Mail, Linkedin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our Team | Elevate for Humanity',
  description: 'Meet the team at Elevate for Humanity working to build workforce pathways.',
};

export default function TeamPage() {
  const team = [
    {
      name: 'Leadership Team',
      members: [
        { name: 'Dr. James Mitchell', title: 'Executive Director', bio: 'Leading workforce development initiatives across Indiana.' },
        { name: 'Sarah Johnson', title: 'Director of Programs', bio: 'Overseeing training programs and apprenticeship operations.' },
        { name: 'Michael Chen', title: 'Director of Partnerships', bio: 'Building employer and agency partnerships.' },
      ]
    },
    {
      name: 'Instructional Team',
      members: [
        { name: 'Jennifer Williams', title: 'Lead Instructor - Healthcare', bio: 'RN with 15+ years of clinical and teaching experience.' },
        { name: 'Robert Martinez', title: 'Lead Instructor - Trades', bio: 'Master HVAC technician and apprenticeship trainer.' },
        { name: 'Lisa Thompson', title: 'Career Services Coordinator', bio: 'Connecting graduates with employment opportunities.' },
      ]
    },
    {
      name: 'Support Team',
      members: [
        { name: 'David Brown', title: 'Student Services Manager', bio: 'Supporting students from enrollment through graduation.' },
        { name: 'Amanda Garcia', title: 'Financial Aid Specialist', bio: 'Helping students navigate funding and payment options.' },
        { name: 'Christopher Lee', title: 'IT & Platform Manager', bio: 'Managing the Elevate technology platform.' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Team</h1>
          <p className="text-xl text-blue-100">
            Dedicated professionals committed to workforce development.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          {team.map((group) => (
            <div key={group.name} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">{group.name}</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {group.members.map((member) => (
                  <div key={member.name} className="bg-slate-50 rounded-xl p-6">
                    <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-brand-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                    <p className="text-brand-blue-600 font-medium text-sm mb-2">{member.title}</p>
                    <p className="text-gray-600 text-sm">{member.bio}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Our Team</h2>
          <p className="text-gray-600 mb-8">
            We are always looking for passionate professionals to join our mission.
          </p>
          <Link href="/careers" className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700">
            View Open Positions
          </Link>
        </div>
      </section>
    </div>
  );
}
