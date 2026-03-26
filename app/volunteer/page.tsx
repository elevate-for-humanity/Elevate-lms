import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { Heart, Users, Clock, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Volunteer Opportunities | Elevate For Humanity',
  description: 'Make a difference in your community. Join our volunteer programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/volunteer',
  },
};

export const dynamic = 'force-dynamic';

export default async function VolunteerPage() {
  const supabase = await createClient();

  // Fetch volunteer opportunities from database
  const { data: opportunities, error } = await supabase
    .from('volunteer_opportunities')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching opportunities:', error.message);
  }

  const opportunityList = opportunities || [];

  const benefits = [
    'Make a real impact in your community',
    'Gain valuable experience and skills',
    'Network with like-minded individuals',
    'Flexible scheduling options',
    'Certificate of volunteer service',
    'Letter of recommendation available',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Volunteer' }]} />
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-[40vh] min-h-[300px] flex items-center overflow-hidden">
        <Image
          src="/images/pages/volunteer-page-1.jpg"
          alt="Volunteer with Elevate"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Benefits */}
        <div className="bg-white rounded-xl border p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Volunteer?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4 h-4 text-brand-orange-600" />
                </div>
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Opportunities</h2>
        
        {opportunityList.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {opportunityList.map((opp: any) => (
              <div key={opp.id} className="bg-white rounded-xl border p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{opp.title}</h3>
                    <p className="text-sm text-gray-500">{opp.category || 'General'}</p>
                  </div>
                  {opp.spots_available && (
                    <span className="px-2 py-1 bg-brand-green-100 text-brand-green-700 text-xs rounded-full">
                      {opp.spots_available} spots
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-4 line-clamp-2">{opp.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                  {opp.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {opp.location}
                    </span>
                  )}
                  {opp.time_commitment && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {opp.time_commitment}
                    </span>
                  )}
                  {opp.schedule && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {opp.schedule}
                    </span>
                  )}
                </div>
                <Link
                  href={`/volunteer/apply?opportunity=${opp.id}`}
                  className="inline-flex items-center gap-2 text-brand-orange-600 font-medium hover:underline"
                >
                  Apply Now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No opportunities listed</h3>
            <p className="text-gray-600 mb-6">No volunteer opportunities posted yet. Contact us to express your interest and we will reach out when openings are available.</p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange-500 text-white rounded-lg hover:bg-brand-orange-600"
            >
              Contact Us
            </Link>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-12 bg-white rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Volunteer FAQ</h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              { q: 'What volunteer opportunities are available?', a: 'We need mentors, guest speakers, mock interview partners, resume reviewers, and event volunteers. Opportunities vary based on current needs.' },
              { q: 'How much time do I need to commit?', a: 'Commitments vary. Some roles are one-time (guest speaker), others are ongoing (mentor). We work with your schedule.' },
              { q: 'Do I need specific qualifications?', a: 'It depends on the role. Mentors should have industry experience. Other roles just require enthusiasm and reliability.' },
              { q: 'Is there a background check?', a: 'Yes, volunteers working directly with students undergo background checks. This is standard for educational organizations.' },
              { q: 'Can I volunteer remotely?', a: 'Some roles like resume review can be done remotely. Others like mock interviews work best in person. We\'ll match you with appropriate opportunities.' },
            ].map((faq, i) => (
              <details key={i} className="bg-white rounded-xl overflow-hidden shadow-sm group">
                <summary className="p-4 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                  {faq.q}
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-4 pb-4 text-slate-600">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-brand-blue-700 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">
            Whether you have a few hours or want to commit long-term, we have opportunities for you.
          </p>
          <Link
            href="/volunteer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange-500 text-white rounded-lg hover:bg-brand-orange-600"
          >
            Apply to Volunteer <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
