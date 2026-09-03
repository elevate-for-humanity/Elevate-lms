/*
  Injects site navigation, a contact CTA, and an impact/equity info box into HTML pages.
  Idempotent via element IDs. Safe to run multiple times.
*/
const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const cheerio = require('cheerio');

const CONTACT_EMAIL =
  process.env.CONTACT_EMAIL || 'contact@elevateforhumanity.org';
const APPLY_URL = process.env.APPLY_URL || 'public/apply.html';
const CONTACT_URL = process.env.CONTACT_URL || 'connect.html#contact';

const NAV_LINKS = [
  { href: 'index.html', text: 'Home' },
  { href: 'hub.html', text: 'Hub' },
  { href: 'programs.html', text: 'Programs' },
  { href: 'pay.html', text: 'Enroll' },
  { href: 'connect.html', text: 'Contact' },
];

function ensureNav($) {
  if (
    $('#efh-nav-primary').length > 0 ||
    $('nav[role="navigation"]').length > 0
  )
    return;
  const nav = `
  <nav id="efh-nav-primary" role="navigation" aria-label="Primary" style="position:sticky;top:0;z-index:50;background:#0f172a;color:white;border-bottom:1px solid #1f2937">
    <div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;gap:16px;padding:10px 16px;">
      <a href="index.html" style="font-weight:700;color:#fff;text-decoration:none">Elevate for Humanity</a>
      <div style="display:flex;gap:12px;margin-left:auto;flex-wrap:wrap">
        ${NAV_LINKS.map((l) => `<a href="${l.href}" style="color:#cbd5e1;text-decoration:none">${l.text}</a>`).join('')}
      </div>
    </div>
  </nav>`;
  $('body').prepend(nav);
}

function ensureCTA($) {
  if ($('#efh-cta-section').length > 0) return;
  const html = `
  <section id="efh-cta-section" style="margin:40px auto;max-width:1100px;border:1px solid #e2e8f0;border-radius:12px;padding:24px;background:#f8fafc">
    <h2 style="margin:0 0 8px 0;font-size:22px;color:#0f172a">Get funded, career-aligned training</h2>
    <p style="margin:0 0 16px 0;color:#334155">WIOA-aligned programs with employer connections. Explore ETPL providers, DOL-aligned curricula, and placement pathways via JRI, WEX, and OJT.</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <a href="${APPLY_URL}" style="background:#4f46e5;color:white;padding:10px 14px;border-radius:8px;text-decoration:none">Apply now</a>
      <a href="${CONTACT_URL}" style="background:#0f172a;color:white;padding:10px 14px;border-radius:8px;text-decoration:none">Talk to a coach</a>
      <a href="mailto:${CONTACT_EMAIL}" style="color:#0f172a;padding:10px 14px;text-decoration:underline">Email us</a>
    </div>
  </section>`;
  $('body').append(html);
}

function ensureImpactBox($) {
  if ($('#efh-impact-box').length > 0) return;
  const html = `
  <aside id="efh-impact-box" aria-label="Equity & Impact" style="max-width:1100px;margin:0 auto 32px auto;background:#ecfeff;border:1px solid #06b6d4;border-radius:12px;padding:16px">
    <strong style="color:#0e7490">Equity & Impact:</strong>
    <ul style="margin:8px 0 0 18px;color:#0f172a">
      <li>Priority access for underrepresented learners</li>
      <li>ETPL-listed partners and DOL-aligned certifications</li>
      <li>Support for JRI participants and WEX/OJT placements</li>
    </ul>
  </aside>`;
  $('body').append(html);
}

function ensureInfoBox($) {
  if ($('#efh-info-box').length > 0) return;
  const html = `
  <section id="efh-info-box" style="max-width:1100px;margin:0 auto 32px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:16px">
    <h3 style="margin:0 0 8px 0;color:#0f172a">Funding & Programs</h3>
    <p style="margin:0;color:#334155">Eligible pathways include: <strong>ETPL</strong>, <strong>DOL</strong> credentials, <strong>JRI</strong> support, <strong>WEX</strong> experiences, and <strong>OJT</strong> placements.</p>
  </section>`;
  $('body').append(html);
}

function processFile(file) {
  try {
    const html = fs.readFileSync(file, 'utf8');
    const $ = cheerio.load(html, { decodeEntities: false });
    if ($('body').length === 0) return;

    ensureNav($);
    ensureCTA($);
    ensureImpactBox($);
    ensureInfoBox($);

    fs.writeFileSync(file, $.html());
      `✅ Engagement injected: ${path.relative(process.cwd(), file)}`
    );
  } catch (e) {
  }
}

(async function main() {
  const entries = await fg([
    '**/*.html',
    '!**/node_modules/**',
    '!**/server/**',
    '!**/app/assets/**',
    '!**/*verification*.html',
    '!**/protected-site.html',
  ]);
  entries.forEach(processFile);
})();
