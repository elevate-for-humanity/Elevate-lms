
import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  // GOVERNMENT-GRADE FOOTER - Clean, senior, compliant
  const footerLinks = {
    about: [
      { name: 'About Elevate', href: '/about' },
      { name: 'Workforce Operating System', href: '/store/licenses' },
      { name: 'Indiana Outcomes', href: '/outcomes/indiana' },
      { name: 'Contact', href: '/contact' },
    ],
    programs: [
      { name: 'Training Programs', href: '/programs' },
      { name: 'Career Pathways', href: '/how-it-works' },
      { name: 'Apprenticeships', href: '/programs/barber-apprenticeship' },
      { name: 'Employer Partnerships', href: '/employer' },
    ],
    compliance: [
      { name: 'Governance', href: '/governance' },
      { name: 'Data Privacy', href: '/governance/data' },
      { name: 'Accessibility', href: '/accessibility' },
      { name: 'AI Governance', href: '/governance/ai' },
    ],
    access: [
      { name: 'Student Portal', href: '/login' },
      { name: 'Partner Portal', href: '/partner/login' },
      { name: 'Support', href: '/support' },
    ],
    legal: [
      { name: 'Terms of Service', href: '/terms-of-service' },
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Security', href: '/governance/security' },
      { name: 'Licensing', href: '/store/licenses' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61571046346179' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/elevateforhumanity' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/in/elevate-for-humanity-b5a2b3339/' },
    { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/@elevateforhumanity' },
  ];

  return (
    <footer className="bg-slate-900 text-slate-100" role="contentinfo" aria-label="Site footer">
      {/* Newsletter Section */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="lg:max-w-xl">
              <h3 className="text-2xl font-bold text-white mb-2">
                Stay Connected
              </h3>
              <p className="text-slate-200 font-medium">
                Get updates on new programs, success stories, and career opportunities.
              </p>
            </div>
            <div className="mt-6 lg:mt-0 lg:ml-8">
              <form className="sm:flex sm:max-w-md">
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  type="email"
                  name="email-address"
                  id="email-address"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800 text-white Content-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
                <button
                  type="submit"
                  className="mt-3 sm:mt-0 sm:ml-3 w-full sm:w-auto px-6 py-3    text-white font-medium rounded-lg hover: hover: transition-all whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content - Government-grade 4 columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h4 className="text-white font-semibold mb-4">About</h4>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-300 text-sm font-medium hover:text-brand-orange-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h4 className="text-white font-semibold mb-4">Programs</h4>
            <ul className="space-y-2">
              {footerLinks.programs.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-300 text-sm font-medium hover:text-brand-orange-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Compliance & Trust */}
          <div>
            <h4 className="text-white font-semibold mb-4">Compliance & Trust</h4>
            <ul className="space-y-2">
              {footerLinks.compliance.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-300 text-sm font-medium hover:text-brand-orange-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Access */}
          <div>
            <h4 className="text-white font-semibold mb-4">Access</h4>
            <ul className="space-y-2">
              {footerLinks.access.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-300 text-sm font-medium hover:text-brand-orange-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="lg:flex lg:items-center lg:justify-between">
            {/* Logo & Description */}
            <div className="lg:max-w-md">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10    rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">E</span>
                </div>
                <div>
                  <span className="text-lg font-bold text-white">
                    Elevate for Humanity
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                Empowering Marion County and Indianapolis workforce through WIOA, WRG, and JRI-funded training programs.
                Building careers, strengthening communities.
              </p>
              <p className="text-sm text-slate-500 mt-2">
                An Equal Opportunity Employer/Program. Auxiliary aids and services are available upon request to individuals with disabilities. This program is funded in whole or in part by the Workforce Innovation and Opportunity Act (WIOA).
              </p>
            </div>

            {/* Social Links */}
            <div className="mt-6 lg:mt-0">
              <div className="flex items-center gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white transition-colors"
                      aria-label={social.name}
                    >
                      <Icon className="h-10 w-10" />
                    </a>
                  );
                })}
              </div>

              <p className="text-sm text-slate-400 mt-2">
                <a href="/support" className="hover:text-white transition-colors">
                  Get Help
                </a>
              </p>
            </div>
          </div>

          {/* Copyright & Legal Links */}
          <div className="mt-8 pt-8 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-slate-500">
              <p>© {currentYear} Elevate for Humanity, Inc. All rights reserved.</p>
              <div className="flex flex-wrap justify-center sm:justify-end gap-4">
                {footerLinks.legal.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
