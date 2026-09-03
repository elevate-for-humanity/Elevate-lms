#!/usr/bin/env node
/**
 * Add image sections to pages
 */

const fs = require('fs');

const placeholders = JSON.parse(fs.readFileSync('/tmp/placeholders.json', 'utf8'));

console.log('Adding image sections...\n');

let updated = 0;

placeholders.pages.forEach((page) => {
  const filePath = page.file;

  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has images
  if (content.includes('Image Section') || content.includes('<img')) {
    return;
  }

  // Add image section after hero
  const imageSection = generateImageSection(page);

  content = content.replace(/(<\/section>\s*{\/\* Hero Banner \*\/})/, `$1\n${imageSection}`);

  fs.writeFileSync(filePath, 'utf8');
  updated++;

  if (updated % 50 === 0) {
    console.log(`Updated ${updated} pages...`);
  }
});

console.log(`\n✅ Added images to ${updated} pages`);

function generateImageSection(page) {
  const category = getCategory(page.route);

  return `
      {/* Image Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">${category.title}</h2>
                <p className="text-gray-700 mb-4">
                  ${category.description}
                </p>
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
`;
}

function getCategory(route) {
  if (route.includes('/admin')) {
    return {
      title: 'Powerful Administration',
      description:
        'Manage your entire platform with intuitive admin tools designed for efficiency.',
      points: [
        'Real-time data analytics and reporting',
        'User management with role-based access',
        'Automated workflows and notifications',
        'Secure data handling and compliance',
      ],
      gradient: 'from-blue-500 to-blue-700',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    };
  } else if (route.includes('/student') || route.includes('/lms')) {
    return {
      title: 'Your Learning Journey',
      description: 'Access world-class training programs designed to launch your career.',
      points: [
        'Self-paced learning with expert support',
        'Industry-recognized certifications',
        'Hands-on practical experience',
        'Job placement assistance included',
      ],
      gradient: 'from-green-500 to-green-700',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    };
  } else if (route.includes('/employer')) {
    return {
      title: 'Hire Qualified Talent',
      description: 'Connect with job-ready candidates from our training programs.',
      points: [
        'Pre-screened, certified candidates',
        'Fast hiring process',
        'Reduced training costs',
        'Ongoing support and placement services',
      ],
      gradient: 'from-orange-500 to-orange-700',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    };
  } else {
    return {
      title: 'Transform Your Future',
      description: 'Join thousands who have launched successful careers through our programs.',
      points: [
        '100% government-funded training',
        'No cost to you - completely free',
        'Flexible scheduling options',
        'Career support from start to finish',
      ],
      gradient: 'from-purple-500 to-purple-700',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    };
  }
}
