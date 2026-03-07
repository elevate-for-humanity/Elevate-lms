// Server Component - NO 'use client'
// Government-grade footer - clean, senior, compliant

import Link from 'next/link';
import Image from 'next/image';

// GOVERNMENT-GRADE FOOTER STRUCTURE
// 4 columns: About, Programs, Compliance & Trust, Access
// Bottom bar: Legal links only
// Principle: If a first-time visitor or government reviewer wouldn't expect to see it, remove it

const footerLinks = {
  training: [
    { name: 'All Programs', href: '/programs' },
    { name: 'Skilled Trades', href: '/programs/hvac-technician' },
    { name: 'Healthcare', href: '/programs/cna' },
    { name: 'Technology', href: '/programs/it-help-desk' },
    { name: 'Business & Office', href: '/programs/bookkeeping' },
    { name: 'Apprenticeships', href: '/programs/barber-apprenticeship' },
    { name: 'Certifications', href: '/training/certifications' },
    { name: 'Testing & Exams', href: '/testing' },
    { name: 'Learning Center', href: '/training/learning-center' },
    { name: 'Educator Hub', href: '/educatorhub' },
    { name: 'Education Overview', href: '/education' },
    { name: 'Career Services', href: '/career-counseling' },
    { name: 'Platform Features', href: '/features' },
  ],
  funding: [
    { name: 'How Enrollment Works', href: '/how-it-works' },
    { name: 'WIOA Funding', href: '/funding/federal-programs' },
    { name: 'Workforce Ready Grant', href: '/funding/state-programs' },
    { name: 'Next Level Jobs', href: '/funding/state-programs' },
    { name: 'Funding Impact', href: '/fundingimpact' },
    { name: 'Tuition & Costs', href: '/tuition' },
    { name: 'Support Services', href: '/employment-support' },
  ],
  partners: [
    { name: 'Employer Partners', href: '/employer' },
    { name: 'Government & Agencies', href: '/government' },
    { name: 'Agencies', href: '/agencies' },
    { name: 'Workforce Boards', href: '/workforce-board' },
    { name: 'Partner Directory', href: '/directory' },
    { name: 'Become a Partner', href: '/partnerships' },
    { name: 'Platform Licensing', href: '/store/licenses' },
  ],
  portals: [
    { name: 'Student Portal', href: '/login' },
    { name: 'Get Started', href: '/getstarted' },
    { name: 'Start Now (Self-Service)', href: '/call-now' },
    { name: 'Learning Hub', href: '/learning' },
    { name: 'Employer Portal', href: '/employer' },
    { name: 'Partner Portal', href: '/partner-portal' },
    { name: 'Mobile App', href: '/mobile-app' },
    { name: 'App Hub', href: '/app-hub' },
    { name: 'Support', href: '/support' },
    { name: 'Services', href: '/services' },
    { name: 'FAQ', href: '/faq' },
  ],
  organization: [
    { name: 'About Elevate', href: '/about' },
    { name: 'Our Team', href: '/team' },
    { name: 'Our Mission', href: '/mission' },
    { name: 'Our Ecosystem', href: '/ecosystem' },
    { name: 'Governance', href: '/institutional-governance' },
    { name: 'Compliance', href: '/compliance' },
    { name: 'Transparency', href: '/transparency' },
    { name: 'Donate', href: '/donations' },
    { name: 'Consumer Education', href: '/consumer-education' },
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Terms of Service', href: '/terms-of-service' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Security & Data', href: '/security-and-data-protection' },
    { name: 'Accessibility', href: '/accessibility' },
    { name: 'Security', href: '/governance/security' },
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
            <Image src="/logo.png" alt="Elevate for Humanity" width={32} height={32} className="w-8 h-8" />
            <span className="text-lg font-bold text-white">Elevate for Humanity</span>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
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

        {/* 5-Column Footer */}
        <nav aria-label="Footer navigation" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {/* Column 1: Training Programs */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Training Programs</h3>
            <ul className="space-y-3">
              {footerLinks.training.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Funding & Enrollment */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Funding & Enrollment</h3>
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

          {/* Column 3: Employers & Partners */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Employers & Partners</h3>
            <ul className="space-y-3">
              {footerLinks.partners.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 leading-relaxed">
                Employers and workforce agencies interested in hiring credentialed graduates or partnering on training programs can{' '}
                <Link href="/partnerships" className="text-brand-blue-400 hover:text-brand-blue-300 underline">connect with our workforce team</Link>.
              </p>
            </div>
          </div>

          {/* Column 4: Portals & Access */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Portals & Access</h3>
            <ul className="space-y-3">
              {footerLinks.portals.map((link) => (
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
          <p className="text-sm text-slate-400 mb-4">Ready to start your career? Explore funded training programs.</p>
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
                height={28}
                className="w-7 h-7"
              />
              <p className="text-slate-400 text-sm">
                © {new Date().getFullYear()} 2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Training Institute.
              </p>
            </div>
            
            {/* Contact */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 text-sm mb-4">
              <a href="tel:+13173143757" className="hover:text-white">(317) 314-3757</a>
              <span className="text-slate-700">|</span>
              <a href="mailto:info@elevateforhumanity.org" className="hover:text-white">info@elevateforhumanity.org</a>
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
                Elevate for Humanity Career & Training Institute is a workforce training provider operating under 2Exclusive LLC-S. Programs are not institutionally accredited degree programs. Certification outcomes are issued by the respective certifying organizations upon successful completion of required examinations. Elevate for Humanity Career & Training Institute provides training, preparation, and authorized proctored testing access but does not independently issue federal or state licenses. Financial aid through federal student aid (FAFSA, Pell Grants, and federal loans) is not currently offered. Training may be fully funded for eligible participants through workforce programs such as WIOA, JRI, and approved funding partners. Eligibility and funding determinations are subject to program and agency guidelines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
