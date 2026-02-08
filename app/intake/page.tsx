import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ClipboardList, ArrowRight, Circle, Clock, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Intake Form | Elevate For Humanity',
  description: 'Complete your intake form to begin the enrollment process for career training programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/intake',
  },
};

export default function IntakePage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Intake" }]} />
      </div>
{/* Hero */}
      <section className="pt-24 pb-12 lg:pt-32 lg:pb-16 bg-white border-b">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <ClipboardList className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Student Intake Form
          </h1>
          <p className="text-gray-600 mb-6">
            Complete this form to begin your enrollment process. This helps us match you with the right program and funding options.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              10-15 minutes
            </span>
            <span className="flex items-center gap-1">
              <Circle className="w-4 h-4" />
              Save progress anytime
            </span>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white rounded-xl border p-8">
            <div className="text-center py-12">
              <p className="text-gray-600 mb-6">
                Please sign in to access the intake form. Your information will be saved securely.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Sign In to Continue
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-sm text-gray-500 mt-4">
                Don't have an account?{' '}
                <Link href="/apply" className="text-blue-600 hover:underline">
                  Apply here
                </Link>
              </p>
            </div>
          </div>

          {/* Help */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6 text-center">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-gray-600 text-sm mb-4">
              Our enrollment team is here to assist you with the intake process.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-blue-600 font-medium"
            >
              <Phone className="w-4 h-4" />
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
