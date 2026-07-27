import { Metadata } from 'next';
import Link from 'next/link';
import { Store, DollarSign, Users, Calendar, CheckCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Apply for Booth Rental | Elevate',
  keywords: ["booth rental", "beauty", "salon", "independent contractor"],
  description: 'Apply to rent a booth at our beauty school. Independent contractor opportunities for licensed beauty professionals.',
};

export default function BoothRentalApplyPage() {
  const benefits = [
    { icon: DollarSign, title: 'Flexible Earnings', desc: 'Set your own prices and keep your full service revenue.' },
    { icon: Users, title: 'Built-in Clients', desc: 'Access to students and community members seeking beauty services.' },
    { icon: Store, title: 'Professional Space', desc: 'Modern, fully-equipped stations in a professional environment.' },
    { icon: Calendar, title: 'Flexible Schedule', desc: 'Book appointments that fit your lifestyle.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-red-500 to-brand-orange-500" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-red-500/20 text-brand-red-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Store className="w-4 h-4" />
              Booth Rental
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Apply for Booth Rental
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Are you a licensed beauty professional looking for a flexible workspace? Apply to rent a booth at our Indianapolis beauty school.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/booth-rental" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-4">Why Rent With Us?</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">Everything you need to build your beauty business.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white rounded-xl p-6 border border-slate-200">
                <b.icon className="w-8 h-8 text-brand-blue-600 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{b.title}</h3>
                <p className="text-sm text-slate-600">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-4">Application Form</h2>
          <p className="text-slate-600 text-center mb-8">Complete the form below to apply for booth rental.</p>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <form className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">First Name</label>
                  <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="Your first name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name</label>
                  <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="Your last name" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                <input type="email" className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="you@email.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                <input type="tel" className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="(317) 555-5555" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">License Type</label>
                <select className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 bg-white">
                  <option value="">Select your license</option>
                  <option>Barber</option>
                  <option>Cosmetologist</option>
                  <option>Esthetician</option>
                  <option>Nail Technician</option>
                  <option>Multiple Licenses</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">License Number</label>
                <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="Your license number" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Services You Offer</label>
                <textarea rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500" placeholder="List the services you'd like to offer..."></textarea>
              </div>
              <button type="submit" className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-3 rounded-lg transition-colors inline-flex items-center justify-center gap-2">
                Submit Application <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-slate-900 text-center mb-6">Requirements</h2>
          <div className="space-y-3">
            {[
              'Valid Indiana beauty license (barber, cosmetology, esthetician, or nail technician)',
              'Proof of current liability insurance',
              'Commitment to maintain professional standards',
              'Availability for regular business hours',
            ].map((req) => (
              <div key={req} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-200">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">{req}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
