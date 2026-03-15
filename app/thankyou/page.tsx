import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ArrowRight, Phone, Mail, Calendar } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/thankyou',
  },
  title: 'Thank You | Elevate For Humanity',
  description: 'Thank you for your submission. We will be in touch soon.',
};

export const dynamic = 'force-dynamic';

export default async function ThankyouPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Get next steps content
  const { data: nextSteps } = await db
    .from('content_blocks')
    .select('*')
    .eq('page', 'thankyou')
    .eq('section', 'next-steps')
    .order('order', { ascending: true });

  // Get featured programs to suggest
  const { data: programs } = await db
    .from('programs')
    .select('id, name, slug, description')
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(3);

  // Get contact info
  const { data: contactInfo } = await db
    .from('settings')
    .select('value')
    .eq('key', 'contact_info')
    .single();

  const defaultNextSteps = [
    {
      title: 'Check Your Email',
      description: 'We\'ve sent a confirmation email with important information about your application.',
    },
    {
      title: 'Prepare Documents',
      description: 'Gather your ID, proof of residence, and any income documentation you may have.',
    },
    {
      title: 'Schedule Orientation',
      description: 'Our team will contact you within 1-2 business days to schedule your orientation.',
    },
  ];

  const displayNextSteps = nextSteps && nextSteps.length > 0 ? nextSteps : defaultNextSteps;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Thank You' }]} />
        </div>
      </div>

      {/* Success Message */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Thank You!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your submission has been received. We're excited to help you start your career journey!
          </p>
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-6 text-left">
            <h2 className="font-semibold text-brand-green-800 mb-2">What happens next?</h2>
            <p className="text-brand-green-700">
              A member of our enrollment team will contact you within 1-2 business days 
              to discuss your eligibility and next steps.
            </p>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Next Steps</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {displayNextSteps.map((step: any, index: number) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-brand-blue-600 font-bold">{index + 1}</span>
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Questions? Contact Us</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <a 
              href="/support" 
              className="flex items-center gap-4 bg-white rounded-xl p-6 hover:bg-white transition"
            >
              <Phone className="w-8 h-8 text-brand-blue-600" />
              <div>
                <div className="font-semibold">Contact Us</div>
                <div className="text-gray-600">(317) 314-3757</div>
              </div>
            </a>
            <a 
              href="/contact" 
              className="flex items-center gap-4 bg-white rounded-xl p-6 hover:bg-white transition"
            >
              <Mail className="w-8 h-8 text-brand-blue-600" />
              <div>
                <div className="font-semibold">Email Us</div>
                <div className="text-gray-600 text-sm">Contact Us</div>
              </div>
            </a>
            <Link 
              href="/booking" 
              className="flex items-center gap-4 bg-white rounded-xl p-6 hover:bg-white transition"
            >
              <Calendar className="w-8 h-8 text-brand-blue-600" />
              <div>
                <div className="font-semibold">Schedule a Meeting</div>
                <div className="text-gray-600">Book an appointment</div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Suggested Programs */}
      {programs && programs.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Explore Our Programs</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {programs.map((program: any) => (
                <Link
                  key={program.id}
                  href={`/programs/${program.slug || program.id}`}
                  className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition group"
                >
                  <h3 className="font-semibold mb-2 group-hover:text-brand-blue-600 transition">
                    {program.name}
                  </h3>
                  {program.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">{program.description}</p>
                  )}
                  <div className="flex items-center gap-1 text-brand-blue-600 text-sm mt-4 font-medium">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-brand-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Learn More?
          </h2>
          <p className="text-brand-blue-100 mb-8">
            Browse all our programs or return to the homepage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/programs"
              className="bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-white transition"
            >
              View All Programs
            </Link>
            <Link
              href="/"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
            >
              Return Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
