import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Calendar, Clock, Video, CheckCircle, Phone } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Schedule a Demo | Elevate LMS',
  description: 'Schedule a personalized demo of the Elevate LMS platform. See how our workforce training platform can work for your organization.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/license/demo',
  },
};

export const dynamic = 'force-dynamic';

export default async function DemoPage() {
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

  // Get available demo slots
  const { data: demoSlots } = await supabase
    .from('demo_availability')
    .select('*')
    .gte('date', new Date().toISOString())
    .eq('is_available', true)
    .order('date', { ascending: true })
    .limit(10);

  // Get testimonials from demo attendees
  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .eq('category', 'demo')
    .eq('is_featured', true)
    .limit(2);

  const demoIncludes = [
    'Full platform walkthrough',
    'Q&A with product specialist',
    'Custom use case discussion',
    'Pricing and implementation overview',
    'No obligation',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'License', href: '/license' }, { label: 'Demo' }]} />
        </div>
      </div>

      {/* Header */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Video className="w-16 h-16 mx-auto mb-6 text-orange-500" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Schedule a Demo</h1>
          <p className="text-xl text-slate-300">
            See how Elevate can transform your workforce training programs
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Demo Info */}
          <div>
            <h2 className="text-2xl font-bold mb-6">What to Expect</h2>
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-orange-600" />
                <span className="font-medium">30-45 minute session</span>
              </div>
              <ul className="space-y-3">
                {demoIncludes.map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Testimonials */}
            {testimonials && testimonials.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">What Others Say</h3>
                {testimonials.map((testimonial: any) => (
                  <div key={testimonial.id} className="bg-white rounded-lg p-4 border">
                    <p className="text-gray-600 italic mb-2">"{testimonial.content}"</p>
                    <div className="font-medium">{testimonial.name}</div>
                    {testimonial.organization && (
                      <div className="text-sm text-gray-500">{testimonial.organization}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Contact Alternative */}
            <div className="mt-8 bg-orange-50 rounded-xl p-6">
              <h3 className="font-semibold mb-2">Prefer to Talk?</h3>
              <p className="text-gray-600 mb-4">
                Contact us directly to discuss your needs.
              </p>
              <a
                href="tel:3173143757"
                className="inline-flex items-center gap-2 text-orange-600 font-medium hover:underline"
              >
                <Phone className="w-5 h-5" />
                (317) 314-3757
              </a>
            </div>
          </div>

          {/* Demo Form */}
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <h2 className="text-2xl font-bold mb-6">Request Your Demo</h2>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Work Email *</label>
                <input type="email" className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input type="tel" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Organization *</label>
                <input type="text" className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Organization Type *</label>
                <select className="w-full px-4 py-2 border rounded-lg" required>
                  <option value="">Select...</option>
                  <option value="training-provider">Training Provider</option>
                  <option value="workforce-board">Workforce Board</option>
                  <option value="employer">Employer</option>
                  <option value="government">Government Agency</option>
                  <option value="nonprofit">Nonprofit</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preferred Date/Time</label>
                {demoSlots && demoSlots.length > 0 ? (
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option value="">Select a time...</option>
                    {demoSlots.map((slot: any) => (
                      <option key={slot.id} value={slot.id}>
                        {new Date(slot.date).toLocaleDateString()} at {slot.time}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    placeholder="e.g., Tuesday afternoon" 
                    className="w-full px-4 py-2 border rounded-lg" 
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">What are you looking to accomplish?</label>
                <textarea 
                  rows={3} 
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Tell us about your goals..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
              >
                Request Demo
              </button>
              <p className="text-xs text-gray-500 text-center">
                By submitting, you agree to our privacy policy. We'll never share your information.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
