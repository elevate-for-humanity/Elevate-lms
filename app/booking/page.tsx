import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, MapPin, User, Video, Building } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Book an Appointment | Elevate For Humanity',
  description: 'Schedule a consultation, campus tour, or advising session with our team.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/booking',
  },
};

export const dynamic = 'force-dynamic';

export default async function BookingPage() {
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

  // Get available appointment types
  const { data: appointmentTypes } = await supabase
    .from('appointment_types')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  // Get staff available for appointments
  const { data: staff } = await supabase
    .from('staff')
    .select('id, name, title, department, avatar_url')
    .eq('accepts_appointments', true)
    .order('name', { ascending: true });

  // Get locations
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, address, city, state')
    .eq('is_active', true);

  const defaultAppointmentTypes = [
    {
      id: 'enrollment',
      name: 'Enrollment Consultation',
      description: 'Learn about our programs and enrollment process',
      duration: 30,
      icon: User,
    },
    {
      id: 'tour',
      name: 'Campus Tour',
      description: 'Visit our facilities and meet our team',
      duration: 60,
      icon: Building,
    },
    {
      id: 'advising',
      name: 'Academic Advising',
      description: 'Get guidance on program selection and career paths',
      duration: 45,
      icon: Calendar,
    },
    {
      id: 'financial',
      name: 'Financial Aid Consultation',
      description: 'Discuss funding options and WIOA eligibility',
      duration: 30,
      icon: Clock,
    },
    {
      id: 'virtual',
      name: 'Virtual Information Session',
      description: 'Join an online session to learn about Elevate',
      duration: 45,
      icon: Video,
    },
  ];

  const displayTypes = appointmentTypes && appointmentTypes.length > 0 
    ? appointmentTypes 
    : defaultAppointmentTypes;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Booking' }]} />
        </div>
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/programs-hq/training-classroom.jpg" alt="Hero image" fill className="object-cover" priority quality={90} sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Book an Appointment</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Schedule a consultation, campus tour, or advising session with our team.</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Appointment Types */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Select Appointment Type</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTypes.map((type: any) => {
              const IconComponent = type.icon || Calendar;
              return (
                <Link
                  key={type.id}
                  href={`/booking/${type.id}`}
                  className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition group"
                >
                  <IconComponent className="w-10 h-10 text-slate-700 mb-4 group-hover:text-slate-900" />
                  <h3 className="font-semibold text-xl mb-2">{type.name}</h3>
                  <p className="text-gray-600 mb-4">{type.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{type.duration} minutes</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Locations */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Our Locations</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {locations && locations.length > 0 ? (
              locations.map((location: any) => (
                <div key={location.id} className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 text-slate-700 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">{location.name}</h3>
                      <p className="text-gray-600">
                        {location.address}<br />
                        {location.city}, {location.state}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 text-slate-700 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">Main Campus</h3>
                      <p className="text-gray-600">
                        123 Education Way<br />
                        Indianapolis, IN 46204
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-start gap-4">
                    <Video className="w-6 h-6 text-slate-700 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">Virtual Appointments</h3>
                      <p className="text-gray-600">
                        Available via Zoom or Google Meet<br />
                        Flexible scheduling options
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Staff */}
        {staff && staff.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Meet Our Team</h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {staff.map((member: any) => (
                <div key={member.id} className="bg-white rounded-xl shadow-sm border p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-200 mx-auto mb-4 overflow-hidden relative">
                    {member.avatar_url ? (
                      <Image src={member.avatar_url} alt={member.name} fill sizes="100vw" className="object-cover" sizes="80px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-10 h-10 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-gray-600">{member.title}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact Alternative */}
        <section>
          <div className="bg-slate-100 rounded-xl p-8 text-center">
            <h3 className="font-semibold text-xl mb-2">Need Immediate Assistance?</h3>
            <p className="text-gray-600 mb-4">
              Our team is available Monday-Friday, 9am-5pm EST.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/support"
                className="inline-flex items-center justify-center bg-slate-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-900"
              >
                Call (317) 555-1234
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center border border-slate-800 text-slate-800 px-6 py-3 rounded-lg font-medium hover:bg-slate-200"
              >
                Contact Form
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
