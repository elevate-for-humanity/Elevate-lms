import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Image from 'next/image';
import { Heart, Users, BookOpen, Award } from 'lucide-react';

export const metadata = {
  title: 'Volunteer with VITA | Free Tax Preparation',
  description: 'Become a VITA volunteer and help your community with free tax preparation.',
};

export default function VolunteerPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Tax", href: "/tax" }, { label: "Volunteer" }]} />
      </div>
{/* Hero */}
      <section className="relative h-[400px] w-full overflow-hidden">
        <Image src="/images/business/success-1.jpg" alt="Volunteer" width={800} height={600} className="absolute inset-0 w-full h-full object-cover" quality={85} loading="lazy" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-6 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Volunteer with VITA
            </h1>
            <p className="text-xl">
              Help your community with free tax preparation
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-6">Make a Difference</h2>
              <p className="text-black mb-6">
                Join our team of VITA volunteers and help low-income individuals and families file their taxes for free. No prior tax experience required - we provide all the training you need.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Heart className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Give Back</h3>
                    <p className="text-black">Help families keep more of their refund</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="w-6 h-6 text-brand-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Learn Skills</h3>
                    <p className="text-black">Gain valuable tax preparation knowledge</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Meet People</h3>
                    <p className="text-black">Connect with community members</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Get Certified</h3>
                    <p className="text-black">Earn IRS certification</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-brand-blue-50 rounded-lg p-8 border border-brand-blue-200">
              <h3 className="text-2xl font-bold mb-4">Volunteer Roles</h3>
              <ul className="space-y-3 text-black mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span>
                  <span><strong>Tax Preparer:</strong> Prepare returns with taxpayers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span>
                  <span><strong>Greeter:</strong> Welcome and assist clients</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span>
                  <span><strong>Interpreter:</strong> Provide language assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span>
                  <span><strong>Quality Reviewer:</strong> Review completed returns</span>
                </li>
              </ul>
              <Link
                href="/tax/rise-up-foundation/volunteer"
                className="block w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Apply to Volunteer
              </Link>
            </div>
          </div>

          {/* Training Info */}
          <div className="bg-gray-50 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-6 text-center">Training Provided</h3>
            <p className="text-center text-black mb-8 max-w-3xl mx-auto">
              All volunteers receive free IRS-certified training. Training is available online and in-person, typically taking 20-40 hours depending on certification level.
            </p>
            <div className="text-center">
              <Link
                href="/tax/rise-up-foundation/training"
                className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Learn About Training
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
