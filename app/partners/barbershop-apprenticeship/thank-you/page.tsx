export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ArrowRight, Download, Phone, Mail, Clock } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Application Received | Barbershop Partner | Elevate for Humanity',
  description: 'Thank you for applying to become a barbershop partner for the Indiana Barber Apprenticeship program.',
  robots: { index: false, follow: false },
};

export default async function ThankYouPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('partners').select('*').limit(50);

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Partners", href: "/partners" }, { label: "Thank You" }]} />
      </div>
<section className="py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Received!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Thank you for applying to become a barbershop partner for the Indiana Barber
            Apprenticeship program. We&apos;ve received your application and will be in touch soon.
          </p>

          <div className="bg-white p-8 rounded-xl shadow-sm text-left mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">What Happens Next</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Verification (1-3 business days)</h3>
                  <p className="text-gray-600 text-sm">
                    We&apos;ll verify your shop license and supervisor credentials with the Indiana
                    Professional Licensing Agency.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-blue-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">MOU Review & Signing</h3>
                  <p className="text-gray-600 text-sm">
                    We&apos;ll send you the official MOU for review and electronic signature.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-blue-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Site Approval</h3>
                  <p className="text-gray-600 text-sm">
                    Once verified and MOU signed, your shop becomes an approved worksite.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-blue-600 font-bold text-sm">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Apprentice Matching</h3>
                  <p className="text-gray-600 text-sm">
                    We&apos;ll work with you to match qualified apprentice candidates to your shop.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-blue-50 p-6 rounded-xl mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-brand-blue-600" />
              <span className="font-semibold text-gray-900">Confirmation Email Sent</span>
            </div>
            <p className="text-gray-600 text-sm">
              Check your inbox for a confirmation email with a copy of your application details and
              the MOU template.
            </p>
          </div>

          <div className="bg-gray-100 p-6 rounded-xl mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Questions?</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/support" className="inline-flex items-center justify-center gap-2 text-gray-700 hover:text-brand-blue-600">
                <Phone className="w-4 h-4" /> Get Help Online
              </a>
              <a href="/contact" className="inline-flex items-center justify-center gap-2 text-gray-700 hover:text-brand-blue-600">
                <Mail className="w-4 h-4" /> our contact form
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/docs/Indiana-Barbershop-Apprenticeship-MOU"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              <Download className="w-5 h-5 mr-2" /> View MOU Template
            </Link>
            <Link
              href="/partners/barbershop-apprenticeship"
              className="inline-flex items-center justify-center px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700"
            >
              Back to Partner Info <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
