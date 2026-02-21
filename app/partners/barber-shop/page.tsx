'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, Loader2, Building2, ArrowRight } from 'lucide-react';

export default function BarberShopPartnerPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      type: 'barber-shop-partner',
      shopName: formData.get('shopName') as string,
      ownerName: formData.get('ownerName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      licensedBarbers: formData.get('licensedBarbers') as string,
      message: formData.get('message') as string,
    };

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to submit');
      setSuccess(true);
    } catch (err) {
      setError('Something went wrong. Please contact us at Get Help Online.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-gray-700 mb-6">
            We received your partnership inquiry. Our team will contact you within 1-2 business days to discuss next steps.
          </p>
          <p className="text-gray-700 mb-8">
            Questions? Contact us at{' '}
            <a href="/support" className="text-brand-orange-600 font-semibold">Get Help Online</a>
          </p>
          <Link
            href="/programs/barber"
            className="inline-block bg-brand-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-orange-600"
          >
            Back to Barber Program
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Partners", href: "/partners" }, { label: "Barber Shop" }]} />
      </div>
{/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/barber/gallery-1.jpg" alt="Barber shop interior" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Become a Barber Shop Partner</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Host apprentices at your shop and help train the next generation of barbers.</p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Why Partner With Us?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg">
              <div className="relative h-48">
                <Image
                  src="/images/barber/gallery-2.jpg"
                  alt="Barber training apprentice"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-2">Develop Talent</h3>
                <p className="text-gray-700 text-sm">Train apprentices in your shop's style and culture. Build a pipeline of skilled barbers.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-lg">
              <div className="relative h-48">
                <Image
                  src="/images/barber/gallery-3.jpg"
                  alt="Professional barbershop"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-2">No Cost to You</h3>
                <p className="text-gray-700 text-sm">Training costs covered through WIOA funding. We handle paperwork and compliance.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-lg">
              <div className="relative h-48">
                <Image
                  src="/images/barber/training.jpg"
                  alt="USDOL registered program"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-2">USDOL Registered</h3>
                <p className="text-gray-700 text-sm">Official U.S. Department of Labor registered apprenticeship program.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-brand-orange-100 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-brand-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Shop Partner Application</h2>
                <p className="text-gray-700 text-sm">Tell us about your barbershop</p>
              </div>
            </div>

            {error && (
              <div className="bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="shopName" className="block text-sm font-medium text-gray-800 mb-1">
                  Shop Name *
                </label>
                <input
                  type="text"
                  id="shopName"
                  name="shopName"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500"
                  placeholder="Your Barbershop Name"
                />
              </div>

              <div>
                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-800 mb-1">
                  Owner/Manager Name *
                </label>
                <input
                  type="text"
                  id="ownerName"
                  name="ownerName"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500"
                  placeholder="John Smith"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500"
                    placeholder="shop@elevateforhumanity.org"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-800 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500"
                    placeholder="(317) 314-3757"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-800 mb-1">
                  Shop Address *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-800 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500"
                    placeholder="Indianapolis"
                  />
                </div>
                <div>
                  <label htmlFor="licensedBarbers" className="block text-sm font-medium text-gray-800 mb-1">
                    # of Licensed Barbers *
                  </label>
                  <select
                    id="licensedBarbers"
                    name="licensedBarbers"
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500"
                  >
                    <option value="">Select...</option>
                    <option value="1">1</option>
                    <option value="2-3">2-3</option>
                    <option value="4-5">4-5</option>
                    <option value="6+">6+</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-800 mb-1">
                  Tell Us About Your Shop (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500"
                  placeholder="Years in business, specialties, why you want to host apprentices..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-orange-500 text-white py-4 rounded-lg font-semibold text-lg hover:bg-brand-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-center text-gray-700 mb-4">
                Questions about the partnership?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/support"
                  className="inline-flex items-center justify-center gap-2 bg-slate-100 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-slate-200"
                >
                  <Phone className="w-5 h-5" />
                  Get Help Online
                </a>
                <a
                  href="mailto:partners@elevateforhumanity.org"
                  className="inline-flex items-center justify-center gap-2 bg-slate-100 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-slate-200"
                >
                  <Mail className="w-5 h-5" />
                  Email Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image Section */}
      <section className="py-12 px-4 bg-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative h-80 rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/images/barber/gallery-1.jpg"
                alt="Barber training apprentice"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Train the Next Generation</h2>
              <p className="text-gray-700 mb-4">
                As a partner shop, you'll mentor apprentices through hands-on training while they complete their 2,000 required hours. Your expertise shapes future barbers.
              </p>
              <p className="text-gray-700">
                We provide curriculum support, compliance tracking, and handle all WIOA paperwork so you can focus on what you do best — cutting hair and teaching your craft.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Partner Requirements</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <p className="text-gray-800">Licensed barbershop in Indiana</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <p className="text-gray-800">At least one licensed barber on staff</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <p className="text-gray-800">Willingness to mentor apprentices</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <p className="text-gray-800">Commitment to 2,000 training hours</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <p className="text-gray-800">Safe, professional work environment</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <p className="text-gray-800">Current business license and insurance</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-64 rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/images/barber/gallery-2.jpg"
                alt="Professional barbershop"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
