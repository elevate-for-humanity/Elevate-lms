'use client';

import Link from 'next/link';
import { siteConfig } from '@/content/site';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ROUTES } from '@/lib/navigation/routes';
import { PORTAL_MAP } from '@/lib/routing/portal-map';
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  ExternalLink,
} from 'lucide-react';

const portalHref = (key: keyof typeof PORTAL_MAP) => {
  const portal = PORTAL_MAP[key];
  return `${portal.host}${portal.defaultPath}`;
};

export function SiteFooter() {
  return (
    <footer className="border-t bg-slate-50">
      <div className="border-b bg-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-center md:gap-12">
            <div className="flex items-center gap-2 text-slate-600">
              <svg className="h-4 w-4 flex-shrink-0 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
              <span className="text-xs text-slate-600">Secure SSL</span>
            </div>
            <div className="max-w-xl px-2 text-xs text-slate-500">
              <strong>Funding notice:</strong> Elevate is a workforce training provider and Registered Apprenticeship sponsor. Individual programs may be eligible for WIOA, Workforce Ready Grant, or other funding — eligibility varies by program and participant. Contact admissions or your local WorkOne office to confirm available funding options.
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-1">
            <p className="font-bold text-slate-900">{siteConfig.name}</p>
            <p className="mt-2 text-sm text-slate-600">{siteConfig.description}</p>

            <div className="mt-4 flex gap-3">
              <a href="https://facebook.com/elevateforhumanity" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://twitter.com/elevatefh" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white transition-colors hover:bg-sky-600" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://linkedin.com/company/elevateforhumanity" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-white transition-colors hover:bg-blue-800" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="https://instagram.com/elevateforhumanity" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white transition-opacity hover:opacity-90" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Programs</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href={ROUTES.programs} className="hover:text-slate-900">All Programs</Link></li>
              <li><Link href={ROUTES.programsHealthcare} className="hover:text-slate-900">Healthcare</Link></li>
              <li><Link href="/programs/skilled-trades" className="hover:text-slate-900">Skilled Trades</Link></li>
              <li><Link href={ROUTES.programsCosmetology} className="hover:text-slate-900">Beauty & Cosmetology</Link></li>
              <li><Link href={ROUTES.programsTechnology} className="hover:text-slate-900">Technology</Link></li>
              <li><Link href={ROUTES.storeDemo} className="hover:text-slate-900">Platform Demo</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Apprenticeships</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href={ROUTES.apprenticeships} className="hover:text-slate-900">All Apprenticeships</Link></li>
              <li><Link href={ROUTES.programsBarber} className="hover:text-slate-900">Barber</Link></li>
              <li><Link href={ROUTES.programsCosmetology} className="hover:text-slate-900">Cosmetology</Link></li>
              <li><Link href={ROUTES.programsEsthetician} className="hover:text-slate-900">Esthetics</Link></li>
              <li><Link href={ROUTES.apprenticeshipsHostShop} className="hover:text-slate-900">Host Shops</Link></li>
              <li><Link href={ROUTES.apprenticeshipSponsor} className="hover:text-slate-900">Sponsor</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Funding</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href={ROUTES.funding} className="hover:text-slate-900">All Funding Options</Link></li>
              <li><Link href={ROUTES.fundingWIOA} className="hover:text-slate-900">WIOA / WorkOne</Link></li>
              <li><Link href="/funding/wrg" className="hover:text-slate-900">Workforce Ready Grant</Link></li>
              <li><Link href="/funding/job-ready-indy" className="hover:text-slate-900">Job Ready Indy</Link></li>
              <li><Link href={ROUTES.scholarships} className="hover:text-slate-900">Scholarships</Link></li>
              <li><Link href={ROUTES.eligibility} className="hover:text-slate-900">Check Eligibility</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Contact</p>
            <p className="mt-2 text-sm text-slate-600">Questions about programs, funding, testing, or enrollment?</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <a href={`mailto:${PLATFORM_DEFAULTS.supportEmail}`} className="flex items-center gap-2 hover:text-slate-900">
                <Mail className="h-4 w-4" />
                <span className="break-all">{PLATFORM_DEFAULTS.supportEmail}</span>
              </a>
              <a href="tel:+13173143757" className="flex items-center gap-2 hover:text-slate-900">
                <Phone className="h-4 w-4" />
                <span>(317) 314-3757</span>
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4" />
                <span>{siteConfig.address}</span>
              </div>
              <Link href={ROUTES.contact} className="inline-flex rounded-lg bg-brand-red-600 px-4 py-2 font-semibold text-white hover:bg-brand-red-700">
                Contact Us
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">About</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href={ROUTES.about} className="hover:text-slate-900">About / Mission</Link></li>
              <li><Link href={ROUTES.successStories} className="hover:text-slate-900">Success Stories</Link></li>
              <li><Link href={ROUTES.blog} className="hover:text-slate-900">Blog</Link></li>
              <li><Link href={ROUTES.faq} className="hover:text-slate-900">FAQ</Link></li>
              <li><Link href={ROUTES.contact} className="hover:text-slate-900">Contact</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Employers</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href={ROUTES.employersHireGraduates} className="hover:text-slate-900">Hire Graduates</Link></li>
              <li><Link href={ROUTES.apprenticeshipSponsor} className="hover:text-slate-900">Sponsor an Apprentice</Link></li>
              <li><a href={ROUTES.employersPostJob} className="hover:text-slate-900">Post a Job</a></li>
              <li><a href={ROUTES.employerPortal} className="hover:text-slate-900">Employer Portal</a></li>
              <li><Link href={ROUTES.forAgencies} className="hover:text-slate-900">For Agencies</Link></li>
              <li><Link href="/partners" className="hover:text-slate-900">Partners</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Portals & Store</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><a href={portalHref('lms')} className="hover:text-slate-900">Student / LMS Portal</a></li>
              <li><a href={portalHref('apprentice')} className="hover:text-slate-900">Apprentice Portal</a></li>
              <li><a href={portalHref('hostshop')} className="hover:text-slate-900">Host Shop Portal</a></li>
              <li><a href={portalHref('workforce')} className="hover:text-slate-900">Workforce Portal</a></li>
              <li><a href={portalHref('partner')} className="hover:text-slate-900">Partner Portal</a></li>
              <li><Link href="/store" className="font-semibold text-brand-red-700 hover:text-brand-red-800">Store</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Testing</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href={ROUTES.testing} className="hover:text-slate-900">Testing Center</Link></li>
              <li><Link href={ROUTES.testing} className="hover:text-slate-900">ACT WorkKeys</Link></li>
              <li><Link href={ROUTES.testing} className="hover:text-slate-900">Certiport</Link></li>
              <li><Link href={ROUTES.testing} className="hover:text-slate-900">CareerSafe</Link></li>
              <li><Link href={ROUTES.testing} className="hover:text-slate-900">EPA 608</Link></li>
              <li><Link href={ROUTES.testing} className="hover:text-slate-900">CPR / First Aid</Link></li>
              <li><Link href="/testing/book?type=nha" className="hover:text-slate-900">NHA Testing</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Get Started</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href={ROUTES.apply} className="hover:text-slate-900">Apply Now</Link></li>
              <li><Link href={ROUTES.eligibility} className="hover:text-slate-900">Check Eligibility</Link></li>
              <li><Link href={ROUTES.contact} className="hover:text-slate-900">Schedule / Contact Admissions</Link></li>
              <li><a href={ROUTES.login} className="hover:text-slate-900">Student Login</a></li>
              <li><a href={ROUTES.adminLogin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-slate-900">Admin Portal <ExternalLink className="h-3 w-3" /></a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between">
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-slate-900">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-slate-900">Terms of Service</Link>
              <Link href="/accessibility" className="hover:text-slate-900">Accessibility</Link>
              <Link href="/federal-compliance" className="hover:text-slate-900">Federal Compliance</Link>
              <a href="https://www.dol.gov/agencies/eta/apprenticeship" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-slate-900">DOL Apprenticeship <ExternalLink className="h-3 w-3" /></a>
            </div>
            <p className="text-sm text-slate-500">© {new Date().getFullYear()} {PLATFORM_DEFAULTS.orgName}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
