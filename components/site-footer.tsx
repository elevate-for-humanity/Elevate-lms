'use client';

import Link from 'next/link';
import { siteConfig } from '@/content/site';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { LEGAL_ENTITY_OPERATING_LINE } from '@/lib/config/legal-entity';
import { ROUTES } from '@/lib/navigation/routes';
import { PORTAL_MAP } from '@/lib/routing/portal-map';
import { Mail, Phone, MapPin, Facebook, Linkedin, Instagram, ExternalLink } from 'lucide-react';

const portalHref = (key: keyof typeof PORTAL_MAP) => {
  const portal = PORTAL_MAP[key];
  return `${portal.host}${portal.defaultPath}`;
};

const linkClass = 'text-base text-slate-700 hover:text-slate-950 hover:underline';

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-950">
      <div className="border-b border-slate-200 bg-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="flex flex-wrap items-center justify-center gap-5 text-center md:gap-10">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <svg className="h-4 w-4 flex-shrink-0 text-blue-700" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" /></svg>
              <span>Secure SSL</span>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-700">
              <strong className="text-slate-950">Funding notice:</strong> Individual programs may be eligible for WIOA, Workforce Ready Grant, or other funding. Eligibility and availability vary by program and participant; funding is not guaranteed.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-9 md:grid-cols-5">
          <div>
            <p className="text-lg font-black text-slate-950">{siteConfig.name}</p>
            <p className="mt-2 text-base leading-7 text-slate-700">{siteConfig.description}</p>
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold leading-6 text-emerald-950">
              Career programs are supported by our nonprofit partner, Selfish Inc. d/b/a Rise Forward Foundation, through available community and wraparound resources. Support is subject to eligibility and program availability.
            </p>
            <Link href="/rise-forward-foundation" className="mt-3 inline-flex text-sm font-black text-emerald-800 hover:underline">Learn about Rise Forward Foundation</Link>
            <div className="mt-5 flex gap-3">
              <a href="https://www.facebook.com/profile.php?id=61571046346179" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-white hover:bg-blue-800" aria-label="Elevate for Humanity on Facebook"><Facebook className="h-5 w-5" /></a>
              <a href="https://linkedin.com/company/elevateforhumanity" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-800 text-white hover:bg-blue-900" aria-label="LinkedIn"><Linkedin className="h-5 w-5" /></a>
              <a href="https://instagram.com/elevateforhumanity" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white hover:bg-slate-800" aria-label="Instagram"><Instagram className="h-5 w-5" /></a>
            </div>
          </div>

          <FooterGroup title="Programs">
            <li><Link href={ROUTES.programs} className={linkClass}>All Programs</Link></li>
            <li><Link href={ROUTES.programsHealthcare} className={linkClass}>Healthcare</Link></li>
            <li><Link href="/programs/skilled-trades" className={linkClass}>Skilled Trades</Link></li>
            <li><Link href={ROUTES.programsTechnology} className={linkClass}>Technology</Link></li>
            <li><Link href={ROUTES.storeDemo} className={linkClass}>Platform Demo</Link></li>
          </FooterGroup>

          <FooterGroup title="Apprenticeships">
            <li><Link href={ROUTES.apprenticeships} className={linkClass}>All Apprenticeships</Link></li>
            <li><Link href={ROUTES.programsBarber} className={linkClass}>Barber</Link></li>
            <li><Link href={ROUTES.programsCosmetology} className={linkClass}>Cosmetology</Link></li>
            <li><Link href={ROUTES.programsEsthetician} className={linkClass}>Esthetics</Link></li>
            <li><Link href={ROUTES.programsNailTech} className={linkClass}>Nail Technician</Link></li>
          </FooterGroup>

          <FooterGroup title="Funding">
            <li><Link href={ROUTES.funding} className={linkClass}>All Funding Options</Link></li>
            <li><Link href={ROUTES.fundingWIOA} className={linkClass}>WIOA / WorkOne</Link></li>
            <li><Link href="/funding/wrg" className={linkClass}>Workforce Ready Grant</Link></li>
            <li><Link href={ROUTES.fundingJobReadyIndy} className={linkClass}>Job Ready Indy</Link></li>
            <li><Link href={ROUTES.scholarships} className={linkClass}>Scholarships</Link></li>
            <li><Link href={ROUTES.eligibility} className={linkClass}>Check Eligibility</Link></li>
          </FooterGroup>

          <div>
            <p className="text-base font-black text-slate-950">Contact</p>
            <p className="mt-3 text-base leading-6 text-slate-700">Questions about programs, funding, testing, or enrollment?</p>
            <div className="mt-4 space-y-3 text-base text-slate-700">
              <a href={`mailto:${PLATFORM_DEFAULTS.supportEmail}`} className="flex items-start gap-2 hover:text-slate-950 hover:underline"><Mail className="mt-1 h-4 w-4 shrink-0" /><span className="break-all">{PLATFORM_DEFAULTS.supportEmail}</span></a>
              <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-2 hover:text-slate-950 hover:underline"><Phone className="h-4 w-4" /><span>{PLATFORM_DEFAULTS.supportPhone}</span></a>
              <div className="flex items-start gap-2"><MapPin className="mt-1 h-4 w-4 shrink-0" /><span>{siteConfig.address}</span></div>
              <Link href={ROUTES.contact} className="inline-flex min-h-11 items-center rounded-lg bg-brand-red-700 px-4 py-2 font-bold text-white hover:bg-brand-red-800">Contact Us</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-9 border-t border-slate-200 pt-10 md:grid-cols-5">
          <FooterGroup title="About">
            <li><Link href={ROUTES.about} className={linkClass}>About / Mission</Link></li>
            <li><Link href="/rise-forward-foundation" className="text-base font-bold text-emerald-800 hover:underline">Rise Forward Foundation</Link></li>
            <li><Link href={ROUTES.aboutApprovals} className={linkClass}>Approvals</Link></li>
            <li><Link href={ROUTES.apprenticeshipSponsor} className={linkClass}>Apprenticeship Sponsor of Record</Link></li>
            <li><Link href={ROUTES.successStories} className={linkClass}>Success Stories</Link></li>
            <li><Link href={ROUTES.blog} className={linkClass}>Blog</Link></li>
            <li><Link href={ROUTES.faq} className={linkClass}>FAQ</Link></li>
          </FooterGroup>

          <FooterGroup title="Employers">
            <li><Link href={ROUTES.employersHireGraduates} className={linkClass}>Hire Graduates</Link></li>
            <li><Link href={ROUTES.apprenticeshipsHostShop} className={linkClass}>Become a Host Site</Link></li>
            <li><a href={ROUTES.employerPortal} className={linkClass}>Employer Portal</a></li>
            <li><Link href={ROUTES.forAgencies} className={linkClass}>For Agencies</Link></li>
          </FooterGroup>

          <FooterGroup title="Portals & Store">
            <li><a href={portalHref('lms')} className={linkClass}>Student / LMS Portal</a></li>
            <li><a href={portalHref('apprentice')} className={linkClass}>Apprentice Portal</a></li>
            <li><a href={portalHref('hostshop')} className={linkClass}>Host Site Portal</a></li>
            <li><a href={portalHref('workforce')} className={linkClass}>Workforce Portal</a></li>
            <li><Link href={ROUTES.store} className="text-base font-bold text-brand-red-700 hover:underline">Store</Link></li>
          </FooterGroup>

          <FooterGroup title="Testing">
            <li><Link href={ROUTES.testing} className={linkClass}>Testing Center & Exam Options</Link></li>
            <li><Link href="/testing/book?type=nha" className={linkClass}>Book NHA Testing</Link></li>
          </FooterGroup>

          <FooterGroup title="Get Started">
            <li><Link href={ROUTES.apply} className={linkClass}>Apply Now</Link></li>
            <li><Link href={ROUTES.contact} className={linkClass}>Contact Admissions</Link></li>
            <li><a href={ROUTES.login} className={linkClass}>Student Login</a></li>
            <li><a href={ROUTES.adminLogin} target="_blank" rel="noopener noreferrer" className={`${linkClass} inline-flex items-center gap-1`}>Admin Portal <ExternalLink className="h-3 w-3" /></a></li>
          </FooterGroup>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <p className="mb-5 text-sm font-semibold leading-6 text-slate-700">
            <span className="font-black text-slate-950">Operating structure:</span> {LEGAL_ENTITY_OPERATING_LINE}. Training, public funding, and charitable support remain separate functions with separate eligibility and authorization requirements.
          </p>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-700">
              <Link href="/privacy" className="hover:text-slate-950 hover:underline">Privacy Policy</Link>
              <Link href="/terms-of-service" className="hover:text-slate-950 hover:underline">Terms of Service</Link>
              <Link href="/security-and-data-protection" className="hover:text-slate-950 hover:underline">Security &amp; Data</Link>
              <Link href="/accessibility" className="hover:text-slate-950 hover:underline">Accessibility</Link>
              <Link href="/federal-compliance" className="hover:text-slate-950 hover:underline">Federal Compliance</Link>
              <Link href="/legal" className="hover:text-slate-950 hover:underline">Legal &amp; Policies</Link>
              <a href="https://www.dol.gov/agencies/eta/apprenticeship" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-slate-950 hover:underline">DOL Apprenticeship <ExternalLink className="h-3 w-3" /></a>
            </div>
            <p className="text-sm font-medium text-slate-700">© {new Date().getFullYear()} {PLATFORM_DEFAULTS.orgName}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-base font-black text-slate-950">{title}</p>
      <ul className="mt-3 space-y-2.5">{children}</ul>
    </div>
  );
}
