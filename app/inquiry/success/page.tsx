import Link from 'next/link';
import { Metadata } from 'next';
import { CheckCircle, Phone, Mail } from 'lucide-react';


export const metadata: Metadata = {
  title: 'Thank You for Your Interest!',
  robots: { index: false, follow: false },
};

export default function InquirySuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Thank You for Your Interest!
        </h1>
        
        <p className="text-gray-600 mb-6">
          We've received your inquiry and sent a confirmation to your email. 
          Our team will contact you within 1-2 business days.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">What's Next?</h2>
          <ul className="text-left text-gray-600 space-y-2">
            <li>• Check your email for confirmation</li>
            <li>• Expect a call from our admissions team</li>
            <li>• Prepare any questions you have</li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-gray-600">While you wait, explore more:</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/apply"
              className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
            >
              Ready to Apply? Start Now
            </Link>
            <Link
              href="/programs"
              className="flex items-center justify-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700"
            >
              Browse Programs
            </Link>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <a
              href="/faq"
              className="text-emerald-600 hover:underline text-sm"
            >
              Browse FAQ
            </a>
            <a
              href="mailto:elevate4humanityedu@gmail.com"
              className="flex items-center gap-1 text-brand-blue-600 hover:underline text-sm"
            >
              <Mail className="w-3 h-3" />
              Email Us
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <Link href="/" className="text-emerald-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
