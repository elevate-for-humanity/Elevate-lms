
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  ArrowRight, Code, Layout, Database,
  Globe, GitBranch, Palette, Server, Smartphone,
} from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Web Development Training | Full-Stack Bootcamp | Elevate for Humanity',
  description: 'Learn to build modern websites and web applications in 16-20 weeks. HTML, CSS, JavaScript, React, and Node.js. Free training through WIOA funding.',
  alternates: { canonical: `${SITE_URL}/programs/technology/web-development` },
  keywords: [
    'web development training Indianapolis',
    'coding bootcamp Indiana',
    'free web development course',
    'full stack developer training',
    'JavaScript training',
    'React training',
    'WIOA coding program',
  ],
  openGraph: {
    title: 'Web Development Training | Full-Stack Bootcamp | Elevate',
    description: 'Learn to build modern websites and web applications in 16-20 weeks. Free training through WIOA funding.',
    url: `${SITE_URL}/programs/technology/web-development`,
    siteName: 'Elevate for Humanity',
    images: [{ url: `${SITE_URL}/hero-images/technology-hero.jpg`, width: 1200, height: 630, alt: 'Web Development Training' }],
    type: 'website',
  },
};

const curriculum = [
  { icon: Layout, title: 'HTML5 & CSS3', desc: 'Semantic markup, Flexbox, Grid, and responsive design fundamentals' },
  { icon: Code, title: 'JavaScript & ES6+', desc: 'Modern JavaScript, DOM manipulation, async programming, and APIs' },
  { icon: Palette, title: 'React Framework', desc: 'Component architecture, state management, hooks, and routing' },
  { icon: Server, title: 'Node.js & Express', desc: 'Server-side JavaScript, REST APIs, and middleware' },
  { icon: Database, title: 'Databases', desc: 'SQL and NoSQL databases, data modeling, and CRUD operations' },
  { icon: GitBranch, title: 'Git & Deployment', desc: 'Version control, collaboration workflows, and cloud deployment' },
];

const careers = [
  { title: 'Junior Web Developer', salary: '$50K-$65K', growth: 'High demand' },
  { title: 'Frontend Developer', salary: '$55K-$75K', growth: 'Very high demand' },
  { title: 'Full-Stack Developer', salary: '$60K-$85K', growth: 'Premium pay' },
  { title: 'Web Designer', salary: '$45K-$65K', growth: 'Creative roles' },
];

const projectPortfolio = [
  'Personal portfolio website',
  'E-commerce storefront with shopping cart',
  'Social media dashboard application',
  'RESTful API with database integration',
  'Collaborative team project (capstone)',
];

export default function WebDevelopmentPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/hero-images/technology-hero.jpg" alt="Web Development Training" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Web Development</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Full-Stack Development Bootcamp</p>
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Technology', href: '/programs/technology' },
            { label: 'Web Development' },
          ]} />
        </div>
      </div>

      {/* CTA Buttons */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">Build Your Future in Tech</h2>
          <p className="text-lg text-gray-600 mb-8">Learn to code and launch a career as a web developer</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply?program=web-development" className="bg-purple-600 text-white px-10 py-5 rounded-lg font-semibold text-xl hover:bg-purple-700 transition-colors">
              Apply Now
            </Link>
            <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="bg-white border-2 border-purple-600 text-purple-600 px-10 py-5 rounded-lg font-semibold text-xl hover:bg-purple-50 transition-colors">
              Register at Indiana Career Connect
            </a>
          </div>
        </div>
      </section>

      {/* Program Overview */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-black">What Is This Program?</h2>
            <p className="text-lg text-gray-700 mb-4">
              Our Web Development bootcamp teaches you to build modern, responsive websites and full-stack web
              applications from scratch. You will learn HTML, CSS, JavaScript, React, Node.js, and databases
              while building a portfolio of real projects.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              Training is project-based: you learn by building. By graduation, you will have a professional
              portfolio demonstrating your skills to employers.
            </p>
            <p className="text-lg text-gray-700">
              This program may be available at no cost if you qualify through WIOA, WRG, or JRI funding.
            </p>
          </div>
          <div className="bg-purple-50 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-black mb-6">Program at a Glance</h3>
            <div className="space-y-4">
              {[
                ['Duration', '16-20 Weeks'],
                ['Format', 'Hybrid (Online + Projects)'],
                ['Schedule', 'Full-time or Part-time'],
                ['Cost', 'Free with WIOA funding'],
                ['Projects', '5+ Portfolio Projects'],
                ['Outcome', 'Job-Ready Portfolio'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-purple-100 pb-3">
                  <span className="text-gray-700">{label}</span>
                  <span className="font-bold text-black">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-black mb-4">What You Will Learn</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A full-stack curriculum covering frontend, backend, and everything in between.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curriculum.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-black mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Projects */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[350px] rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/technology/hero-program-it-support.jpg" alt="Student coding" fill sizes="100vw" className="object-cover" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-black mb-6">Build a Professional Portfolio</h2>
              <p className="text-gray-600 mb-6">
                Graduate with a portfolio of real projects that demonstrate your skills to employers.
              </p>
              <div className="space-y-3">
                {projectPortfolio.map((project, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span className="text-gray-700">{project}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Career Outcomes */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-black mb-4">Career Opportunities</h2>
            <p className="text-lg text-gray-600">Web development is one of the fastest-growing career fields.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {careers.map((c, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border shadow-sm text-center">
                <h3 className="font-bold text-black mb-2">{c.title}</h3>
                <p className="text-2xl font-bold text-purple-600 mb-1">{c.salary}</p>
                <span className="text-sm text-brand-green-600 font-medium">{c.growth}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">Who Should Apply</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-brand-green-700 mb-4">Requirements</h3>
              <ul className="space-y-3">
                {[
                  'High school diploma or GED',
                  'Basic computer skills (typing, web browsing)',
                  'Motivation to learn and practice daily',
                  'Reliable internet access',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold text-purple-700 mb-4">No Experience Needed</h3>
              <ul className="space-y-3">
                {[
                  'No prior coding experience required',
                  'We start from the very basics',
                  'Structured curriculum with mentorship',
                  'Career support included after graduation',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Learn to Code?</h2>
          <p className="text-purple-100 text-lg mb-8">Apply now or check if you qualify for free training through workforce funding.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply?program=web-development" className="bg-white text-purple-700 px-10 py-5 rounded-lg font-semibold text-xl hover:bg-purple-50 transition inline-flex items-center justify-center gap-2">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="border-2 border-white text-white px-10 py-5 rounded-lg font-semibold text-xl hover:bg-white/10 transition">
              Register at Indiana Career Connect
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
