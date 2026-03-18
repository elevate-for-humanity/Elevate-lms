
import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Order Confirmed | Drug Testing Services',
  description: 'Your drug testing order has been confirmed.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/drug-testing/success',
  },
};

export default function DrugTestingSuccessPage() {

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-slate-500 flex-shrink-0">•</span>
        </div>

        <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>

        <p className="text-xl text-black mb-6">
          Thank you for your order. We'll contact you within 1 business day to
          schedule your test.
        </p>

        <div className="bg-brand-blue-50 border-2 border-brand-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">What Happens Next?</h2>
          <div className="text-left space-y-3">
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                1
              </div>
              <p className="text-black">
                We'll call you at the phone number provided to schedule your
                test
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                2
              </div>
              <p className="text-black">
                You'll receive an email with collection site details and
                instructions
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-brand-blue-600 text-white rounded-full flex-shrink-0 text-sm font-bold">
                3
              </div>
              <p className="text-black">
                Visit the collection site at your scheduled time with photo ID
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                4
              </div>
              <p className="text-black">
                Results typically available within 24-48 hours
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-6 mb-6">
          <h3 className="font-bold mb-4">Need Help?</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-bold hover:bg-brand-blue-700"
            >
              <Phone className="w-5 h-5" />
              Call (317) 314-3757
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-black rounded-lg font-bold hover:bg-gray-300"
            >
              <Mail className="w-5 h-5" />
              Email Us
            </Link>
          </div>
        </div>

        <Link
          href="/"
          className="text-brand-blue-600 hover:underline font-semibold"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
