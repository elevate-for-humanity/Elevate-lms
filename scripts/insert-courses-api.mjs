#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY is required'); process.exit(1); }


const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const programs = [
  {slug: 'business-startup', title: 'Business Start-Up Program', tagline: 'Launch your business', summary: 'Learn entrepreneurship and business planning', description: 'Complete business startup program', bullets: ['5-week program', 'LLC formation', 'Digital marketing'], funding: ['WIOA', 'WRG'], duration_hours: 32, status: 'published'},
  {slug: 'hvac-tech', title: 'HVAC Technician', tagline: 'Master HVAC systems', summary: '600-hour HVAC training program', description: 'Comprehensive HVAC training', bullets: ['EPA 608', 'OSHA 10', 'Hands-on training'], funding: ['WIOA', 'WRG'], duration_hours: 600, status: 'published'},
  {slug: 'medical-assistant', title: 'Medical Assistant', tagline: 'Healthcare career training', summary: '720-hour medical assistant program', description: 'Clinical and administrative training', bullets: ['Clinical skills', 'Medical terminology', 'Externship'], funding: ['WIOA', 'WRG'], duration_hours: 720, status: 'published'},
  {slug: 'barber-apprentice', title: 'Barber Apprenticeship', tagline: 'Earn while you learn', summary: '1500-hour DOL apprenticeship', description: 'State-registered barber training', bullets: ['DOL registered', 'Paid training', 'State license'], funding: ['WIOA', 'Apprenticeship'], duration_hours: 1500, status: 'published'},
  {slug: 'dsp-training', title: 'Direct Support Professional', tagline: 'Support individuals with disabilities', summary: '120-hour DSP certification', description: 'DSP training program', bullets: ['DSP cert', 'CPR/First Aid', 'Field placement'], funding: ['WIOA', 'WRG'], duration_hours: 120, status: 'published'},
  {slug: 'esthetician', title: 'Professional Esthetician', tagline: 'Skincare specialist', summary: '700-hour esthetician program', description: 'Complete esthetician training', bullets: ['State license', 'Skincare', 'Facials'], funding: ['WIOA', 'WRG'], duration_hours: 700, status: 'published'},
  {slug: 'tax-prep', title: 'Tax Preparation', tagline: 'Become a tax preparer', summary: '80-hour tax prep program', description: 'Tax preparation training', bullets: ['IRS PTIN', 'Tax software', 'Client service'], funding: ['WIOA', 'WRG'], duration_hours: 80, status: 'published'},
  {slug: 'reentry-specialist', title: 'Reentry Specialist', tagline: 'Support justice-involved', summary: '160-hour reentry program', description: 'Reentry specialist training', bullets: ['Case management', 'Resources', 'Trauma care'], funding: ['WIOA', 'JRI'], duration_hours: 160, status: 'published'},
  {slug: 'beauty-educator', title: 'Beauty Educator', tagline: 'Train beauty professionals', summary: '240-hour educator program', description: 'Beauty educator training', bullets: ['Instructional design', 'Curriculum', 'Assessment'], funding: ['WIOA', 'WRG'], duration_hours: 240, status: 'published'},
  {slug: 'peer-support', title: 'Peer Support Professional', tagline: 'Support in recovery', summary: '80-hour peer support program', description: 'Peer support training', bullets: ['Recovery principles', 'Active listening', 'Resources'], funding: ['WIOA', 'WRG'], duration_hours: 80, status: 'published'},
  {slug: 'recovery-coach', title: 'Recovery Coach', tagline: 'Guide recovery journey', summary: '80-hour recovery coach program', description: 'Recovery coach training', bullets: ['Motivational interviewing', 'Recovery planning', 'Prevention'], funding: ['WIOA', 'WRG'], duration_hours: 80, status: 'published'},
  {slug: 'cpr-cert', title: 'CPR Certification', tagline: 'Life-saving skills', summary: '8-hour CPR training', description: 'CPR and First Aid', bullets: ['AHA certified', 'CPR/AED', 'First Aid'], funding: ['WIOA', 'WRG'], duration_hours: 8, status: 'published'},
  {slug: 'chw-cert', title: 'Community Healthcare Worker', tagline: 'Bridge healthcare gaps', summary: '160-hour CHW program', description: 'Community health worker training', bullets: ['Health education', 'Navigation', 'Outreach'], funding: ['WIOA', 'WRG'], duration_hours: 160, status: 'published'},
  {slug: 'health-safety', title: 'Emergency Health & Safety', tagline: 'Workplace safety', summary: '40-hour safety program', description: 'Safety and emergency response', bullets: ['CPR/AED', 'First Aid', 'OSHA 10'], funding: ['WIOA', 'WRG'], duration_hours: 40, status: 'published'},
  {slug: 'nrf-riseup', title: 'NRF Rise Up', tagline: 'Retail fundamentals', summary: '40-hour retail program', description: 'Retail industry training', bullets: ['Customer service', 'Retail ops', 'NRF cert'], funding: ['WIOA', 'WRG'], duration_hours: 40, status: 'published'},
  {slug: 'jri-series', title: 'JRI Complete Series', tagline: 'Justice reinvestment', summary: '120-hour JRI program', description: 'JRI training series', bullets: ['Life skills', 'Employment', 'Reentry'], funding: ['WIOA', 'JRI'], duration_hours: 120, status: 'published'}
];

