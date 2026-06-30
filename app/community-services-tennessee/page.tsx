export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Community Services & Support in Tennessee',
  description:
    'Trusted community services in Tennessee. Job placement assistance, financial literacy, housing support, and family services. Building stronger communities together.',
  keywords: [
    'community services Tennessee',
    'job placement Tennessee',
    'family services Nashville',
    'housing assistance Memphis',
  ],
};

export default function CommunityServicesTennesseePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
          Community Services in Tennessee
        </h1>
        <p className="text-xl text-slate-600 text-center max-w-3xl mx-auto mb-12">
          Trusted support services for Tennessee families. We connect Tennesseans with resources for
          employment, housing, financial stability, and personal growth.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            {
              title: 'Job Placement',
              desc: 'Resume building, interview prep, employer connections',
            },
            { title: 'Financial Literacy', desc: 'Budgeting, credit repair, savings programs' },
            {
              title: 'Housing Assistance',
              desc: 'Rental support, homebuyer education, emergency aid',
            },
            {
              title: 'Family Services',
              desc: 'Childcare resources, parenting support, youth programs',
            },
            { title: 'Benefits Navigation', desc: 'TennCare, SNAP, TANF application assistance' },
            {
              title: 'Transportation',
              desc: 'Bus passes, car repair assistance, rideshare programs',
            },
          ].map((service) => (
            <div
              key={service.title}
              className="bg-white p-6 rounded-lg shadow-md border-l-4 border-brand-green-500"
            >
              <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
              <p className="text-slate-600">{service.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-brand-green-600 text-white p-8 rounded-xl text-center">
          <h2 className="text-2xl font-bold mb-4">Need Support? We&apos;re Here to Help</h2>
          <p className="mb-6">Connect with our team to find the resources you need.</p>
          <Link
            href="/contact"
            className="bg-white text-brand-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-slate-100"
          >
            Contact Us
          </Link>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div className="bg-slate-50 p-6 rounded-lg">
            <h3 className="font-semibold mb-3">Also in Tennessee</h3>
            <Link href="/career-training-tennessee" className="text-blue-600 hover:underline block">
              Career Training Programs →
            </Link>
          </div>
          <div className="bg-slate-50 p-6 rounded-lg">
            <h3 className="font-semibold mb-3">Other States</h3>
            <div className="space-y-1">
              <Link
                href="/community-services-indiana"
                className="text-brand-green-600 hover:underline block"
              >
                Indiana
              </Link>
              <Link
                href="/community-services-ohio"
                className="text-brand-green-600 hover:underline block"
              >
                Ohio
              </Link>
              <Link
                href="/community-services-illinois"
                className="text-brand-green-600 hover:underline block"
              >
                Illinois
              </Link>
              <Link
                href="/community-services-texas"
                className="text-brand-green-600 hover:underline block"
              >
                Texas
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            Serving: Nashville, Memphis, Knoxville, Chattanooga, Clarksville, Murfreesboro, Franklin
          </p>
          <div className="mt-4 space-x-4">
            <Link href="/locations" className="text-brand-green-600 hover:underline">
              All Locations
            </Link>
            <Link href="/programs" className="text-brand-green-600 hover:underline">
              All Programs
            </Link>
            <Link href="/contact" className="text-brand-green-600 hover:underline">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
