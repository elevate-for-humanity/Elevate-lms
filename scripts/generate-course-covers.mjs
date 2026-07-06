#!/usr/bin/env node
// scripts/generate-course-covers.mjs
// Auto-generates course cover images for all Elevate programs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const coversDir = path.join(root, 'public', 'course-covers');

// All Elevate training programs
const courses = [
  {
    slug: 'barber-apprenticeship',
    title: 'Barber Apprenticeship Program',
    color: '#dc2626',
  },
  {
    slug: 'cna-training',
    title: 'CNA Certification Training',
    color: '#2563eb',
  },
  { slug: 'hvac-tech', title: 'HVAC Technician Training', color: '#f97316' },
  {
    slug: 'building-tech',
    title: 'Building Maintenance Technology',
    color: '#dc2626',
  },
  { slug: 'life-coach', title: 'Life & Success Coaching', color: '#8b5cf6' },
  {
    slug: 'peer-recovery',
    title: 'Peer Recovery Specialist',
    color: '#10b981',
  },
  {
    slug: 'medical-assistant',
    title: 'Medical Assistant Training',
    color: '#dc2626',
  },
  { slug: 'truck-driving', title: 'CDL Truck Driving', color: '#f97316' },
  {
    slug: 'workforce-readiness',
    title: 'Workforce Readiness Bootcamp',
    color: '#2563eb',
  },
];

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateSVGCover(course) {
  return `<svg width="1200" height="800" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${course.slug}-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#f97316;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background gradient -->
  <rect width="1200" height="800" fill="url(#${course.slug}-bg)"/>

  <!-- Overlay for better text contrast -->
  <rect width="1200" height="800" fill="rgba(0,0,0,0.4)"/>

  <!-- Top branding bar -->
  <rect y="0" width="1200" height="100" fill="rgba(255,255,255,0.1)"/>
  <text x="60" y="65" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="white" letter-spacing="2">
    ELEVATE FOR HUMANITY
  </text>

  <!-- Main content area -->
  <g transform="translate(600, 400)">
    <!-- Course title -->
    <text x="0" y="-80" font-family="Arial, sans-serif" font-size="64" font-weight="800" fill="white" text-anchor="middle" filter="url(#shadow)">
      ${course.title.toUpperCase().split(' ').slice(0, 2).join(' ')}
    </text>
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="64" font-weight="800" fill="white" text-anchor="middle" filter="url(#shadow)">
      ${course.title.toUpperCase().split(' ').slice(2).join(' ')}
    </text>

    <!-- Subtitle -->
    <text x="0" y="60" font-family="Arial, sans-serif" font-size="28" fill="white" text-anchor="middle" opacity="0.95">
      WIOA-Funded Workforce Training
    </text>
  </g>

  <!-- Bottom info bar -->
  <rect y="700" width="1200" height="100" fill="rgba(0,0,0,0.5)"/>
  <text x="60" y="755" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="white">
    ✓ 100% Free Training  •  ✓ Industry Certification  •  ✓ Job Placement Support
  </text>
</svg>`;
}

function main() {
  // Skip if covers already exist (for faster dev startup)
  if (fs.existsSync(coversDir)) {
    const existingCovers = courses.filter((course) => {
      const courseDir = path.join(coversDir, course.slug);
      const svgPath = path.join(courseDir, 'cover.svg');
      return fs.existsSync(svgPath);
    });

    if (existingCovers.length === courses.length) {
      console.log('✅ Course covers already exist, skipping generation');
      return;
    }
  }

  ensureDirExists(coversDir);

  let generated = 0;
  let skipped = 0;

  courses.forEach((course) => {
    const courseDir = path.join(coversDir, course.slug);
    ensureDirExists(courseDir);

    const svgPath = path.join(courseDir, 'cover.svg');

    // Skip if already exists
    if (fs.existsSync(svgPath)) {
      skipped++;
      return;
    }

    // Generate SVG cover
    const svgContent = generateSVGCover(course);
    fs.writeFileSync(svgPath, svgContent);

    generated++;
  });

  if (generated > 0) {
    console.log(`✅ Generated ${generated} course covers`);
  }
  if (skipped > 0) {
    console.log(`⏭️  Skipped ${skipped} existing covers`);
  }

  console.log('💡 To customize a cover, replace the SVG file with your own image');
  console.log('   Example: public/course-covers/barber-apprenticeship/cover.jpg');
}

main();
