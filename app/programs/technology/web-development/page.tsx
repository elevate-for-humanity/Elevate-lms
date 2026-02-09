import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Web Development Training | Elevate for Humanity',
  description: 'Learn to build websites and web applications. Full-stack development training available at no cost if you qualify.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/technology/web-development',
  },
};

export default function WebDevelopmentPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px]">
        <Image
          src="/images/technology/hero-program-web-dev.jpg"
          alt="Web Development Training"
          fill sizes="100vw"
          className="object-cover"
          priority
        />
        {/* overlay removed */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Web Development</h1>
            <p className="text-xl text-white/90">Build Modern Websites & Applications</p>
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
              Our Web Development program teaches you to build modern, responsive websites and web applications. 
              You'll learn HTML, CSS, JavaScript, and popular frameworks while building a portfolio of real projects.
            </p>

            <h2>What You'll Learn</h2>
            <ul>
              <li>HTML5 and CSS3 fundamentals</li>
              <li>JavaScript and modern ES6+</li>
              <li>Responsive design principles</li>
              <li>React or similar frontend framework</li>
              <li>Backend basics with Node.js</li>
              <li>Database fundamentals</li>
              <li>Version control with Git</li>
            </ul>

            <h2>Program Details</h2>
            <ul>
              <li><strong>Duration:</strong> 16-20 Weeks</li>
              <li><strong>Format:</strong> Hybrid (Online + Project-Based)</li>
              <li><strong>Outcome:</strong> Portfolio of projects</li>
              <li><strong>Cost:</strong> No cost if you qualify through WIOA/WRG/JRI</li>
            </ul>

            <h2>Career Opportunities</h2>
            <p>Graduates are prepared for roles such as:</p>
            <ul>
              <li>Junior Web Developer</li>
              <li>Frontend Developer</li>
              <li>Full-Stack Developer</li>
              <li>Web Designer</li>
            </ul>
            <p>Average starting salary: $50,000 - $75,000</p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/apply?program=web-development"
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
