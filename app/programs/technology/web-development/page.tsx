
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-static';
export const revalidate = 86400;

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Web Development Training | Full-Stack Bootcamp | Elevate for Humanity',
  description:
    'Learn to build modern websites and web applications. HTML, CSS, JavaScript, React, and Node.js. Free training through WIOA funding for eligible Indiana residents.',
  alternates: { canonical: `${SITE_URL}/programs/technology/web-development` },
  openGraph: {
    title: 'Web Development Training | Full-Stack Bootcamp | Elevate',
    description:
      'Learn to build modern websites and web applications. Free training through WIOA funding.',
    url: `${SITE_URL}/programs/technology/web-development`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/pages/web-development.jpg', width: 1200, height: 630, alt: 'Web Development Training' }],
    type: 'website',
  },
};

const CURRICULUM = [
  { title: 'HTML5 & CSS3', desc: 'Semantic markup, Flexbox, Grid, and responsive design fundamentals.' },
  { title: 'JavaScript & ES6+', desc: 'Modern JavaScript, DOM manipulation, async programming, and APIs.' },
  { title: 'React Framework', desc: 'Component architecture, state management, hooks, and routing.' },
  { title: 'Node.js & Express', desc: 'Server-side JavaScript, REST APIs, and middleware.' },
  { title: 'Databases', desc: 'SQL and NoSQL databases, data modeling, and CRUD operations.' },
  { title: 'Git & Deployment', desc: 'Version control, collaboration workflows, and cloud deployment.' },
];

const CAREERS = [
  { title: 'Junior Web Developer', salary: '$50K–$65K' },
  { title: 'Frontend Developer', salary: '$55K–$75K' },
  { title: 'Full-Stack Developer', salary: '$60K–$85K' },
  { title: 'Web Designer', salary: '$45K–$65K' },
];

const PORTFOLIO_PROJECTS = [
  'Personal portfolio website',
  'E-commerce storefront with shopping cart',
  'Social media dashboard application',
  'RESTful API with database integration',
  'Collaborative team project (capstone)',
];

