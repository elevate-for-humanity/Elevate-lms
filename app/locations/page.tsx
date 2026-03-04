import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, Clock, Navigation } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Locations | Elevate for Humanity',
  description:
    'Visit Elevate for Humanity at our Indianapolis locations. Find directions, hours, and contact information.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/locations',
  },
};

export const dynamic = 'force-dynamic';

interface Location {
  id: string;
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  phone: string | null;
  email: string | null;
  hours: Record<string, string> | null;
  is_main_office: boolean;
}

export default async function LocationsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: locations, error } = await db
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .order('is_main_office', { ascending: false })
    .order('name');

  if (error || !locations || locations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Locations</h1>
          <p className="text-gray-600 mb-6">Location information is being updated.</p>
          <Link href="/contact" className="text-brand-blue-600 hover:underline">
            Contact us for location details
          </Link>
        </div>
      </div>
    );
  }

  const mainOffice = locations.find((l: Location) => l.is_main_office);
  const otherLocations = locations.filter((l: Location) => !l.is_main_office);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Locations' }]} />
        </div>
      </div>

      {/* Hero Image */}
      <section className="relative h-[200px] sm:h-[280px] md:h-[340px]">
        <Image src="/images/pages/locations-page-1.jpg" alt="Training locations in Indianapolis" fill sizes="100vw" className="object-cover" priority />
      </section>

      {/* Title */}
      <section className="bg-brand-blue-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Our Locations</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Visit us in Indianapolis to learn more about our programs and services.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Main Office */}
        {mainOffice && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Main Campus</h2>
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{mainOffice.name}</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-brand-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-gray-900">{mainOffice.address_line1}</p>
                        {mainOffice.address_line2 && (
                          <p className="text-gray-900">{mainOffice.address_line2}</p>
                        )}
                        <p className="text-gray-900">
                          {mainOffice.city}, {mainOffice.state} {mainOffice.zip_code}
                        </p>
                      </div>
                    </div>

                    {mainOffice.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-brand-blue-600 flex-shrink-0" />
                        <a href={`tel:${mainOffice.phone.replace(/\D/g, '')}`} className="text-brand-blue-600 hover:underline">
                          {mainOffice.phone}
                        </a>
                      </div>
                    )}

                    {mainOffice.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-brand-blue-600 flex-shrink-0" />
                        <a href={`mailto:${mainOffice.email}`} className="text-brand-blue-600 hover:underline">
                          {mainOffice.email}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${mainOffice.address_line1}, ${mainOffice.city}, ${mainOffice.state} ${mainOffice.zip_code}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition"
                    >
                      <Navigation className="w-5 h-5" />
                      Get Directions
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-brand-blue-600" />
                    Hours of Operation
                  </h4>
                  <div className="space-y-2 text-gray-600">
                    <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                    <p>Saturday: 9:00 AM - 1:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Other Locations */}
        {otherLocations.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Training Centers</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {otherLocations.map((location: Location) => (
                <div key={location.id} className="bg-white border rounded-xl p-6 hover:shadow-md transition">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{location.name}</h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{location.address_line1}</p>
                        <p>{location.city}, {location.state} {location.zip_code}</p>
                      </div>
                    </div>

                    {location.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a href={`tel:${location.phone.replace(/\D/g, '')}`} className="text-brand-blue-600 hover:underline">
                          {location.phone}
                        </a>
                      </div>
                    )}

                    {location.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a href={`mailto:${location.email}`} className="text-brand-blue-600 hover:underline">
                          {location.email}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${location.address_line1}, ${location.city}, ${location.state} ${location.zip_code}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue-600 text-sm font-medium hover:underline"
                    >
                      Get Directions →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="bg-slate-50 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Locations FAQ</h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              { q: 'Do I need to visit in person to enroll?', a: 'No, you can complete the enrollment process online or by phone. However, we welcome campus visits to tour facilities and meet staff.' },
              { q: 'Where does training take place?', a: 'Training locations vary by program. Some programs are at our main facility, others at partner sites. Your enrollment advisor will provide specific location details.' },
              { q: 'Is parking available?', a: 'Yes, free parking is available at all our training locations. Specific parking instructions are provided during orientation.' },
              { q: 'Are locations accessible?', a: 'Yes, all our facilities are ADA accessible. Contact us if you need specific accommodations.' },
              { q: 'Can I transfer between locations?', a: 'In some cases, yes. Speak with your program coordinator about transfer options if your situation changes.' },
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
        </section>

        {/* CTA */}
        <section className="bg-brand-blue-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Visit?</h2>
          <p className="text-brand-blue-100 mb-6 max-w-xl mx-auto">
            Schedule a campus tour or meet with an enrollment advisor to learn about our programs.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="px-6 py-3 bg-white text-brand-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              Schedule a Visit
            </Link>
            <Link
              href="/apply"
              className="px-6 py-3 bg-brand-blue-500 text-white font-semibold rounded-lg hover:bg-brand-blue-400 transition"
            >
              Apply Now
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
