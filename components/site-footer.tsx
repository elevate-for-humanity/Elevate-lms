'use client';

import Link from 'next/link';
import { siteConfig } from '@/content/site';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Shield, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, ExternalLink } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="border-t bg-slate-50">
      {/* Funding Disclosure Bar */}
      <div className="bg-slate-100 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-center">
            <div className="flex items-center gap-2 text-slate-600">
              <svg className="w-4 h-4 text-blue-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
              <span className="text-xs text-slate-600">Secure SSL</span>
            </div>
            <div className="max-w-xl text-xs text-slate-500 px-2">
              <strong>Funding notice:</strong> Elevate is a workforce training provider and Registered Apprenticeship sponsor. Individual programs may be eligible for WIOA, Workforce Ready Grant, or other funding — eligibility varies by program and participant. Contact admissions or your local WorkOne office to confirm available funding options.
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-5">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <p className="font-bold text-slate-900">{siteConfig.name}</p>
            <p className="mt-2 text-sm text-slate-600">{siteConfig.description}</p>

            {/* Social Links */}
            <div className="flex gap-3 mt-4">
              <a href="https://facebook.com/elevateforhumanity" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://twitter.com/elevatefh" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white hover:bg-sky-600 transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com/company/elevateforhumanity" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white hover:bg-blue-800 transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://instagram.com/elevateforhumanity" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Programs */}
          <div>
            <p className="text-sm font-semibold text-slate-900">Programs</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href="/programs" className="hover:text-slate-900">All Programs</Link></li>
              <li><Link href="/programs/healthcare" className="hover:text-slate-900">Healthcare</Link></li>
              <li><Link href="/programs/skilled-trades" className="hover:text-slate-900">Skilled Trades</Link></li>
              <li><Link href="/programs/beauty-cosmetology" className="hover:text-slate-900">Beauty & Cosmetology</Link></li>
              <li><Link href="/programs/technology" className="hover:text-slate-900">Technology</Link></li>
              <li><Link href="/programs" className="hover:text-slate-900">View All</Link></li>
            </ul>
          </div>

          {/* Apprenticeships */}
          <div>
            <p className="text-sm font-semibold text-slate-900">Apprenticeships</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href="/apprenticeships" className="hover:text-slate-900">All Apprenticeships</Link></li>
              <li><Link href="/programs/barber-apprenticeship" className="hover:text-slate-900">Barber</Link></li>
              <li><Link href="/programs/cosmetology-apprenticeship" className="hover:text-slate-900">Cosmetology</Link></li>
              <li><Link href="/programs/esthetician-apprenticeship" className="hover:text-slate-900">Esthetics</Link></li>
              <li><Link href="/apprenticeships/host-shop" className="hover:text-slate-900">Host Shops</Link></li>
              <li><Link href="/apprenticeships/sponsor" className="hover:text-slate-900">Sponsor</Link></li>
            </ul>
          </div>

          {/* Funding */}
          <div>
            <p className="text-sm font-semibold text-slate-900">Funding</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href="/funding" className="hover:text-slate-900">All Funding Options</Link></li>
              <li><Link href="/funding/wioa" className="hover:text-slate-900">WIOA / WorkOne</Link></li>
              <li><Link href="/funding/wioa" className="hover:text-slate-900">Workforce Ready Grant</Link></li>
              <li><Link href="/funding/job-ready-indy" className="hover:text-slate-900">Job Ready Indy</Link></li>
              <li><Link href="/scholarships" className="hover:text-slate-900">Scholarships</Link></li>
              <li><Link href="/funding" className="hover:text-slate-900">Payment Plans</Link></li>
              <li><Link href="/eligibility/quiz" className="hover:text-slate-900">Check Eligibility</Link></li>
            </ul>
          </div>

          {/* Contact + Newsletter */}
          <div>
            <p className="text-sm font-semibold text-slate-900">Stay Updated</p>
            <p className="mt-2 text-sm text-slate-600">Get program updates and workforce news.</p>

            {/* Newsletter Form */}
            <form className="mt-3 flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-600 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-brand-red-600 text-white text-sm font-medium rounded-lg hover:bg-brand-red-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
              </button>
            </form>

            {/* Contact Info */}
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+13173143757" className="hover:text-slate-900">(317) 314-3757</a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>{siteConfig.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Second row: About, Employer, Resources */}
        <div className="mt-8 grid gap-8 md:grid-cols-4">
          {/* About */}
          <div>
            <p className="text-sm font-semibold text-slate-900">About</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href="/about" className="hover:text-slate-900">Mission</Link></li>
              <li><Link href="/about/locations" className="hover:text-slate-900">Locations</Link></li>
              <li><Link href="/success-stories" className="hover:text-slate-900">Success Stories</Link></li>
              <li><Link href="/blog" className="hover:text-slate-900">Blog</Link></li>
              <li><Link href="/faq" className="hover:text-slate-900">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-slate-900">Contact</Link></li>
            </ul>
          </div>

          {/* Employers */}
          <div>
            <p className="text-sm font-semibold text-slate-900">Employers</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href="/hire-graduates" className="hover:text-slate-900">Hire Graduates</Link></li>
              <li><Link href="/apprenticeship-sponsor" className="hover:text-slate-900">Sponsor an Apprentice</Link></li>
              <li><Link href="/employers/post-job" className="hover:text-slate-900">Post a Job</Link></li>
              <li><Link href="/employers" className="hover:text-slate-900">Employer Portal</Link></li>
              <li><Link href="/for-agencies" className="hover:text-slate-900">For Agencies</Link></li>
              <li><Link href="/partners" className="hover:text-slate-900">Partners</Link></li>
            </ul>
          </div>

          {/* Testing */}
          <div>
            <p className="text-sm font-semibold text-slate-900">Testing</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href="/testing" className="hover:text-slate-900">Testing Center</Link></li>
              <li><Link href="/testing/act-workkeys" className="hover:text-slate-900">ACT WorkKeys</Link></li>
              <li><Link href="/testing/certiport" className="hover:text-slate-900">Certiport</Link></li>
              <li><Link href="/testing/careersafe" className="hover:text-slate-900">CareerSafe</Link></li>
              <li><Link href="/testing/epa-608" className="hover:text-slate-900">EPA 608</Link></li>
              <li><Link href="/testing/cpr" className="hover:text-slate-900">CPR / First Aid</Link></li>
            </ul>
          </div>

          {/* Apply */}
          <div>
            <p className="text-sm font-semibold text-slate-900">Get Started</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href="/apply" className="hover:text-slate-900">Apply Now</Link></li>
              <li><Link href="/apply/eligibility" className="hover:text-slate-900">Check Eligibility</Link></li>
              <li><Link href="/orientation/schedule" className="hover:text-slate-900">Schedule Orientation</Link></li>
              <li><Link href="/login" className="hover:text-slate-900">Student Login</Link></li>
              <li><a href="https://admin.elevateforhumanity.org" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 flex items-center gap-1">Admin Portal <ExternalLink className="w-3 h-3" /></a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t pt-6">
          <div className="flex flex-col md:flex-row md:justify-between gap-4">
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-slate-900">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-slate-900">Terms of Service</Link>
              <Link href="/accessibility" className="hover:text-slate-900">Accessibility</Link>
              <Link href="/federal-compliance" className="hover:text-slate-900">Federal Compliance</Link>
              <a href="https://www.dol.gov/agencies/eta/apprenticeship" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 flex items-center gap-1">DOL Apprenticeship <ExternalLink className="w-3 h-3" /></a>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} {PLATFORM_DEFAULTS.orgName}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
