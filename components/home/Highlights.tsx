import Link from 'next/link';
import Image from 'next/image';

export default function Highlights() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-black mb-12">
          How It Works
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="relative overflow-hidden rounded-lg shadow-lg group">
            <div className="relative h-64">
              <Image
                src="/images/pages/comp-home-highlight-biz.jpg"
                alt="Students in training"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">1. Check Eligibility</h3>
                <p className="text-sm mb-4">
                  See if you qualify for WIOA, WRG, or DOL-funded training programs
                </p>
                <Link
                  href="/wioa-eligibility"
                  className="inline-block px-6 py-2 bg-white text-brand-blue-900 font-semibold rounded hover:bg-gray-100 transition"
                >
                  Check Now
                </Link>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg shadow-lg group">
            <div className="relative h-64">
              <Image
                src="/images/pages/comp-home-highlight-health.jpg"
                alt="Training programs"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">2. Choose Training</h3>
                <p className="text-sm mb-4">
                  Select from healthcare, trades, tech, or business programs
                </p>
                <Link
                  href="/programs"
                  className="inline-block px-6 py-2 bg-white text-brand-blue-900 font-semibold rounded hover:bg-gray-100 transition"
                >
                  View Programs
                </Link>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg shadow-lg group">
            <div className="relative h-64">
              <Image
                src="/images/pages/comp-home-highlight-success.jpg"
                alt="Career success"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">3. Get Certified</h3>
                <p className="text-sm mb-4">
                  Earn credentials and connect to employment opportunities
                </p>
                <Link
                  href="/apply"
                  className="inline-block px-6 py-2 bg-white text-brand-blue-900 font-semibold rounded hover:bg-gray-100 transition"
                >
                  Apply Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