const courses = [
  {slug: 'business-startup', title: 'Business Start-Up Program', subtitle: 'Launch your business', description: 'Learn entrepreneurship and business planning', level: 'beginner', duration_hours: 32, status: 'published', is_free: true},
  {slug: 'hvac-tech', title: 'HVAC Technician', subtitle: 'Master HVAC systems', description: '600-hour HVAC training program', level: 'beginner', duration_hours: 600, status: 'published', is_free: true},
  {slug: 'medical-assistant', title: 'Medical Assistant', subtitle: 'Healthcare career training', description: '720-hour medical assistant program', level: 'beginner', duration_hours: 720, status: 'published', is_free: true},
  {slug: 'barber-apprentice', title: 'Barber Apprenticeship', subtitle: 'Earn while you learn', description: '1500-hour DOL apprenticeship', level: 'beginner', duration_hours: 1500, status: 'published', is_free: true},
  {slug: 'dsp-training', title: 'Direct Support Professional', subtitle: 'Support individuals', description: '120-hour DSP certification', level: 'beginner', duration_hours: 120, status: 'published', is_free: true},
  {slug: 'esthetician', title: 'Professional Esthetician', subtitle: 'Skincare specialist', description: '700-hour esthetician program', level: 'beginner', duration_hours: 700, status: 'published', is_free: true},
  {slug: 'tax-prep', title: 'Tax Preparation', subtitle: 'Become a tax preparer', description: '80-hour tax prep program', level: 'beginner', duration_hours: 80, status: 'published', is_free: true},
  {slug: 'reentry-specialist', title: 'Reentry Specialist', subtitle: 'Support justice-involved', description: '160-hour reentry program', level: 'beginner', duration_hours: 160, status: 'published', is_free: true},
  {slug: 'beauty-educator', title: 'Beauty Educator', subtitle: 'Train professionals', description: '240-hour educator program', level: 'intermediate', duration_hours: 240, status: 'published', is_free: true},
  {slug: 'peer-support', title: 'Peer Support Professional', subtitle: 'Support in recovery', description: '80-hour peer support program', level: 'beginner', duration_hours: 80, status: 'published', is_free: true},
  {slug: 'recovery-coach', title: 'Recovery Coach', subtitle: 'Guide recovery', description: '80-hour recovery coach program', level: 'beginner', duration_hours: 80, status: 'published', is_free: true},
  {slug: 'cpr-cert', title: 'CPR Certification', subtitle: 'Life-saving skills', description: '8-hour CPR training', level: 'beginner', duration_hours: 8, status: 'published', is_free: true},
  {slug: 'chw-cert', title: 'Community Healthcare Worker', subtitle: 'Bridge healthcare', description: '160-hour CHW program', level: 'beginner', duration_hours: 160, status: 'published', is_free: true},
  {slug: 'health-safety', title: 'Emergency Health & Safety', subtitle: 'Workplace safety', description: '40-hour safety program', level: 'beginner', duration_hours: 40, status: 'published', is_free: true},
  {slug: 'nrf-riseup', title: 'NRF Rise Up', subtitle: 'Retail fundamentals', description: '40-hour retail program', level: 'beginner', duration_hours: 40, status: 'published', is_free: true},
  {slug: 'jri-series', title: 'JRI Complete Series', subtitle: 'Justice reinvestment', description: '120-hour JRI program', level: 'beginner', duration_hours: 120, status: 'published', is_free: true},
  {slug: 'rise-up-extra', title: 'Rise Up Certificate', subtitle: 'Additional certification', description: '40-hour certificate program', level: 'beginner', duration_hours: 40, status: 'published', is_free: true}
];

async function insertPrograms() {

  const { data, error } = await supabase
    .from('programs')
    .upsert(programs, { onConflict: 'slug' });

  if (error) {
    console.error('❌ Error inserting programs:', error.message);
    return false;
  }

  return true;
}

async function insertCourses() {

  const { data, error } = await supabase
    .from('courses')
    .upsert(courses, { onConflict: 'slug' });

  if (error) {
    console.error('❌ Error inserting courses:', error.message);
    return false;
  }

  return true;
}

async function verify() {

  const { count: progCount } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true });

  const { count: courseCount } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true });


  return progCount >= 16 && courseCount >= 17;
}

async function main() {
  const progSuccess = await insertPrograms();
  if (!progSuccess) process.exit(1);

  const courseSuccess = await insertCourses();
  if (!courseSuccess) process.exit(1);

  const verified = await verify();

  if (verified) {
  } else {
  }
}

main();
