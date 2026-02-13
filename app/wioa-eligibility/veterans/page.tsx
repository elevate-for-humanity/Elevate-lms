import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Shield, Award, Briefcase, Phone } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'WIOA Eligibility for Veterans | Elevate for Humanity',
  description: 'Priority WIOA funding for military veterans. Free career training with expedited services.',
};

export const dynamic = 'force-dynamic';

export default async function VeteransPage() {
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

  // Get veteran-specific programs
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name, slug, description')
    .eq('is_active', true)
    .eq('veteran_priority', true)
    .limit(6);

  // Get veteran resources
  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .eq('category', 'veterans')
    .eq('is_active', true);

  // Get veteran testimonials
  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .eq('category', 'veteran')
    .eq('is_featured', true)
    .limit(2);

  const benefits = [
    { title: 'Priority Enrollment', description: 'First access to training programs', icon: Award },
    { title: 'Expedited Processing', description: 'Faster application review', icon: Shield },
    { title: 'Dedicated Counselor', description: 'Veteran-focused career advisor', icon: Briefcase },
    { title: 'Funded Training', description: 'Tuition covered for eligible veterans', icon: CheckCircle },
  ];

  const qualifications = [
    'Veterans who served on active duty (not including active duty for training)',
    'Honorable or general discharge',
    'Spouses of veterans who died or are disabled due to service',
    'Spouses of active duty service members',
  ];

  const requiredDocuments = [
    'DD-214 (Certificate of Release or Discharge from Active Duty)',
    'Valid government-issued ID',
    'Proof of Indiana residency',
    'Social Security card',
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'WIOA Eligibility', href: '/wioa-eligibility' }, { label: 'Veterans' }]} />
        </div>
      </div>

      <section className="relative h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/hero-images/about-hero.jpg"
          alt="Veterans Priority Services"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-900/70" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">WIOA Priority for Veterans</h1>
          <p className="text-xl">Expedited services and priority enrollment for those who served</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/wioa-eligibility" className="text-blue-600 hover:underline mb-6 inline-block">
          ← Back to WIOA Eligibility
        </Link>

        {/* Benefits */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-black mb-6">Veterans Priority Services</h2>
          
          <p className="text-lg text-gray-600 mb-8">
            As a veteran, you receive <strong>priority of service</strong> under WIOA. 
            This means you get first access to training programs, career counseling, 
            and job placement services.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="flex items-start gap-4 bg-blue-50 rounded-lg p-4">
                  <IconComponent className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold">{benefit.title}</h3>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Who Qualifies */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-black mb-4">Who Qualifies</h3>
          <ul className="space-y-3">
            {qualifications.map((qual, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{qual}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Required Documents */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-black mb-4">Required Documents</h3>
          <ul className="space-y-3">
            {requiredDocuments.map((doc, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{doc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Programs */}
        {programs && programs.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-black mb-6">Veteran-Friendly Programs</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {programs.map((program: any) => (
                <Link
                  key={program.id}
                  href={`/programs/${program.slug || program.id}`}
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
                  <h4 className="font-semibold">{program.name}</h4>
                  {program.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{program.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {testimonials && testimonials.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-8 mb-8">
            <h3 className="text-xl font-bold mb-6">Veteran Success Stories</h3>
            <div className="space-y-6">
              {testimonials.map((testimonial: any) => (
                <div key={testimonial.id} className="bg-white rounded-lg p-6">
                  <p className="text-gray-600 italic mb-3">"{testimonial.content}"</p>
                  <div className="font-semibold">{testimonial.name}</div>
                  {testimonial.branch && (
                    <div className="text-sm text-blue-600">{testimonial.branch}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-blue-600 rounded-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-blue-100 mb-6">
            Apply today and receive priority processing as a veteran.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="mailto:elevate4humanityedu@gmail.com"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              <Phone className="w-5 h-5" />
              (317) 314-3757
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
