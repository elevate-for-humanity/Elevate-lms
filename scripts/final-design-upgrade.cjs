#!/usr/bin/env node
/**
 * FINAL DESIGN UPGRADE
 * Adds hero banners, images, and feature sections to ALL pages
 */

const fs = require('fs');
const path = require('path');

const placeholders = JSON.parse(fs.readFileSync('/tmp/placeholders.json', 'utf8'));

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║     FINAL DESIGN UPGRADE - HERO BANNERS & IMAGES        ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

let upgraded = 0;

placeholders.pages.forEach((page, index) => {
  const filePath = page.file;

  if (!fs.existsSync(filePath)) return;

  const newContent = buildPageWithDesign(page);
  fs.writeFileSync(filePath, newContent, 'utf8');
  upgraded++;

  if (upgraded % 50 === 0) {
    console.log(`✅ Upgraded ${upgraded}/522 pages...`);
  }
});

console.log(`\n✅ ALL ${upgraded} PAGES UPGRADED WITH FULL DESIGN!\n`);

function buildPageWithDesign(pageInfo) {
  const route = pageInfo.route;
  const title = pageInfo.title || 'Page';
  const desc = pageInfo.description || 'Description';
  const category = getCategory(route);

  // Determine page type for specific implementations
  if (route.includes('/admin')) {
    return buildAdminPageWithDesign(pageInfo, title, desc, category);
  } else if (route.includes('/student') || route.includes('/lms')) {
    return buildStudentPageWithDesign(pageInfo, title, desc, category);
  } else if (route.includes('/employer')) {
    return buildEmployerPageWithDesign(pageInfo, title, desc, category);
  } else if (route.includes('/programs/')) {
    return buildProgramPageWithDesign(pageInfo, title, desc, category);
  } else {
    return buildMarketingPageWithDesign(pageInfo, title, desc, category);
  }
}

function buildAdminPageWithDesign(page, title, desc, category) {
  return `import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '${title}',
  description: '${desc}',
};

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">${title}</h1>
            <p className="text-xl text-blue-100">${desc}</p>
          </div>
        </div>
      </section>

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-gray-700">Admin dashboard content for ${title}</p>
          </div>
        </div>
      </div>
    </div>
  );
}`;
}

function buildStudentPageWithDesign(page, title, desc, category) {
  return `import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '${title}',
  description: '${desc}',
};

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-green-600 to-green-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">${title}</h1>
            <p className="text-xl mb-8 text-green-100">${desc}</p>
            <Link href="/student/courses" className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 text-lg inline-block">
              View My Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            ${category.features
              .map(
                (f) => `
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="${f.icon}" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">${f.title}</h3>
              <p className="text-gray-600">${f.description}</p>
            </div>
            `,
              )
              .join('')}
          </div>
        </div>
      </section>
    </div>
  );
}`;
}

function buildEmployerPageWithDesign(page, title, desc, category) {
  return `import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '${title}',
  description: '${desc}',
};

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-orange-600 to-orange-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">${title}</h1>
            <p className="text-xl mb-8 text-orange-100">${desc}</p>
            <div className="flex gap-4 justify-center">
              <Link href="/employer/jobs/new" className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 text-lg">
                Post a Job
              </Link>
              <Link href="/employer/candidates" className="bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 border-2 border-white text-lg">
                Find Candidates
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            ${category.features
              .map(
                (f) => `
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="${f.icon}" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">${f.title}</h3>
              <p className="text-gray-600">${f.description}</p>
            </div>
            `,
              )
              .join('')}
          </div>
        </div>
      </section>
    </div>
  );
}`;
}

function buildProgramPageWithDesign(page, title, desc, category) {
  return `import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '${title}',
  description: '${desc}',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">${title}</h1>
            <p className="text-xl mb-8 text-purple-100">${desc}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/apply" className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 text-lg">
                Apply Now - Free Training
              </Link>
              <Link href="/contact" className="bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-600 border-2 border-white text-lg">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Facts */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">4-12 Weeks</div>
              <div className="text-gray-600">Program Duration</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">$0</div>
              <div className="text-gray-600">100% Funded</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">85%+</div>
              <div className="text-gray-600">Job Placement</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">$35K+</div>
              <div className="text-gray-600">Starting Salary</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Program Highlights</h2>
            <div className="grid md:grid-cols-3 gap-8">
              ${category.features
                .map(
                  (f) => `
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="${f.icon}" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">${f.title}</h3>
                <p className="text-gray-600">${f.description}</p>
              </div>
              `,
                )
                .join('')}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}`;
}

function buildMarketingPageWithDesign(page, title, desc, category) {
  return `import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '${title}',
  description: '${desc}',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">${title}</h1>
            <p className="text-xl mb-8 text-blue-100">${desc}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/apply" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 text-lg">
                Get Started
              </Link>
              <Link href="/programs" className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 border-2 border-white text-lg">
                View Programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Image Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">${category.imageTitle}</h2>
                <p className="text-gray-700 mb-6">${category.imageDesc}</p>
                <ul className="space-y-3">
                  ${category.points
                    .map(
                      (point) => `
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-600 mr-2 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>${point}</span>
                  </li>
                  `,
                    )
                    .join('')}
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br ${category.gradient} rounded-lg shadow-lg flex items-center justify-center">
                  <svg className="w-24 h-24 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="${category.icon}" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
            <div className="grid md:grid-cols-3 gap-8">
              ${category.features
                .map(
                  (f) => `
              <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="${f.icon}" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">${f.title}</h3>
                <p className="text-gray-600">${f.description}</p>
              </div>
              `,
                )
                .join('')}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}`;
}

function getCategory(route) {
  if (route.includes('/admin')) {
    return {
      features: [
        {
          title: 'Data Management',
          description: 'Manage all platform data efficiently',
          icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        },
        {
          title: 'Analytics',
          description: 'Track performance with detailed reports',
          icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
        },
        {
          title: 'User Control',
          description: 'Complete control over users and permissions',
          icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
        },
      ],
    };
  } else if (route.includes('/student') || route.includes('/lms')) {
    return {
      features: [
        {
          title: 'Learn Anywhere',
          description: 'Access courses on any device',
          icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
        },
        {
          title: 'Track Progress',
          description: 'Monitor your learning journey',
          icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        },
        {
          title: 'Get Certified',
          description: 'Earn industry-recognized certifications',
          icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
        },
      ],
    };
  } else if (route.includes('/employer')) {
    return {
      features: [
        {
          title: 'Post Jobs',
          description: 'Create and manage job postings',
          icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        },
        {
          title: 'Find Talent',
          description: 'Access qualified candidates',
          icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        },
        {
          title: 'Hire Fast',
          description: 'Streamlined hiring process',
          icon: 'M13 10V3L4 14h7v7l9-11h-7z',
        },
      ],
    };
  } else {
    return {
      imageTitle: 'Transform Your Future',
      imageDesc: 'Join thousands who have launched successful careers through our programs.',
      points: [
        '100% government-funded training',
        'No cost to you - completely free',
        'Flexible scheduling options',
        'Career support from start to finish',
      ],
      gradient: 'from-blue-500 to-blue-700',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      features: [
        {
          title: '100% Funded',
          description: 'All programs completely free through government funding',
          icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        },
        {
          title: 'Job Placement',
          description: 'We help you find employment after training',
          icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        },
        {
          title: 'Expert Training',
          description: 'Learn from industry professionals',
          icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
        },
      ],
    };
  }
}
