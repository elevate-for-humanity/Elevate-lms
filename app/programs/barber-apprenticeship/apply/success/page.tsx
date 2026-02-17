import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Mail, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Application Submitted | Barber Apprenticeship',
  robots: 'noindex',
};

export default function ApplicationSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Application Submitted
          </h1>
          
          <p className="text-gray-600 mb-8">
            Thank you for applying to the Barber Apprenticeship program. 
            We've received your application and will be in touch soon.
          </p>

          {/* What happens next */}
          <div className="bg-gray-50 rounded-xl p-6 text-left mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">What Happens Next</h2>
            <div className="space-y-3">
              {[
                'We review your application within 5-10 business days',
                'You will receive an email or call to discuss next steps',
                'We will provide program fee details and payment options',
                'If you need a host shop, we will discuss placement options',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-brand-orange-100 text-brand-orange-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500 mb-4">Questions in the meantime?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/support"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
              >
                <Phone className="w-4 h-4" />
                Get Help Online
              </a>
              <a
                href="mailto:info@elevateforhumanity.org"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
              >
                <Mail className="w-4 h-4" />
                Email Us
              </a>
            </div>
          </div>
        </div>

        {/* Back to program */}
        <div className="text-center mt-6">
          <Link
            href="/programs/barber-apprenticeship"
            className="inline-flex items-center gap-2 text-brand-orange-600 hover:text-brand-orange-700 font-medium"
          >
            Back to Program Details
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