export default function WebDevelopmentPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Technology', href: '/programs/technology' },
            { label: 'Web Development' },
          ]} />
        </div>
      </div>

      {/* Hero — clean image, no text overlay */}
      <section className="relative h-[45vh] min-h-[280px] max-h-[560px] w-full overflow-hidden">
        <Image
          src="/images/pages/web-development.jpg"
          alt="Web development training at Elevate for Humanity"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </section>

      {/* Page identity — below hero */}
      <section className="border-b border-slate-100 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">
            Technology · Indianapolis
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
            Web Development
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl leading-relaxed mb-2">
            Full-stack development training covering HTML, CSS, JavaScript, React, Node.js, and databases.
            Graduate with a portfolio of real projects and the skills employers are hiring for.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200">
              16–20 weeks
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200">
              Hybrid
            </span>
            <span className="inline-flex items-center gap-1.5 bg-brand-green-50 text-brand-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-green-200">
              WIOA Funding Available
            </span>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/apply?program=web-development"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              Apply Now
            </Link>
            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              Go to Indiana Career Connect
            </a>
            <Link
              href="/contact?program=web-development"
              className="border-2 border-slate-300 hover:border-brand-blue-400 text-slate-700 font-bold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              Request Information
            </Link>
          </div>
        </div>
      </section>

      {/* What this program is */}
      <section className="py-14">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
                Program Overview
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
                What This Program Is
              </h2>
              <p className="text-slate-600 text-base leading-relaxed mb-4">
                Our Web Development bootcamp teaches you to build modern, responsive websites and
                full-stack web applications from scratch. You will learn HTML, CSS, JavaScript,
                React, Node.js, and databases while building a portfolio of real projects.
              </p>
              <p className="text-slate-600 text-base leading-relaxed mb-4">
                Training is project-based: you learn by building. By graduation, you will have a
                professional portfolio demonstrating your skills to employers.
              </p>
              <p className="text-slate-600 text-base leading-relaxed">
                This program may be available at no cost if you qualify through WIOA, WRG, or JRI
                funding. Students from outside Indiana can enroll through the self-pay option.
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Program at a Glance</h3>
              <div className="space-y-3">
                {[
                  ['Duration', '16–20 weeks'],
                  ['Format', 'Hybrid (online + in-person labs)'],
                  ['Schedule', 'Full-time or part-time cohorts'],
                  ['Cost', 'Free with WIOA funding · self-pay available'],
                  ['Portfolio', '5+ real projects'],
                  ['Outcome', 'Job-ready portfolio + career placement support'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                    <span className="text-slate-500 text-sm">{label}</span>
                    <span className="font-semibold text-slate-900 text-sm text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What you will learn */}
      <section className="py-14 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              Curriculum
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              What You Will Learn
            </h2>
            <p className="text-slate-600 text-base mt-2 max-w-xl mx-auto leading-relaxed">
              A full-stack curriculum covering frontend, backend, and everything in between.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CURRICULUM.map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 mb-2 text-sm">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio projects */}
      <section className="py-14 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/images/pages/programs-tech-webdev-hero.jpg"
                alt="Student coding a web application"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
                Real Projects
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
                Build a Professional Portfolio
              </h2>
              <p className="text-slate-600 text-base leading-relaxed mb-6">
                Graduate with a portfolio of real projects that demonstrate your skills to employers.
                Every project is built from scratch — not copied from tutorials.
              </p>
              <ul className="space-y-2">
                {PORTFOLIO_PROJECTS.map((project) => (
                  <li key={project} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-red-500 mt-2" />
                    <span className="text-slate-700 text-sm leading-relaxed">{project}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Career outcomes */}
      <section className="py-14 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              After Graduation
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Career Opportunities
            </h2>
            <p className="text-slate-600 text-base mt-2 max-w-xl mx-auto leading-relaxed">
              Web development is one of the fastest-growing career fields. Graduates work across
              industries — from startups to healthcare to government.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CAREERS.map((c) => (
              <div key={c.title} className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 mb-2 text-sm">{c.title}</h3>
                <p className="text-brand-green-700 font-bold text-lg">{c.salary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who should apply */}
      <section className="py-14 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              Admissions
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Who Should Apply
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-3">Requirements</h3>
              <ul className="space-y-2">
                {[
                  'High school diploma or GED',
                  'Basic computer skills (typing, web browsing)',
                  'Motivation to learn and practice daily',
                  'Reliable internet access',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-400 mt-2" />
                    <span className="text-slate-700 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-3">No Experience Needed</h3>
              <ul className="space-y-2">
                {[
                  'No prior coding experience required',
                  'We start from the very basics',
                  'Structured curriculum with mentorship',
                  'Career support included after graduation',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-400 mt-2" />
                    <span className="text-slate-700 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Funding & Indiana Career Connect */}
      <section className="py-14 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
                Funding
              </p>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3">
                How Training Gets Paid For
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                This program may be available at no cost for eligible Indiana residents through
                WIOA, Workforce Ready Grant, or JRI funding. Eligibility is determined through
                WorkOne — not Elevate.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Students who do not qualify for funding can enroll through flexible self-pay and
                buy-now-pay-later options.
              </p>
              <Link
                href="/funding"
                className="inline-block mt-4 text-brand-blue-600 font-semibold text-sm hover:underline"
              >
                Explore all funding options →
              </Link>
            </div>
            <div className="bg-brand-blue-50 rounded-xl border border-brand-blue-200 p-6">
              <p className="text-brand-blue-900 font-bold text-sm mb-1">Indiana Career Connect</p>
              <p className="text-brand-blue-800 text-sm leading-relaxed mb-4">
                For WIOA-eligible and apprenticeship pathway applicants, the next step may require
                Indiana Career Connect. Register for free to begin the eligibility process.
              </p>
              <a
                href="https://www.indianacareerconnect.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-sm"
              >
                Go to Indiana Career Connect
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-14 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">Ready to Learn to Code?</h2>
          <p className="text-slate-300 text-base leading-relaxed mb-8 max-w-xl mx-auto">
            Apply now or check if you qualify for free training through workforce funding.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply?program=web-development"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-10 py-4 rounded-xl transition-colors text-base"
            >
              Apply Now
            </Link>
            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-10 py-4 rounded-xl transition-colors text-base"
            >
              Go to Indiana Career Connect
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
