// Server Component - NO 'use client'
// Government-grade footer - clean, senior, compliant

import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/components/ui/Logo';
import LogoImage from '@/components/site/LogoImage';
import Copyright from '@/components/ui/Copyright';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { SOCIAL_LINKS } from '@/config/social-links';
import FooterAccordion from '@/components/site/FooterAccordion.client';
import { canonicalRoutes } from '@/lib/routes/canonical-routes';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { formatHeadquartersLine } from '@/lib/org-locations';
import { RAPIDS_SPONSOR_LABEL } from '@/lib/workforce-ids';

// FOOTER STRUCTURE — 5 columns
// Col 1: Programs
// Col 2: Funding & Eligibility
// Col 3: Partners & Employers
// Col 4: About
// Col 5: Platform / Apply / Contact
// Bottom: Legal
//
// No portal/dashboard/LMS/admin links in the footer.
// Footer links: static config (intentional). Footer changes require a deploy regardless.

const footerLinks = {
  // Column 1 — Programs by area
  programs: [
    { name: 'All Programs', href: '/programs' },
    { name: 'HVAC Technician', href: canonicalRoutes.programs.hvacTechnician },
    { name: 'Certified Nursing Assistant (CNA)', href: canonicalRoutes.programs.certifiedNursingAssistant },
    { name: 'Medical Assistant', href: '/programs/medical-assistant' },
    { name: 'Phlebotomy', href: '/programs/phlebotomy' },
    { name: 'IT Help Desk', href: '/programs/it-help-desk' },
    { name: 'Cybersecurity Analyst', href: '/programs/cybersecurity-analyst' },
    { name: 'Welding', href: '/programs/welding' },
    { name: 'Electrical', href: '/programs/electrical' },
    { name: 'Plumbing', href: '/programs/plumbing' },
    { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
    { name: 'Bookkeeping & Accounting', href: '/programs/finance-bookkeeping-accounting' },
    { name: 'Peer Recovery Specialist', href: '/programs/peer-recovery-specialist' },
    { name: 'CPR & First Aid', href: '/programs/cpr-first-aid' },
  ],

  // Column 2 — Funding & Eligibility
  funding: [
    { name: 'Funding Overview', href: '/funding' },
    { name: 'Check My Eligibility', href: '/check-eligibility' },
    { name: 'WIOA / WorkOne', href: '/funding/wioa' },
    { name: 'Workforce Ready Grant', href: '/funding/wrg' },
    { name: 'SNAP E&T Partner', href: '/snap-et-partner' },
    { name: 'Federal Programs', href: '/funding/federal-programs' },
    { name: 'Consumer Education', href: '/consumer-education' },
    { name: 'Tuition & Fees', href: '/tuition-fees' },
  ],

  // Column 3 — Partners & Employers
  partners: [
    { name: 'Partner Overview', href: '/partners' },
    { name: 'Hire Our Graduates', href: '/for-employers' },
    { name: 'Workforce Agencies', href: '/for-agencies' },
    { name: 'Workforce Partners', href: '/partners/workforce' },
    { name: 'Reentry Organizations', href: '/partners/reentry' },
    { name: 'Job Ready Indy', href: '/partners/jri' },
    { name: 'Barbershop Partners', href: '/partners/barber-host-shop' },
    { name: 'Program Holders', href: '/program-holder' },
    { name: 'LMS Licensing', href: '/partners/sales' },
    { name: 'Technology Partners', href: '/partners/technology' },
    { name: 'Become a Partner', href: '/partners/apply' },
  ],

  // Column 4 — About
  about: [
    { name: 'About Elevate', href: '/about' },
    { name: 'Organization', href: '/about/organization' },
    { name: 'Compliance Center', href: '/compliance/center' },
    { name: 'Our Team', href: '/about/team' },
    { name: 'Outcomes', href: '/impact' },
    { name: 'Impact', href: '/impact' },
    { name: 'Success Stories', href: '/success-stories' },
    { name: 'Accreditation', href: '/accreditation' },
    { name: 'Events', href: '/events' },
    { name: 'Donate', href: '/donate' },
    { name: 'Philanthropy', href: '/philanthropy' },
    { name: 'Careers', href: '/careers' },
    { name: 'Contact Us', href: '/contact' },
  ],

  // Column 5 — Platform / Apply
  platform: [
    { name: 'Platform Overview', href: '/platform' },
    { name: 'Apply for Training', href: '/apply' },
    { name: 'Quick Application', href: '/apply/quick' },
    { name: 'Microclasses', href: '/microclasses' },
    { name: 'Videos', href: '/video' },
    { name: 'Downloads & Resources', href: '/downloads' },
    { name: 'Metrics & Outcomes', href: '/metrics' },
    { name: 'Credential Verification', href: '/verify-credentials' },
    { name: 'Site Map', href: '/site-map' },
  ],

  legal: [
    { name: 'Terms of Service', href: '/legal' },
    { name: 'Privacy Policy', href: '/legal/privacy' },
    { name: 'Policies', href: '/policies/terms' },
    { name: 'Security & Data', href: '/security-and-data-protection' },
    { name: 'Accessibility', href: '/accessibility' },
    { name: 'Site Map', href: '/site-map' },
  ],
};

export default function ServerFooter() {
  return (
    <footer className="bg-slate-900 text-white" role="contentinfo" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Institutional Identity */}
        <div className="mb-10 pb-8 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <Logo alt={PLATFORM_DEFAULTS.orgName} width={32} height={48} className="w-auto h-8" />
            <span className="text-lg font-bold text-white">{PLATFORM_DEFAULTS.orgName}</span>
          </div>
          <p className="text-sm text-white max-w-2xl leading-relaxed">
            {PLATFORM_DEFAULTS.orgName} is an AI-powered workforce operating system — not just a training
            provider. We handle credentialing, compliance tracking, employer placement,
            apprenticeship coordination, and funding documentation so agencies and participants can
            focus on outcomes.
          </p>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-white">
            <span>DOL Registered Apprenticeship Sponsor</span>
            <span className="text-white">·</span>
            <span>{RAPIDS_SPONSOR_LABEL}</span>
            <span className="text-white">·</span>
            <span>ETPL Listed Training Provider</span>
            <span className="text-white">·</span>
            <span>WIOA Title I Approved</span>
            <span className="text-white">·</span>
            <span>WorkOne Workforce Partner</span>
          </div>
          <p className="mt-3 text-xs text-slate-400 max-w-2xl">
            HQ: {formatHeadquartersLine()} — administrative and enrollment support. Hands-on training
            occurs at approved Indianapolis instructional sites by program.
          </p>
        </div>

        {/* Footer Accordion — all screen sizes */}
        <FooterAccordion
          sections={[
            { title: 'Programs', links: footerLinks.programs },
            { title: 'Funding', links: footerLinks.funding },
            { title: 'Employers & Partners', links: footerLinks.partners },
            { title: 'About', links: footerLinks.about },
            { title: 'Platform', links: footerLinks.platform },
          ]}
        />

        {/* Footer CTA */}
        <div className="border-t border-slate-800 pt-8 pb-8 mb-8 text-center">
          <p className="text-sm text-white mb-4">
            Ready to start your career? Explore funded training programs.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/apply"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
            >
              Apply for Training
            </Link>
            <Link
              href="/partners"
              className="border border-slate-600 text-white hover:text-white hover:border-slate-400 font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
            >
              Partner With Us
            </Link>
          </div>
        </div>

        {/* Credential Alignment */}
        <div className="border-t border-slate-800 pt-6 pb-6 mb-6 text-center">
          <p className="text-[10px] text-white max-w-3xl mx-auto leading-relaxed">
            Programs aligned with industry-recognized certifications including EPA Section 608,
            CompTIA A+, CompTIA Security+, PTCB CPhT, Microsoft Office Specialist, OSHA 30, and
            Indiana state licensing requirements. Credential outcomes are issued by the respective
            certifying organizations.
          </p>
        </div>

        {/* Operational disclosure */}
        <div className="border-t border-slate-800 pt-6 pb-4">
          <p className="text-slate-500 text-xs text-center max-w-3xl mx-auto leading-relaxed">
            {PLATFORM_DEFAULTS.orgName} operates as a workforce development system coordinating training,
            funding, testing, and employment pathways. Program delivery may be conducted directly
            by Elevate or through approved training providers depending on the program.
          </p>
        </div>

        {/* Bottom Bar: Legal Links + Copyright */}
        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo and Copyright */}
            <div className="flex items-center gap-3">
              <LogoImage alt="Elevate" width={28} height={42} className="w-auto h-7" />
              <p className="text-white text-sm">
                <Copyright
                  entity={`2Exclusive LLC-S d/b/a ${PLATFORM_DEFAULTS.orgName} Career & Technical Institute`}
                />
              </p>
            </div>

            {/* Contact */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-white text-sm mb-4">
              <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="hover:text-white">
                {PLATFORM_DEFAULTS.supportPhone}
              </a>
              <span className="text-white">|</span>
              <a href="mailto:info@elevateforhumanity.org" className="hover:text-white">
                info@elevateforhumanity.org
              </a>
            </div>

            {/* Social Icons */}
            <div className="flex items-center justify-center gap-4 mb-4">
              {SOCIAL_LINKS.facebook && (
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="text-white hover:text-white transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {SOCIAL_LINKS.instagram && (
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-white hover:text-white transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {SOCIAL_LINKS.linkedin && (
                <a
                  href={SOCIAL_LINKS.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="text-white hover:text-white transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {SOCIAL_LINKS.youtube && (
                <a
                  href={SOCIAL_LINKS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="text-white hover:text-white transition-colors"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              )}
            </div>

            {/* Authority Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              {[
                { abbr: 'USDOL', label: 'DOL Registered Sponsor' },
                { abbr: 'ETPL', label: 'Approved Training Provider' },
                { abbr: 'Certiport', label: 'Authorized Testing Center' },
                { abbr: 'EPA 608', label: 'Certification Prep' },
                { abbr: 'OSHA', label: 'Safety Training' },
              ].map((b) => (
                <span
                  key={b.abbr}
                  className="inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-white border border-slate-700"
                >
                  {b.abbr}
                </span>
              ))}
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {footerLinks.legal.map((link) => (
                <Link key={link.name} href={link.href} className="text-white hover:text-white">
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Legal Disclaimer */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-[10px] leading-relaxed text-slate-500 max-w-4xl mx-auto text-center">
                {PLATFORM_DEFAULTS.orgName} Career &amp; Technical Institute is a DOL Registered
                Apprenticeship Sponsor, Indiana ETPL-listed workforce training provider, and
                Certiport Authorized Testing Center operating under 2Exclusive LLC-S. Industry
                certifications are issued by the respective credentialing bodies (CompTIA, NHA, EPA,
                NCCCO, etc.) upon passing the required exams — these are the same credentials
                employers hire for. Training may be fully funded for eligible participants through
                WIOA, Workforce Ready Grant, JRI, and approved workforce partners; eligibility is
                determined by the applicable agency. {PLATFORM_DEFAULTS.orgName} Career &amp; Technical
                Institute is a workforce training organization, not a degree-granting postsecondary
                institution under the Indiana Department of Education — our programs lead to
                industry certifications and employment, not academic degrees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
