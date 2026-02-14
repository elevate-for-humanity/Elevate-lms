import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Car, Video } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Locations & Hours | Supersonic Fast Cash',
  description:
    'Visit our Indianapolis office or schedule a virtual appointment. Serving all 50 states.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/locations',
  },
};

export default async function LocationsPage() {
  const supabase = await createClient();

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
  
  // Fetch locations
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('brand', 'supersonic');
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Locations" }]} />
      </div>
{/* Hero */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-black">Visit Us or Meet Online</h1>
          <p className="text-xl text-black">
            In-person service in Indianapolis or virtual appointments nationwide
          </p>
        </div>
      </section>

      {/* Main Office */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Office Info */}
            <div>
              <h2 className="text-3xl font-bold text-black mb-8">
                Indianapolis Office
              </h2>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-brand-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-black mb-1">
                      Address
                    </div>
                    <div className="text-black">
                      8888 Keystone Crossing, Suite 1300
                      <br />
                      Indianapolis, IN 46240
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-brand-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-black mb-1">
                      Phone
                    </div>
                    <a
                      href="/support"
                      className="text-brand-blue-600 hover:text-brand-blue-700"
                    >
                      Get Help Online
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-brand-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-black mb-1">
                      Email
                    </div>
                    <a
                      href="mailto:supersonicfastcashllc@gmail.com"
                      className="text-brand-blue-600 hover:text-brand-blue-700"
                    >
                      supersonicfastcashllc@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-brand-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-black mb-2">
                      Hours
                    </div>
                    <div className="space-y-1 text-black">
                      <div className="flex justify-between gap-8">
                        <span>Monday - Friday:</span>
                        <span className="font-medium">9:00 AM - 7:00 PM</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span>Saturday:</span>
                        <span className="font-medium">10:00 AM - 4:00 PM</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span>Sunday:</span>
                        <span className="font-medium">Closed</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Car className="w-6 h-6 text-brand-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-black mb-1">
                      Parking
                    </div>
                    <div className="text-black">
                      Free parking available on-site
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/supersonic-fast-cash/book-appointment"
                  className="inline-flex items-center justify-center px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
                >
                  Book In-Person Visit
                </Link>
                <a
                  href="https://www.google.com/maps/place/8888+Keystone+Crossing,+Indianapolis,+IN+46240"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Get Directions
                </a>
              </div>
            </div>

            {/* Map */}
            <div className="bg-gray-100 rounded-xl overflow-hidden h-[500px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3063.8!2d-86.0!3d39.9!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMznCsDU0JzAwLjAiTiA4NsKwMDAnMDAuMCJX!5e0!3m2!1sen!2sus!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Virtual Services */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Video className="w-16 h-16 text-brand-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-black mb-4">
              Virtual Appointments Available
            </h2>
            <p className="text-xl text-black">
              Can't make it to our office? We offer secure video consultations
              for clients anywhere in the United States.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-black mb-2">
                Video Consultation
              </h3>
              <p className="text-sm text-black">
                Face-to-face meeting via secure video call
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-black mb-2">
                Phone Consultation
              </h3>
              <p className="text-sm text-black">
                Discuss your tax situation over the phone
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-black mb-2">Document Upload</h3>
              <p className="text-sm text-black">
                Securely upload documents online
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/supersonic-fast-cash/book-appointment"
              className="inline-block px-8 py-4 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              Schedule Virtual Appointment
            </Link>
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">
              Serving All 50 States
            </h2>
            <p className="text-xl text-black">
              While our office is in Indianapolis, we prepare returns for
              clients nationwide
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              'Alabama',
              'Alaska',
              'Arizona',
              'Arkansas',
              'California',
              'Colorado',
              'Connecticut',
              'Delaware',
              'Florida',
              'Georgia',
              'Hawaii',
              'Idaho',
              'Illinois',
              'Indiana',
              'Iowa',
              'Kansas',
              'Kentucky',
              'Louisiana',
              'Maine',
              'Maryland',
              'Massachusetts',
              'Michigan',
              'Minnesota',
              'Mississippi',
              'Missouri',
              'Montana',
              'Nebraska',
              'Nevada',
              'New Hampshire',
              'New Jersey',
              'New Mexico',
              'New York',
              'North Carolina',
              'North Dakota',
              'Ohio',
              'Oklahoma',
              'Oregon',
              'Pennsylvania',
              'Rhode Island',
              'South Carolina',
              'South Dakota',
              'Tennessee',
              'Texas',
              'Utah',
              'Vermont',
              'Virginia',
              'Washington',
              'West Virginia',
              'Wisconsin',
              'Wyoming',
            ].map((state) => (
              <div key={state} className="text-center py-2 text-black">
                {state}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            Visit us in Indianapolis or schedule a virtual appointment today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/supersonic-fast-cash/book-appointment"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-blue-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Book Appointment
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white font-semibold rounded-lg hover:bg-brand-blue-800 transition-colors border-2 border-white"
            >
              Call Get Help Online
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
