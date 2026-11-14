#!/usr/bin/env node
/**
 * Downloads contextually appropriate Pexels images sized to match actual usage.
 *
 * Size key (matches Next.js Image usage in the codebase):
 *   hero_full  → 1920×1080  fill + sizes="100vw"  (full-bleed page heroes)
 *   hero_half  → 1200×800   fill + sizes="50vw"   (split-layout heroes)
 *   card       → 800×600    fill + sizes="33vw"   (card thumbnails)
 *   og         → 1200×630   Open Graph / meta image
 *   fixed_600  → 600×500    width={600} height={500}
 *   portrait   → 800×1000   tall crop for person photos
 *   square_sm  → 200×200    small square icons/avatars
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) { console.error('PEXELS_API_KEY not set'); process.exit(1); }

const PUBLIC = path.resolve('public');

const SIZES = {
  hero_full: { w: 1920, h: 1080, orientation: 'landscape', src: 'original' },
  hero_half: { w: 1200, h: 800,  orientation: 'landscape', src: 'large2x' },
  card:      { w: 800,  h: 600,  orientation: 'landscape', src: 'large' },
  og:        { w: 1200, h: 630,  orientation: 'landscape', src: 'large2x' },
  fixed_600: { w: 600,  h: 500,  orientation: 'landscape', src: 'large' },
  portrait:  { w: 800,  h: 1000, orientation: 'portrait',  src: 'large2x' },
  square_sm: { w: 200,  h: 200,  orientation: 'square',    src: 'medium' },
};

const IMAGES = {
  // OG
  'images/og-image.jpg': { q: 'diverse workforce career training professional', size: 'og' },

  // Full-bleed heroes
  'images/hero-banner.jpg':                          { q: 'diverse students career training classroom', size: 'hero_full' },
  'images/facility-hero.jpg':                        { q: 'modern training facility building exterior', size: 'hero_full' },
  'images/building-maintenance.jpg':                 { q: 'building maintenance hvac technician', size: 'hero_full' },
  'images/hero/admin-hero.jpg':                      { q: 'professional administrator office modern', size: 'hero_full' },
  'images/hero/hero-career-services.jpg':            { q: 'career counseling job coaching professional', size: 'hero_full' },
  'images/hero/hero-community.jpg':                  { q: 'diverse community group people smiling', size: 'hero_full' },
  'images/hero/hero-hands-on-training.jpg':          { q: 'hands on vocational training workshop', size: 'hero_full' },
  'images/heroes/lms-analytics.jpg':                 { q: 'data analytics dashboard computer screen', size: 'hero_full' },
  'images/heroes/student-catalog.jpg':               { q: 'student browsing online courses laptop', size: 'hero_full' },
  'images/heroes/training-provider-1.jpg':           { q: 'professional training instructor classroom', size: 'hero_full' },
  'images/heroes/training-provider-2.jpg':           { q: 'vocational training hands on workshop', size: 'hero_full' },
  'images/heroes/training-provider-3.jpg':           { q: 'career education certification program', size: 'hero_full' },
  'images/heroes/workforce-partner-1.jpg':           { q: 'business partnership handshake professional', size: 'hero_full' },
  'images/heroes/workforce-partner-2.jpg':           { q: 'employer workforce development meeting', size: 'hero_full' },
  'images/heroes/workforce-partner-3.jpg':           { q: 'corporate training professional development', size: 'hero_full' },
  'images/heroes/workforce-partner-4.jpg':           { q: 'team collaboration office professional', size: 'hero_full' },
  'images/heroes/workforce-partner-5.jpg':           { q: 'hiring manager interview professional', size: 'hero_full' },
  'images/artlist/hero-training-1.jpg':              { q: 'student learning classroom education', size: 'hero_full' },
  'images/artlist/hero-training-2.jpg':              { q: 'vocational training workshop tools', size: 'hero_full' },
  'images/artlist/hero-training-3.jpg':              { q: 'professional certification exam study', size: 'hero_full' },
  'images/artlist/hero-training-4.jpg':              { q: 'career training diverse students', size: 'hero_full' },
  'images/artlist/hero-training-5.jpg':              { q: 'hands on technical training', size: 'hero_full' },
  'images/artlist/hero-training-6.jpg':              { q: 'workforce development job training', size: 'hero_full' },
  'images/artlist/hero-training-7.jpg':              { q: 'adult education community college', size: 'hero_full' },
  'images/barber/gallery-1.jpg':                     { q: 'barbershop haircut professional barber', size: 'hero_full' },
  'images/pages/barber-hero.jpg':                    { q: 'barber apprenticeship training professional', size: 'hero_full' },
  'images/pages/barber-tools.jpg':                   { q: 'barber tools clippers scissors professional', size: 'hero_full' },
  'images/gallery/image2.jpg':                       { q: 'career training graduation ceremony', size: 'hero_full' },
  'images/partners/hero.jpg':                        { q: 'business partnership collaboration professional', size: 'hero_full' },
  'images/pathways/business-hero.jpg':               { q: 'business startup entrepreneur professional', size: 'hero_full' },
  'images/pages/ai-tutor-page-1.jpg':                { q: 'artificial intelligence education technology', size: 'hero_full' },
  'images/pages/career-services-page-10.jpg':        { q: 'career services resume job placement', size: 'hero_full' },
  'images/pages/career-services-page-11.jpg':        { q: 'job interview professional career', size: 'hero_full' },
  'images/pages/instructor-credentials-page-1.jpg':  { q: 'instructor teacher certification credential', size: 'hero_full' },
  'images/pages/ojt-and-funding.jpg':                { q: 'on the job training workforce funding', size: 'hero_full' },
  'images/pages/ojt-and-funding-page-1.jpg':         { q: 'workforce development funding grant', size: 'hero_full' },
  'images/pages/funding-impact-1.jpg':               { q: 'community impact workforce development', size: 'hero_full' },
  'images/pages/platform-page-12.jpg':               { q: 'online learning platform dashboard', size: 'hero_full' },
  'images/pages/platform-partners-hero.jpg':         { q: 'technology platform partnership business', size: 'hero_full' },
  'images/pages/rise-foundation-page-2.jpg':         { q: 'nonprofit community foundation support', size: 'hero_full' },
  'images/pages/rise-foundation-page-4.jpg':         { q: 'community outreach program volunteers', size: 'hero_full' },
  'images/pages/share-page-1.jpg':                   { q: 'social media sharing community online', size: 'hero_full' },
  'images/pages/student-support-page-1.jpg':         { q: 'student support services tutoring help', size: 'hero_full' },
  'images/pages/tuition-fees-page-1.jpg':            { q: 'tuition payment financial aid education', size: 'hero_full' },
  'images/pages/workforce-board-page-1.jpg':         { q: 'workforce development board meeting', size: 'hero_full' },
  'images/pages/workforce-board-page-2.jpg':         { q: 'workforce board community partners', size: 'hero_full' },
  'images/pages/workforce-board-page-10.jpg':        { q: 'workforce investment board professional', size: 'hero_full' },
  'images/pages/workone-packet-1.jpg':               { q: 'workforce one stop career center', size: 'hero_full' },
  'images/pages/workone-packet-2.jpg':               { q: 'job seeker career services workforce', size: 'hero_full' },
  'images/pages/workone-partner-packet-page-1.jpg':  { q: 'workforce partner employer services', size: 'hero_full' },
  'images/pages/admin-activity-hero.jpg':            { q: 'dashboard analytics activity professional', size: 'hero_full' },
  'images/pages/admin-affiliates-new-hero.jpg':      { q: 'affiliate partner network business', size: 'hero_full' },
  'images/pages/admin-ai-console-hero.jpg':          { q: 'artificial intelligence console technology', size: 'hero_full' },
  'images/pages/admin-ai-studio-hero.jpg':           { q: 'creative technology workspace studio', size: 'hero_full' },
  'images/pages/admin-ai-tutor-logs-hero.jpg':       { q: 'education technology data logs', size: 'hero_full' },
  'images/pages/admin-analytics-engagement-hero.jpg':{ q: 'analytics engagement data visualization', size: 'hero_full' },
  'images/pages/admin-analytics.jpg':                { q: 'business analytics charts data', size: 'hero_full' },
  'images/pages/admin-campaigns-new-hero.jpg':       { q: 'marketing campaign email professional', size: 'hero_full' },
  'images/pages/admin-compliance-hero.jpg':          { q: 'compliance audit professional documents', size: 'hero_full' },
  'images/pages/admin-grants-workflow-detail.jpg':   { q: 'grant writing workflow nonprofit', size: 'hero_full' },
  'images/pages/admin-integrations-gc-detail.jpg':   { q: 'software integration api technology', size: 'hero_full' },
  'images/pages/admin-network-hero.jpg':             { q: 'network server technology professional', size: 'hero_full' },
  'images/pages/admin-payroll-cards-detail.jpg':     { q: 'payroll payment cards professional', size: 'hero_full' },
  'images/pages/admin-quiz-builder-detail.jpg':      { q: 'quiz assessment education professional', size: 'hero_full' },
  'images/pages/admin-syllabus-gen-hero.jpg':        { q: 'curriculum syllabus education planning', size: 'hero_full' },

  // Half-width / split layout
  'images/business/collaboration-1.jpg':             { q: 'business team collaboration meeting', size: 'hero_half' },
  'images/business/professional-2.jpg':              { q: 'professional businesswoman office confident', size: 'hero_half' },
  'images/business/team-3.jpg':                      { q: 'diverse business team office', size: 'hero_half' },
  'images/business/team-4.jpg':                      { q: 'professional team meeting conference', size: 'hero_half' },
  'images/business/office-admin.jpg':                { q: 'office administrator professional desk', size: 'hero_half' },
  'images/learners/barrier-support.jpg':             { q: 'social worker support counseling community', size: 'hero_half' },
  'images/learners/coaching-session.jpg':            { q: 'career coaching mentoring one on one', size: 'hero_half' },
  'images/pages/partner-page-14.jpg':                { q: 'employer partner workforce hiring', size: 'hero_half' },
  'images/pages/partners-pub-page-6.jpg':            { q: 'community organization partnership', size: 'hero_half' },

  // Cards
  'images/healthcare/healthcare-professional-portrait-1.jpg': { q: 'healthcare professional nurse clinic', size: 'card' },
  'images/courses/medical-assistant-10002419-cover.jpg':      { q: 'medical assistant clinic professional', size: 'card' },
  'images/programs/efh-building-tech-card.jpg':      { q: 'building technology maintenance technician', size: 'card' },
  'images/programs/efh-building-tech-hero.jpg':      { q: 'hvac technician building systems', size: 'card' },
  'images/programs/efh-business-startup-marketing-hero.jpg': { q: 'small business marketing entrepreneur', size: 'card' },
  'images/programs/efh-cna-hero.jpg':                { q: 'certified nursing assistant patient care', size: 'card' },
  'images/programs/efh-esthetician-client-services-card.jpg': { q: 'esthetician skincare beauty professional', size: 'card' },
  'images/pages/store-addons-hero.jpg':              { q: 'software features technology professional', size: 'card' },
  'images/pages/store-cart-hero.jpg':                { q: 'online shopping checkout professional', size: 'card' },
  'images/pages/store-compliance-hero.jpg':          { q: 'compliance regulation professional business', size: 'card' },
  'images/pages/store-compliance-wcag-hero.jpg':     { q: 'accessibility web technology inclusive', size: 'card' },
  'images/pages/store-compliance-wioa-hero.jpg':     { q: 'workforce training opportunity professional', size: 'card' },
  'images/pages/store-courses-hero.jpg':             { q: 'online courses catalog education', size: 'card' },
  'images/pages/store-guide-2.jpg':                  { q: 'user guide tutorial professional', size: 'card' },
  'images/pages/store-licensing-hero.jpg':           { q: 'professional licensing certification', size: 'card' },
  'images/pages/store-licensing-managed-hero.jpg':   { q: 'managed services licensing professional', size: 'card' },
  'images/pages/store-trial-detail.jpg':             { q: 'free trial software demo professional', size: 'card' },
  'images/pages/store-trial-hero.jpg':               { q: 'trial period software technology', size: 'card' },

  // Fixed 600x500
  'images/funding/funding-jri-program-v2.jpg':       { q: 'justice reentry workforce program community', size: 'fixed_600' },

  // Portraits
  'images/instructors/angela-thompson.jpg':          { q: 'professional black woman educator smiling', size: 'portrait' },
  'images/instructors/james-williams.jpg':           { q: 'professional black man educator smiling', size: 'portrait' },
  'images/instructors/lisa-martinez.jpg':            { q: 'professional latina woman educator smiling', size: 'portrait' },
  'images/instructors/marcus-johnson.jpg':           { q: 'professional black man teacher smiling', size: 'portrait' },
  'images/instructors/robert-davis.jpg':             { q: 'professional man teacher instructor smiling', size: 'portrait' },
  'images/team-new/team-1.jpg':                      { q: 'professional woman business portrait smiling', size: 'portrait' },
  'images/team-new/team-2.jpg':                      { q: 'professional man business portrait smiling', size: 'portrait' },
  'images/team-new/team-4.jpg':                      { q: 'professional person business portrait confident', size: 'portrait' },
  'images/team/instructors/instructor-barber.jpg':   { q: 'barber professional portrait smiling', size: 'portrait' },
  'images/team/instructors/instructor-business.jpg': { q: 'business instructor professional portrait', size: 'portrait' },
  'images/team/instructors/instructor-default.jpg':  { q: 'educator instructor professional portrait', size: 'portrait' },
  'images/team/instructors/instructor-health.jpg':   { q: 'health professional instructor portrait', size: 'portrait' },
  'images/team/instructors/instructor-medical.jpg':  { q: 'medical professional instructor portrait', size: 'portrait' },
  'images/team/instructors/instructor-recovery.jpg': { q: 'counselor recovery professional portrait', size: 'portrait' },
  'images/team/instructors/instructor-retail.jpg':   { q: 'retail professional instructor portrait', size: 'portrait' },
  'images/team/instructors/instructor-safety.jpg':   { q: 'safety professional instructor portrait', size: 'portrait' },
  'images/team/instructors/instructor-tax.jpg':      { q: 'tax professional accountant portrait', size: 'portrait' },
  'images/team/instructors/instructor-trades.jpg':   { q: 'trades technician professional portrait', size: 'portrait' },
  'images/testimonials-hq/person-1.jpg':             { q: 'professional woman smiling portrait confident', size: 'portrait' },
  'images/testimonials-hq/person-2.jpg':             { q: 'professional man smiling portrait confident', size: 'portrait' },
  'images/testimonials-hq/person-5.jpg':             { q: 'young professional woman portrait smiling', size: 'portrait' },
  'images/testimonials-hq/person-6.jpg':             { q: 'young professional man portrait smiling', size: 'portrait' },
  'images/testimonials-hq/person-7.jpg':             { q: 'professional person smiling portrait', size: 'portrait' },
  'images/testimonials-hq/person-8.jpg':             { q: 'professional woman confident portrait', size: 'portrait' },
  'images/testimonials/employer-1.jpg':              { q: 'employer business professional portrait', size: 'portrait' },
  'images/testimonials/employer-2.jpg':              { q: 'employer manager professional portrait', size: 'portrait' },
  'images/testimonials/employer-3.jpg':              { q: 'business owner professional portrait', size: 'portrait' },
  'images/testimonials/student-david.jpg':           { q: 'young man student graduate portrait smiling', size: 'portrait' },
  'images/testimonials/student-marcus.jpg':          { q: 'young black man student portrait smiling', size: 'portrait' },
  'images/testimonials/testimonial-medical-assistant.jpg': { q: 'medical assistant professional portrait smiling', size: 'portrait' },
  'images/avatars/student-1.jpg':                    { q: 'student young professional portrait smiling', size: 'portrait' },
  'images/alberta-davis.jpg':                        { q: 'professional woman portrait smiling confident', size: 'portrait' },
  'images/naomi-jordan.jpg':                         { q: 'professional black woman portrait smiling', size: 'portrait' },

  // Square small
  'images/milady-logo.jpg':                          { q: 'cosmetology beauty school professional', size: 'square_sm' },
};

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpsGet(res.headers.location, headers).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlink(dest, () => {});
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', err => { fs.unlink(dest, () => {}); reject(err); });
    }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
  });
}

const usedPerQuery = new Map();

async function fetchPhotoUrl(query, orientation, srcKey) {
  const page = Math.floor(Math.random() * 4) + 1;
  const apiUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=15&page=${page}&size=large`;
  const { status, body } = await httpsGet(apiUrl, { Authorization: API_KEY });
  if (status !== 200) throw new Error(`Pexels ${status}: ${body.toString().slice(0, 100)}`);
  const data = JSON.parse(body.toString());
  if (!data.photos?.length) throw new Error(`No results for "${query}"`);
  const used = usedPerQuery.get(query) || new Set();
  const available = data.photos.filter(p => !used.has(p.id));
  const photo = available.length ? available[0] : data.photos[0];
  used.add(photo.id);
  usedPerQuery.set(query, used);
  const src = photo.src;
  return src[srcKey] || src.large2x || src.large || src.medium || src.original;
}

async function main() {
  const entries = Object.entries(IMAGES);
  let downloaded = 0, skipped = 0, failed = 0;

  for (const [relPath, { q, size }] of entries) {
    const dest = path.join(PUBLIC, relPath);
    const cfg = SIZES[size];

    if (fs.existsSync(dest) && fs.statSync(dest).size > 50_000) {
      skipped++;
      continue;
    }

    try {
      const photoUrl = await fetchPhotoUrl(q, cfg.orientation, cfg.src);
      await downloadFile(photoUrl, dest);
      const kb = Math.round(fs.statSync(dest).size / 1024);
      console.log(`✓ [${++downloaded}/${entries.length}] ${relPath} (${cfg.w}x${cfg.h}, ${kb}KB)`);
    } catch (err) {
      console.error(`✗ ${relPath}: ${err.message}`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 350));
  }

  console.log(`\nDone: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed`);
}

main().catch(err => { console.error(err); process.exit(1); });
