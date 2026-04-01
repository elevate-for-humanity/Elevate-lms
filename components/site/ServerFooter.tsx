// Server Component - NO 'use client'
// Government-grade footer - clean, senior, compliant

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

// GOVERNMENT-GRADE FOOTER STRUCTURE
// 4 columns: About, Programs, Compliance & Trust, Access
// Bottom bar: Legal links only
// Principle: If a first-time visitor or government reviewer wouldn't expect to see it, remove it

const footerLinks = {
  programs: [
    { name: 'All Programs', href: '/programs' },
    { name: 'Healthcare', href: '/programs/cna' },
    { name: 'Skilled Trades', href: '/programs/hvac-technician' },
    { name: 'Technology', href: '/programs/it-help-desk' },
    { name: 'Business & Finance', href: '/programs/bookkeeping' },
    { name: 'Apprenticeships', href: '/programs/barber-apprenticeship' },
    { name: 'Certifications', href: '/training/certifications' },
    { name: 'Testing & Exams', href: '/testing' },
    { name: 'Micro-Classes', href: '/micro-classes' },
    { name: 'Academic Calendar', href: '/academic-calendar' },
    { name: 'Credentials', href: '/credentials' },
  ],
  students: [
    { name: 'Apply Now', href: '/apply/student' },
    { name: 'Check Eligibility', href: '/eligibility/quiz' },
    { name: 'Enrollment', href: '/enrollment' },
    { name: 'Tuition & Fees', href: '/tuition' },
    { name: 'Scholarships', href: '/scholarships' },
    { name: 'Student Portal', href: '/learner' },
    { name: 'Career Counseling', href: '/career-counseling' },
    { name: 'Orientation', href: '/orientation' },
    { name: 'Transcript', href: '/transcript' },
    { name: 'Parent Portal', href: '/parent-portal' },
    { name: 'Consumer Education', href: '/consumer-education' },
  ],
  funding: [
    { name: 'Funding Overview', href: '/funding' },
    { name: 'How Funding Works', href: '/funding/how-it-works' },
    { name: 'WIOA — Low Income', href: '/wioa-eligibility/low-income' },
    { name: 'WIOA — Veterans', href: '/wioa-eligibility/veterans' },
    { name: 'Workforce Ready Grant', href: '/funding/wrg' },
    { name: 'JRI Funding', href: '/funding/jri' },
    { name: 'Job Ready Indy', href: '/funding/job-ready-indy' },
    { name: 'DOL Apprenticeship', href: '/funding/dol' },
    { name: 'Donate', href: '/donate' },
    { name: 'Philanthropy', href: '/philanthropy' },
  ],
  partners: [
    { name: 'Workforce Partners', href: '/workforce-partners' },
    { name: 'Government', href: '/government' },
    { name: 'Agencies', href: '/agencies' },
    { name: 'Industries', href: '/industries' },
    { name: 'Training Providers', href: '/training-providers' },
    { name: 'Solutions', href: '/solutions' },
    { name: 'Partner Directory', href: '/directory' },
    { name: 'Become a Partner', href: '/partnerships' },
    { name: 'Platform Licensing', href: '/store/licensing' },
  ],
  organization: [
    { name: 'About Elevate', href: '/about' },
    { name: 'Our Mission', href: '/about/mission' },
    { name: 'Our Team', href: '/team' },
    { name: 'Founder', href: '/founder' },
    { name: 'Accreditation', href: '/accreditation' },
    { name: 'Governance', href: '/governance' },
    { name: 'Compliance', href: '/compliance' },
    { name: 'Transparency', href: '/transparency' },
    { name: 'Tax Services', href: 'https://www.supersonicfastermoney.com' },
    { name: 'Resources', href: '/resources' },
    { name: 'Contact', href: '/contact' },
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
            <Image src="/logo.png" alt="Elevate for Humanity" width={32} height={48} className="w-auto h-8" />
            <span className="text-lg font-bold text-white">Elevate for Humanity</span>
          </div>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            National workforce training platform connecting online technical instruction, industry credentials, and employer pathways. Programs aligned with EPA, CompTIA, PTCB, Microsoft, and OSHA certifications.
          </p>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
            <span>DOL Registered Apprenticeship Sponsor</span>
            <span className="text-slate-700">·</span>
            <span>ETPL Listed Training Provider</span>
            <span className="text-slate-700">·</span>
            <span>WIOA Title I Approved</span>
            <span className="text-slate-700">·</span>
            <span>WorkOne Workforce Partner</span>
          </div>
        </div>

        {/* 5-Column Footer — matches 9-door nav architecture */}
        <nav aria-label="Footer navigation" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {/* Column 1: Programs */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Programs</h3>
            <ul className="space-y-3">
              {footerLinks.programs.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Students */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Students</h3>
            <ul className="space-y-3">
              {footerLinks.students.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Funding */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Funding</h3>
            <ul className="space-y-3">
              {footerLinks.funding.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Partners */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Partners</h3>
            <ul className="space-y-3">
              {footerLinks.partners.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Organization */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Organization</h3>
            <ul className="space-y-3">
              {footerLinks.organization.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Footer CTA */}
        <div className="border-t border-slate-800 pt-8 pb-8 mb-8 text-center">
          <p className="text-sm text-slate-500 mb-4">Ready to start your career? Explore funded training programs.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors">
              Apply for Training
            </Link>
            <Link href="/partnerships" className="border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors">
              Partner With Us
            </Link>
          </div>
        </div>

        {/* Credential Alignment */}
        <div className="border-t border-slate-800 pt-6 pb-6 mb-6 text-center">
          <p className="text-[10px] text-slate-500 max-w-3xl mx-auto leading-relaxed">
            Programs aligned with industry-recognized certifications including EPA Section 608, CompTIA A+, CompTIA Security+, PTCB CPhT, Microsoft Office Specialist, OSHA 30, and Indiana state licensing requirements. Credential outcomes are issued by the respective certifying organizations.
          </p>
        </div>

        {/* Bottom Bar: Legal Links + Copyright */}
        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo and Copyright */}
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Elevate"
                width={28}
                height={42}
                className="w-auto h-7"
              />
              <p className="text-slate-500 text-sm">
                © {new Date().getFullYear()} 2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Technical Institute.
              </p>
            </div>
            
            {/* Contact */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 text-sm mb-4">
              <a href="tel:+13173143757" className="hover:text-white">(317) 314-3757</a>
              <span className="text-slate-700">|</span>
              <a href="mailto:info@elevateforhumanity.org" className="hover:text-white">info@elevateforhumanity.org</a>
            </div>

            {/* Social Icons */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <a href="https://www.facebook.com/elevateforhumanity" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-slate-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/elevateforhumanity" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-slate-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/company/elevate-for-humanity" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-slate-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@elevateforhumanity" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-slate-400 hover:text-white transition-colors">
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
                <span key={b.abbr} className="inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
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
                  className="text-slate-400 hover:text-white"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Legal Disclaimer */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-[10px] leading-relaxed text-slate-500 max-w-4xl mx-auto text-center">
                Elevate for Humanity Career &amp; Technical Institute is a workforce training provider operating under 2Exclusive LLC-S. Programs are industry-aligned and designed to lead to employment outcomes. Certifications are issued by the respective certifying organizations upon successful completion of required examinations. Training may be fully funded for eligible participants through workforce programs such as WIOA, JRI, and approved funding partners. Eligibility and funding determinations are subject to program and agency guidelines. Elevate for Humanity Career &amp; Technical Institute is not currently approved as a postsecondary institution through the Indiana Department of Education.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
