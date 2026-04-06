// Server Component - NO 'use client'
// Government-grade footer - clean, senior, compliant

import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/components/ui/Logo';
import LogoImage from '@/components/site/LogoImage';
import Copyright from '@/components/ui/Copyright';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

// GOVERNMENT-GRADE FOOTER STRUCTURE
// 4 columns: About, Programs, Compliance & Trust, Access
// Bottom bar: Legal links only
// Principle: If a first-time visitor or government reviewer wouldn't expect to see it, remove it

const footerLinks = {
  // Column 1 — Training areas + credentials + testing
  programs: [
    { name: 'All Programs', href: '/programs' },
    { name: 'Healthcare', href: '/programs/healthcare' },
    { name: 'Skilled Trades', href: '/programs/skilled-trades' },
    { name: 'HVAC Technician', href: '/programs/hvac-technician' },
    { name: 'Technology', href: '/programs/it-help-desk' },
    { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
    { name: 'Business & Finance', href: '/programs/finance-bookkeeping-accounting' },
    { name: 'Peer Recovery', href: '/programs/peer-recovery-specialist' },
    { name: 'Certifications', href: '/training/certifications' },
    { name: 'Testing & Exams', href: '/testing' },
    { name: 'Credential Verification', href: '/verify-credentials' },
  ],
  // Column 2 — Student path: apply → fund → enroll → portal
  getStarted: [
    { name: 'Check My Eligibility', href: '/start' },
    { name: 'Apply for Training', href: '/apply/student' },
    { name: 'How Funding Works', href: '/funding/how-it-works' },
    { name: 'WIOA Funding', href: '/wioa-eligibility' },
    { name: 'Workforce Ready Grant', href: '/funding/wrg' },
    { name: 'JRI / Job Ready Indy', href: '/funding/jri' },
    { name: 'DOL Apprenticeship', href: '/funding/dol' },
    { name: 'Tuition & Fees', href: '/tuition' },
    { name: 'Student Portal', href: '/learner' },
    { name: 'Schedule Orientation', href: '/orientation' },
    { name: 'Consumer Education', href: '/consumer-education' },
  ],
  // Column 3 — Employers and all partner types
  partners: [
    { name: 'Hire Our Graduates', href: '/for-employers' },
    { name: 'OJT Partnerships', href: '/partnerships' },
    { name: 'Post a Job', href: '/employer/post-job' },
    { name: 'Employer Portal', href: '/employer/dashboard' },
    { name: 'Workforce Agencies', href: '/partners/workforce' },
    { name: 'Barbershop Partners', href: '/partners/barbershop-apprenticeship' },
    { name: 'Training Providers', href: '/partners/training-provider' },
    { name: 'Reentry Organizations', href: '/partners/reentry' },
    { name: 'Program Holders', href: '/program-holder' },
    { name: 'Become a Partner', href: '/partners/join' },
  ],
  // Column 4 — Organization, platform, compliance, contact
  organization: [
    { name: 'About Elevate', href: '/about' },
    { name: 'Our Team', href: '/about/team' },
    { name: 'Outcomes', href: '/outcomes/indiana' },
    { name: 'Accreditation', href: '/accreditation' },
    { name: 'Compliance', href: '/compliance' },
    { name: 'Platform Licensing', href: '/store/licensing' },
    { name: 'Rise Foundation', href: '/rise-foundation' },
    { name: 'Donate', href: '/donate' },
    { name: 'Careers', href: '/careers' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Site Map', href: '/site-map' },
  ],
  legal: [
    { name: 'Terms of Service', href: '/terms-of-service' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
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
            <Logo alt="Elevate for Humanity" width={32} height={48} className="w-auto h-8" />
            <span className="text-lg font-bold text-white">Elevate for Humanity</span>
          </div>
          <p className="text-sm text-white max-w-2xl leading-relaxed">
            National workforce training platform connecting online technical instruction, industry credentials, and employer pathways. Programs aligned with EPA, CompTIA, PTCB, Microsoft, and OSHA certifications.
          </p>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-white">
            <span>DOL Registered Apprenticeship Sponsor</span>
            <span className="text-white">·</span>
            <span>ETPL Listed Training Provider</span>
            <span className="text-white">·</span>
            <span>WIOA Title I Approved</span>
            <span className="text-white">·</span>
            <span>WorkOne Workforce Partner</span>
          </div>
        </div>

        {/* 4-Column Footer — mirrors nav hierarchy */}
        <nav aria-label="Footer navigation" className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Programs */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Programs</h3>
            <ul className="space-y-3">
              {footerLinks.programs.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Get Started */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Get Started</h3>
            <ul className="space-y-3">
              {footerLinks.getStarted.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Employers & Partners */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Employers & Partners</h3>
            <ul className="space-y-3">
              {footerLinks.partners.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Organization */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Organization</h3>
            <ul className="space-y-3">
              {footerLinks.organization.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Footer CTA */}
        <div className="border-t border-slate-800 pt-8 pb-8 mb-8 text-center">
          <p className="text-sm text-white mb-4">Ready to start your career? Explore funded training programs.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors">
              Apply for Training
            </Link>
            <Link href="/partnerships" className="border border-slate-600 text-white hover:text-white hover:border-slate-400 font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors">
              Partner With Us
            </Link>
          </div>
        </div>

        {/* Credential Alignment */}
        <div className="border-t border-slate-800 pt-6 pb-6 mb-6 text-center">
          <p className="text-[10px] text-white max-w-3xl mx-auto leading-relaxed">
            Programs aligned with industry-recognized certifications including EPA Section 608, CompTIA A+, CompTIA Security+, PTCB CPhT, Microsoft Office Specialist, OSHA 30, and Indiana state licensing requirements. Credential outcomes are issued by the respective certifying organizations.
          </p>
        </div>

        {/* Bottom Bar: Legal Links + Copyright */}
        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo and Copyright */}
            <div className="flex items-center gap-3">
              <LogoImage
                alt="Elevate"
                width={28}
                height={42}
                className="w-auto h-7"
              />
              <p className="text-white text-sm">
                <Copyright entity="2Exclusive LLC-S d/b/a Elevate for Humanity Career & Technical Institute" />
              </p>
            </div>
            
            {/* Contact */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-white text-sm mb-4">
              <a href="tel:+13173143757" className="hover:text-white">(317) 314-3757</a>
              <span className="text-white">|</span>
              <a href="mailto:info@elevateforhumanity.org" className="hover:text-white">info@elevateforhumanity.org</a>
            </div>

            {/* Social Icons */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <a href="https://www.facebook.com/elevateforhumanity" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/elevateforhumanity" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/company/elevate-for-humanity" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-white hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@elevateforhumanity" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-white hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
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
                <span key={b.abbr} className="inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-white border border-slate-700">
                  {b.abbr}
                </span>
              ))}
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {footerLinks.legal.map((link) => (
                <Link 
                  key={link.name}
                  href={link.href} 
                  className="text-white hover:text-white"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Legal Disclaimer */}
            <div className="mt-6 pt-6 border-t border-slate-800">
<p className="text-[10px] leading-relaxed text-slate-500 max-w-4xl mx-auto text-center">
                Elevate for Humanity Career &amp; Technical Institute is a DOL Registered Apprenticeship Sponsor, Indiana ETPL-listed workforce training provider, and Certiport Authorized Testing Center operating under 2Exclusive LLC-S. Industry certifications are issued by the respective credentialing bodies (CompTIA, NHA, EPA, NCCCO, etc.) upon passing the required exams — these are the same credentials employers hire for. Training may be fully funded for eligible participants through WIOA, Workforce Ready Grant, JRI, and approved workforce partners; eligibility is determined by the applicable agency. Elevate for Humanity Career &amp; Technical Institute is a workforce training organization, not a degree-granting postsecondary institution under the Indiana Department of Education — our programs lead to industry certifications and employment, not academic degrees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
