// Server Component - NO 'use client'
// Government-grade footer - clean, senior, compliant

import Link from 'next/link';
import Image from 'next/image';

// GOVERNMENT-GRADE FOOTER STRUCTURE
// 4 columns: About, Programs, Compliance & Trust, Access
// Bottom bar: Legal links only
// Principle: If a first-time visitor or government reviewer wouldn't expect to see it, remove it

const footerLinks = {
  about: [
    { name: 'About Elevate', href: '/about' },
    { name: 'Our Mission', href: '/mission' },
    { name: 'Our Team', href: '/team' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Indiana Outcomes', href: '/outcomes/indiana' },
    { name: 'Impact', href: '/impact' },
    { name: 'Press', href: '/press' },
    { name: 'Contact', href: '/contact' },
  ],
  programs: [
    { name: 'Training Programs', href: '/programs' },
    { name: 'Certifications', href: '/training/certifications' },
    { name: 'Career Pathways', href: '/how-it-works' },
    { name: 'Apprenticeships', href: '/programs/barber-apprenticeship' },
    { name: 'Career Services', href: '/career-counseling' },
    { name: 'Employer Partnerships', href: '/employer' },
    { name: 'Partner Directory', href: '/directory' },
  ],
  platform: [
    { name: 'Platform Overview', href: '/store' },
    { name: 'Licensing', href: '/store/licenses' },
    { name: 'Managed Platform', href: '/store/licenses/managed-platform' },
    { name: 'Enterprise Access', href: '/store/licenses/enterprise-license' },
    { name: 'Demos', href: '/store/demo' },
    { name: 'Add-Ons', href: '/store/add-ons' },
  ],
  compliance: [
    { name: 'Institutional Governance', href: '/institutional-governance' },
    { name: 'Verification & Approvals', href: '/verification-approvals' },
    { name: 'Compliance & Security', href: '/compliance' },
    { name: 'Data Privacy', href: '/governance/data' },
    { name: 'Accessibility', href: '/accessibility' },
    { name: 'Transparency', href: '/transparency' },
    { name: 'Verify Credentials', href: '/verify' },
  ],
  access: [
    { name: 'Student Portal', href: '/login' },
    { name: 'Program Holder Portal', href: '/program-holder' },
    { name: 'Partner Portal', href: '/partner-portal' },
    { name: 'Partner Barbershop', href: '/partners/barber-shop' },
    { name: 'Partnerships', href: '/partnerships' },
    { name: 'Support', href: '/support' },
    { name: 'FAQ', href: '/faq' },
  ],
  legal: [
    { name: 'Terms of Service', href: '/terms-of-service' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Security', href: '/governance/security' },
    { name: 'Licensing', href: '/store/licenses' },
  ],
};

export default function ServerFooter() {
  return (
    <footer className="bg-slate-900 text-white" role="contentinfo" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 5-Column Footer */}
        <nav aria-label="Footer navigation" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {/* Column 1: About */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">About</h3>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Programs */}
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

          {/* Column 3: Platform */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Platform</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Compliance & Trust */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Compliance & Trust</h3>
            <ul className="space-y-3">
              {footerLinks.compliance.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Access */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Access</h3>
            <ul className="space-y-3">
              {footerLinks.access.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

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
              <p className="text-slate-500 text-xs mt-1">
                Registered Apprenticeship Sponsor | Workforce Training Provider | Career &amp; Technical Instructional Institution
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
