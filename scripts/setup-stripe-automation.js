#!/usr/bin/env node

/**
 * Stripe Auto-Enrollment Setup Script
 * Creates products, prices, and payment links with proper metadata
 * for automatic enrollment system
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// Program definitions with metadata
const PROGRAMS = [
  {
    id: 'prog-cna',
    name: 'Certified Nursing Assistant (CNA)',
    description: 'Complete CNA training program with state certification prep',
    price: 150000, // $1,500
    courses: ['job-ready-indy-core'],
  },
  {
    id: 'prog-barber',
    name: 'Barber Apprenticeship',
    description: 'Complete barbering program with state licensure prep',
    price: 250000, // $2,500
    courses: ['barber-apprentice-foundations'],
  },
  {
  {
    id: 'prog-hvac',
    name: 'HVAC Technician',
    description: 'HVAC installation, maintenance, and repair training',
    price: 350000, // $3,500
    courses: ['hvac-tech-foundations'],
  },
  {
    id: 'prog-cdl',
    name: 'Commercial Driver License (CDL)',
    description: 'CDL training with ELDT certification',
    price: 400000, // $4,000
    courses: ['cdl-eldt-core'],
  },
  {
    id: 'prog-business-apprentice',
    name: 'Business Apprenticeship',
    description: 'Business fundamentals and entrepreneurship training',
    price: 180000, // $1,800
    courses: ['business-apprentice-foundations'],
  },
  {
    id: 'prog-esthetics-apprentice',
    name: 'Esthetics Apprenticeship',
    description: 'Esthetics and skincare professional training',
    price: 220000, // $2,200
    courses: ['esthetics-apprentice-foundations'],
  },
];

// HSI Partner Courses
const HSI_COURSES = [
  {
    id: 'hsi-cpr-aed-all-ages',
    name: 'CPR/AED Certification (All Ages)',
    description: 'CPR and AED training for adults, children, and infants',
    price: 13500, // $135
    partnerId: 'partner-hsi',
    enrollmentLink:
      'https://otis.osmanager4.com/#/nts/openenrollment/906B45CC-211D-48B3-A2FE-71D2C6D464F3',
  },
  {
    id: 'hsi-cpr-aed-adult',
    name: 'CPR/AED Certification (Adult Only)',
    description: 'CPR and AED training for adults only',
    price: 11900, // $119
    partnerId: 'partner-hsi',
    enrollmentLink:
      'https://otis.osmanager4.com/#/nts/openenrollment/8B978D3E-85A4-48E7-AFF2-5F01FFF12F35',
  },
  {
    id: 'hsi-first-aid-cpr-all-ages',
    name: 'First Aid + CPR/AED (All Ages)',
    description: 'Complete first aid and CPR training for all ages',
    price: 18900, // $189
    partnerId: 'partner-hsi',
    enrollmentLink:
      'https://otis.osmanager4.com/#/nts/openenrollment/D84A8E63-967E-4A63-944A-AA3E33D777A8',
  },
  {
    id: 'hsi-first-aid-cpr-adult',
    name: 'First Aid + CPR/AED (Adult Only)',
    description: 'Complete first aid and CPR training for adults',
    price: 18900, // $189
    partnerId: 'partner-hsi',
    enrollmentLink:
      'https://otis.osmanager4.com/#/nts/openenrollment/A373CD50-3045-49B1-B119-62A1DC5EFF47',
  },
];

async function main() {
  // Check for Stripe key
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey || stripeKey.includes('sk_test_...') || stripeKey.includes('sk_live_...')) {
    const continueAnyway = await question('Continue with manual setup instructions? (y/n): ');
    if (continueAnyway.toLowerCase() !== 'y') {
      rl.close();
      return;
    }
  }

  await question('Press Enter when environment variables are configured...');

  for (const program of PROGRAMS) {
  }

  for (const course of HSI_COURSES) {
  }

  await question('Press Enter when all payment links are created...');

  await question('Press Enter when webhook is configured...');

  rl.close();
}

main().catch(console.error);
