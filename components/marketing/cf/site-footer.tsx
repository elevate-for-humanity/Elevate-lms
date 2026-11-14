import Link from 'next/link';
import { siteConfig } from '@/content/cf-site';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export function SiteFooter() {
  return (
    <footer className="border-t bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <p className="font-semibold">{siteConfig.name}</p>
            <p className="mt-2 text-sm text-slate-700">{siteConfig.description}</p>
          </div>

          <div>
            <p className="text-sm font-semibold">Programs</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>
                <Link href="/programs" className="hover:text-slate-900">
                  All Programs
                </Link>
              </li>
              <li>
                <Link href="/career-training" className="hover:text-slate-900">
                  Career Training
                </Link>
              </li>
              <li>
                <Link href="/community-services" className="hover:text-slate-900">
                  Community Services
                </Link>
              </li>
              <li>
                <Link href="/cna-waitlist" className="hover:text-slate-900">
                  CNA Interest List
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>
                <Link href="/about" className="hover:text-slate-900">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-slate-900">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700"></ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 flex flex-col gap-2 text-sm text-slate-700 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} {PLATFORM_DEFAULTS.orgName}. All rights reserved.</p>
          <p>
            {siteConfig.phone} · {siteConfig.address}
          </p>
        </div>
      </div>
    </footer>
  );
}
