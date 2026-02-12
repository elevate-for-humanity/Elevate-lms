import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Cybersecurity Training | Elevate for Humanity',
  description: 'Learn to protect networks and systems from cyber threats. Security+ certification training available at no cost if you qualify.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/technology/cybersecurity',
  },
};

export default function CybersecurityPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px]">
        <Image
          src="/images/technology/hero-program-cybersecurity.jpg"
          alt="Cybersecurity Training"
          fill sizes="100vw"
          className="object-cover"
          priority
        />
        {/* overlay removed */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Cybersecurity</h1>
            <p className="text-xl text-white/90">Network Security & Threat Protection</p>
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
              Our Cybersecurity program prepares you to protect organizations from cyber threats. 
              You'll learn network security, threat detection, incident response, and compliance frameworks 
              while preparing for the CompTIA Security+ certification.
            </p>

            <h2>What You'll Learn</h2>
            <ul>
              <li>Network security fundamentals</li>
              <li>Threat detection and vulnerability assessment</li>
              <li>Security operations and monitoring</li>
              <li>Incident response procedures</li>
              <li>Compliance and risk management</li>
              <li>Cryptography basics</li>
            </ul>

            <h2>Program Details</h2>
            <ul>
              <li><strong>Duration:</strong> 12-16 Weeks</li>
              <li><strong>Format:</strong> Hybrid (Online + Hands-on Labs)</li>
              <li><strong>Certification:</strong> CompTIA Security+</li>
              <li><strong>Prerequisites:</strong> Basic IT knowledge recommended</li>
              <li><strong>Cost:</strong> No cost if you qualify through WIOA/WRG/JRI</li>
            </ul>

            <h2>Career Opportunities</h2>
            <p>Graduates are prepared for roles such as:</p>
            <ul>
              <li>Security Analyst</li>
              <li>SOC Analyst</li>
              <li>Information Security Specialist</li>
              <li>Network Security Administrator</li>
            </ul>
            <p>Average starting salary: $55,000 - $80,000</p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/apply?program=cybersecurity"
              className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-colors text-lg"
            >
              Apply Now
            </Link>
            <Link
              href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-blue-50 transition-colors text-lg"
            >
              Register at Indiana Career Connect
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
