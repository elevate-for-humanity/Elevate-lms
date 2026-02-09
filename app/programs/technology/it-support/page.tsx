import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

// Force static generation - prevents 20s+ load times
export const dynamic = 'force-static';
export const revalidate = 86400; // 24 hours

export const metadata: Metadata = {
  title: 'IT Support Training | Elevate for Humanity',
  description: 'Get CompTIA A+ certified and start your IT career. Help desk and technical support training available at no cost if you qualify.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/technology/it-support',
  },
};

export default function ITSupportPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px]">
        <Image
          src="/images/technology/hero-program-it-support.jpg"
          alt="IT Support Training"
          fill sizes="100vw"
          className="object-cover"
          priority
        />
        {/* overlay removed */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">IT Support</h1>
            <p className="text-xl text-white/90">CompTIA A+ Certification Training</p>
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none">
            <h2>Program Overview</h2>
            <p>
              Our IT Support program prepares you for the CompTIA A+ certification, the industry standard for launching a career in IT. 
              You'll learn hardware and software troubleshooting, networking basics, security fundamentals, and customer service skills.
            </p>

            <h2>What You'll Learn</h2>
            <ul>
              <li>Computer hardware installation and troubleshooting</li>
              <li>Operating systems (Windows, macOS, Linux)</li>
              <li>Networking fundamentals and connectivity</li>
              <li>Security best practices</li>
              <li>Help desk and customer support skills</li>
              <li>Mobile device support</li>
            </ul>

            <h2>Program Details</h2>
            <ul>
              <li><strong>Duration:</strong> 8-12 Weeks</li>
              <li><strong>Format:</strong> Hybrid (Online + Hands-on Labs)</li>
              <li><strong>Certification:</strong> CompTIA A+</li>
              <li><strong>Cost:</strong> No cost if you qualify through WIOA/WRG/JRI</li>
            </ul>

            <h2>Career Opportunities</h2>
            <p>Graduates are prepared for roles such as:</p>
            <ul>
              <li>Help Desk Technician</li>
              <li>IT Support Specialist</li>
              <li>Desktop Support Technician</li>
              <li>Technical Support Representative</li>
            </ul>
            <p>Average starting salary: $40,000 - $55,000</p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/apply?program=it-support"
              className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-colors text-lg"
            >
              Apply Now
            </Link>
            <Link
              href="/wioa-eligibility"
              className="inline-flex items-center justify-center border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-blue-50 transition-colors text-lg"
            >
              Check Eligibility
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
