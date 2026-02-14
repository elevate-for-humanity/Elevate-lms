import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { Calendar, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mentorship Program | Alumni',
  description: 'Connect with mentors in your field.',
};

export const dynamic = 'force-dynamic';

export default async function MentorshipPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login?next=/lms/alumni/mentorship');

  // Fetch mentors from database
  const { data: mentors, error } = await supabase
    .from('mentors')
    .select(`
      id,
      bio,
      expertise,
      availability,
      is_active,
      profile:profiles(full_name, avatar_url, role)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching mentors:', error.message);
  }

  const mentorList = mentors || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative h-64 overflow-hidden">
        <Image
          src="/images/team-hq/team-meeting.jpg"
          alt="Mentorship Program"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-brand-blue-900/60" />
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-6xl mx-auto px-4 w-full">
            <h1 className="text-4xl font-bold text-white mb-2">Mentorship Program</h1>
            <p className="text-xl text-brand-blue-100">Connect with experienced professionals in your field</p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="relative h-32">
              <Image src="/images/healthcare/healthcare-professional-portrait-1.jpg" alt="Career Guidance" fill className="object-cover" />
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-2">Career Guidance</h3>
              <p className="text-gray-600 text-sm">Get personalized advice from industry professionals</p>
            </div>
          </div>
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="relative h-32">
              <Image src="/images/business/tax-prep-certification.jpg" alt="Networking" fill className="object-cover" />
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-2">Networking</h3>
              <p className="text-gray-600 text-sm">Build connections that can open doors</p>
            </div>
          </div>
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="relative h-32">
              <Image src="/images/trades/program-building-construction.jpg" alt="Skill Development" fill className="object-cover" />
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-2">Skill Development</h3>
              <p className="text-gray-600 text-sm">Learn from real-world experience</p>
            </div>
          </div>
        </div>

        {/* Mentors */}
        {mentorList.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentorList.map((mentor: any, idx: number) => {
              const images = [
                '/images/healthcare/hero-healthcare-professionals.jpg',
                '/images/trades/program-hvac-technician.jpg',
                '/images/technology/hero-programs-technology.jpg',
                '/images/trades/program-electrical-training.jpg',
                '/images/barber-hero.jpg',
                '/images/business/program-tax-preparation.jpg',
              ];
              return (
              <div key={mentor.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition">
                <div className="relative h-40">
                  <Image src={mentor.profile?.avatar_url || images[idx % images.length]} alt={mentor.profile?.full_name || 'Mentor'} fill className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900">{mentor.profile?.full_name || 'Industry Mentor'}</h3>
                  <p className="text-sm text-brand-blue-600 mb-2">{mentor.expertise || 'Industry Professional'}</p>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{mentor.bio || 'Experienced professional ready to help guide your career.'}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Calendar className="w-4 h-4" />
                    <span>{mentor.availability || 'Available for mentoring'}</span>
                  </div>
                  <Link
                    href={`/lms/alumni/mentorship/${mentor.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Connect
                  </Link>
                </div>
              </div>
            );})}
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="relative h-48">
              <Image src="/images/healthcare/healthcare-professional-portrait-1.jpg" alt="Mentorship" fill className="object-cover" />
            </div>
            <div className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Mentors Available</h2>
              <p className="text-gray-600 mb-6">Check back soon as we expand our mentor network.</p>
              <Link 
                href="/lms/alumni"
                className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
              >
                Return to Alumni Portal
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
