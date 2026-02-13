import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Phone, Clock, MessageSquare, Mail, MapPin, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Get Started | Elevate For Humanity',
  description: 'Contact us by phone for immediate assistance with enrollment, programs, and support.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/call-now',
  },
};

export default function CallNowPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Get Started' }]} />
        </div>
      </div>

      <section className="bg-green-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Phone className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us Now</h1>
          <p className="text-xl text-green-100 mb-8">Speak with a team member about enrollment, programs, or support</p>
          <a href="https://calendly.com/elevate-for-humanity/advisor-call" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-white text-green-600 px-10 py-5 rounded-full font-bold text-2xl hover:bg-green-50 transition-colors">
            <Phone className="w-8 h-8" />
            (317) 314-3757
          </a>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <Clock className="w-8 h-8 text-green-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Business Hours</h3>
              <p className="text-gray-600">Monday - Friday: 9am - 5pm EST</p>
              <p className="text-gray-600">Saturday: 10am - 2pm EST</p>
              <p className="text-gray-600">Sunday: Closed</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <MessageSquare className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Other Ways to Reach Us</h3>
              <a href="mailto:elevateforhumanity@gmail.com" className="flex items-center gap-2 text-blue-600 hover:underline mb-2">
                <Mail className="w-4 h-4" /> elevateforhumanity@gmail.com
              </a>
              <Link href="/contact" className="text-blue-600 hover:underline">Contact Form →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-8">We Can Help With</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {['Program Enrollment', 'Eligibility Questions', 'Technical Support', 'Career Guidance', 'Funding Options', 'Partner Inquiries'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
