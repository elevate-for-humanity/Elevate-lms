/**
 * Setup ALL Partner Courses in the provider-neutral catalog with 40% markup
 * Run with: npx tsx scripts/setup-all-partner-courses.ts
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing Supabase service credentials');
const db = createClient(url, key);

// All Partner Courses with 40% Markup
const partnerCourses = {
  // CareerSafe OSHA Training
  careersafe: [
    {
      name: 'OSHA 10-Hour General Industry',
      basePrice: 35,
      price: 49,
      provider: 'CareerSafe',
      category: 'OSHA Safety',
      description: 'DOL card issued upon completion',
    },
    {
      name: 'OSHA 30-Hour General Industry',
      basePrice: 85,
      price: 119,
      provider: 'CareerSafe',
      category: 'OSHA Safety',
      description: 'DOL card issued upon completion',
    },
    {
      name: 'OSHA 10-Hour Construction',
      basePrice: 35,
      price: 49,
      provider: 'CareerSafe',
      category: 'OSHA Safety',
      description: 'DOL card issued upon completion',
    },
    {
      name: 'OSHA 30-Hour Construction',
      basePrice: 85,
      price: 119,
      provider: 'CareerSafe',
      category: 'OSHA Safety',
      description: 'DOL card issued upon completion',
    },
    {
      name: 'Bloodborne Pathogens',
      basePrice: 25,
      price: 35,
      provider: 'CareerSafe',
      category: 'OSHA Safety',
      description: '1-year certification',
    },
    {
      name: 'HAZWOPER 8-Hour Refresher',
      basePrice: 45,
      price: 63,
      provider: 'CareerSafe',
      category: 'OSHA Safety',
      description: 'Annual refresher required',
    },
    {
      name: 'Forklift/Powered Industrial Truck',
      basePrice: 55,
      price: 77,
      provider: 'CareerSafe',
      category: 'OSHA Safety',
      description: '3-year certification',
    },
    {
      name: 'Confined Space Entry',
      basePrice: 35,
      price: 49,
      provider: 'CareerSafe',
      category: 'OSHA Safety',
      description: 'Annual recommended',
    },
    {
      name: 'Lockout/Tagout (LOTO)',
      basePrice: 35,
      price: 49,
      provider: 'CareerSafe',
      category: 'OSHA Safety',
      description: 'Annual recommended',
    },
    {
      name: 'Fall Protection',
      basePrice: 35,
      price: 49,
      provider: 'CareerSafe',
      category: 'OSHA Safety',
      description: 'Annual recommended',
    },
  ],

  // HSI Safety Training
  hsi: [
    {
      name: 'CPR/AED (Adult, Child, Infant)',
      basePrice: 60,
      price: 84,
      provider: 'HSI',
      category: 'Healthcare Safety',
      description: '2-year certification',
    },
    {
      name: 'Healthcare Provider CPR',
      basePrice: 70,
      price: 98,
      provider: 'HSI',
      category: 'Healthcare Safety',
      description: '2-year certification',
    },
    {
      name: 'Basic First Aid',
      basePrice: 50,
      price: 70,
      provider: 'HSI',
      category: 'Healthcare Safety',
      description: '2-year certification',
    },
    {
      name: 'Pediatric First Aid',
      basePrice: 60,
      price: 84,
      provider: 'HSI',
      category: 'Healthcare Safety',
      description: '2-year certification',
    },
    {
      name: 'Wilderness First Aid',
      basePrice: 75,
      price: 105,
      provider: 'HSI',
      category: 'Healthcare Safety',
      description: '2-year certification',
    },
    {
      name: 'Bloodborne Pathogens',
      basePrice: 40,
      price: 56,
      provider: 'HSI',
      category: 'Healthcare Safety',
      description: '1-year certification',
    },
    {
      name: 'CPR/AED + First Aid Combo',
      basePrice: 95,
      price: 133,
      provider: 'HSI',
      category: 'Healthcare Safety',
      description: '2-year certification',
    },
  ],

  // Certiport Technology Certifications
  certiport: [
    {
      name: 'Microsoft Office Specialist (MOS) - Word',
      basePrice: 100,
      price: 140,
      provider: 'Certiport',
      category: 'Technology',
      description: 'Lifetime certification',
    },
    {
      name: 'Microsoft Office Specialist (MOS) - Excel',
      basePrice: 100,
      price: 140,
      provider: 'Certiport',
      category: 'Technology',
      description: 'Lifetime certification',
    },
    {
      name: 'Microsoft Office Specialist (MOS) - PowerPoint',
      basePrice: 100,
      price: 140,
      provider: 'Certiport',
      category: 'Technology',
      description: 'Lifetime certification',
    },
    {
      name: 'Microsoft Office Specialist (MOS) - Outlook',
      basePrice: 100,
      price: 140,
      provider: 'Certiport',
      category: 'Technology',
      description: 'Lifetime certification',
    },
    {
      name: 'Microsoft Office Specialist (MOS) - Access',
      basePrice: 100,
      price: 140,
      provider: 'Certiport',
      category: 'Technology',
      description: 'Lifetime certification',
    },
    {
      name: 'Adobe Certified Professional - Photoshop',
      basePrice: 120,
      price: 168,
      provider: 'Certiport',
      category: 'Technology',
      description: 'Lifetime certification',
    },
    {
      name: 'Adobe Certified Professional - Illustrator',
      basePrice: 120,
      price: 168,
      provider: 'Certiport',
      category: 'Technology',
      description: 'Lifetime certification',
    },
    {
      name: 'Adobe Certified Professional - InDesign',
      basePrice: 120,
      price: 168,
      provider: 'Certiport',
      category: 'Technology',
      description: 'Lifetime certification',
    },
    {
      name: 'QuickBooks Certified User',
      basePrice: 100,
      price: 140,
      provider: 'Certiport',
      category: 'Technology',
      description: 'Lifetime certification',
    },
    {
      name: 'IT Specialist - Python',
      basePrice: 100,
      price: 140,
      provider: 'Certiport',
      category: 'Technology',
      description: 'Lifetime certification',
    },
    {
      name: 'IT Specialist - JavaScript',
      basePrice: 100,
      price: 140,
      provider: 'Certiport',
      category: 'Technology',
      description: 'Lifetime certification',
    },
    {
      name: 'IT Specialist - HTML/CSS',
      basePrice: 100,
      price: 140,
      provider: 'Certiport',
      category: 'Technology',
      description: 'Lifetime certification',
    },
    {
      name: 'Entrepreneurship & Small Business (ESB)',
      basePrice: 100,
      price: 140,
      provider: 'Certiport',
      category: 'Technology',
      description: 'Lifetime certification',
    },
  ],

  // NRF RISE Up
  nrf: [
    {
      name: 'Customer Service & Sales',
      basePrice: 50,
      price: 70,
      provider: 'NRF Foundation',
      category: 'Retail',
      description: 'Lifetime certification',
    },
    {
      name: 'Business of Retail',
      basePrice: 50,
      price: 70,
      provider: 'NRF Foundation',
      category: 'Retail',
      description: 'Lifetime certification',
    },
    {
      name: 'NRF RISE Up Bundle (Both Courses)',
      basePrice: 85,
      price: 119,
      provider: 'NRF Foundation',
      category: 'Retail',
      description: 'Lifetime certification',
    },
  ],

  // Milady RISE
  milady: [
    {
      name: 'Barber Safety Program - Domestic Violence Awareness',
      basePrice: 30,
      price: 42,
      provider: 'Milady/Cengage',
      category: 'Barber Training',
      description: 'Lifetime certification',
    },
    {
      name: 'Barber Safety Program - Human Trafficking Awareness',
      basePrice: 30,
      price: 42,
      provider: 'Milady/Cengage',
      category: 'Barber Training',
      description: 'Lifetime certification',
    },
    {
      name: 'Barber Safety Program - Infection Control & Safety',
      basePrice: 30,
      price: 42,
      provider: 'Milady/Cengage',
      category: 'Barber Training',
      description: 'Lifetime certification',
    },
    {
      name: 'Milady RISE Complete Bundle',
      basePrice: 75,
      price: 105,
      provider: 'Milady/Cengage',
      category: 'Barber Training',
      description: 'All 3 certifications',
    },
  ],

  // JRI (Job Readiness Initiative)
  jri: [
    {
      name: 'Communication Skills Badge',
      basePrice: 25,
      price: 35,
      provider: 'EmployIndy',
      category: 'Job Readiness',
      description: 'Lifetime badge',
    },
    {
      name: 'Problem Solving & Critical Thinking Badge',
      basePrice: 25,
      price: 35,
      provider: 'EmployIndy',
      category: 'Job Readiness',
      description: 'Lifetime badge',
    },
    {
      name: 'Teamwork & Collaboration Badge',
      basePrice: 25,
      price: 35,
      provider: 'EmployIndy',
      category: 'Job Readiness',
      description: 'Lifetime badge',
    },
    {
      name: 'Professionalism & Work Ethic Badge',
      basePrice: 25,
      price: 35,
      provider: 'EmployIndy',
      category: 'Job Readiness',
      description: 'Lifetime badge',
    },
    {
      name: 'Career Management Badge',
      basePrice: 25,
      price: 35,
      provider: 'EmployIndy',
      category: 'Job Readiness',
      description: 'Lifetime badge',
    },
    {
      name: 'Digital Literacy Badge',
      basePrice: 25,
      price: 35,
      provider: 'EmployIndy',
      category: 'Job Readiness',
      description: 'Lifetime badge',
    },
    {
      name: 'JRI Complete Bundle (All 6 Badges)',
      basePrice: 120,
      price: 168,
      provider: 'EmployIndy',
      category: 'Job Readiness',
      description: 'All 6 badges',
    },
  ],

  // VITA Tax Training
  vita: [
    {
      name: 'IRS Link & Learn Taxes - Basic',
      basePrice: 0,
      price: 0,
      provider: 'IRS',
      category: 'Tax Preparation',
      description: 'FREE IRS training',
    },
    {
      name: 'IRS Link & Learn Taxes - Advanced',
      basePrice: 0,
      price: 0,
      provider: 'IRS',
      category: 'Tax Preparation',
      description: 'FREE IRS training',
    },
    {
      name: 'VITA Site Coordinator Training',
      basePrice: 50,
      price: 70,
      provider: 'Elevate for Humanity',
      category: 'Tax Preparation',
      description: 'Annual certification',
    },
  ],
};

async function createProduct(item: any, providerKey: string) {
  if (item.price === 0) return null;
  const slug = `partner-${providerKey}-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
  const payload = {
    slug,
    name: item.name,
    description: item.description,
    price_cents: Math.round(item.price * 100),
    type: 'partner_course',
    active: true,
    metadata: {
      provider: item.provider,
      category: item.category,
      base_price_cents: Math.round(item.basePrice * 100),
      markup: '40%',
      provider_key: providerKey,
      billing_provider: 'quickbooks',
    },
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await db.from('products').upsert(payload, { onConflict: 'slug' }).select('id,slug').single();
  if (error) throw error;
  return data;
}

async function main() {
  let totalCreated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  // Process each partner
  for (const [providerKey, courses] of Object.entries(partnerCourses)) {
    const providerName = courses[0]?.provider || providerKey;

    for (const course of courses) {
      const result = await createProduct(course, providerKey);
      if (result) {
        totalCreated++;
      } else if (course.price === 0) {
        totalSkipped++;
      } else {
        totalFailed++;
      }
      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Summary
}

main().catch(console.error);
