import Link from 'next/link';
import { Phone } from 'lucide-react';

/**
 * ENTERPRISE FOOTER
 *
 * Structure:
 * 1. Hero Block (Logo + Tagline + CTA)
 * 2. Three Columns (About, Get Help, Legal)
 * 3. Trust Block (Entity, Location, Credentials)
 * 4. Copyright + Social
 *
 * Rules:
 * - 40% fewer links than before
 * - ONE clear CTA
 * - Trust signals prominent
 * - No junk drawer
 */

export default function SiteFooterEnterprise() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white text-black border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        {/* 1. Hero Block */}
        <div className="mb-12 text-center">
          <Link href="/" aria-label="Link" className="inline-block mb-4">
            <div className="font-black text-black text-3xl tracking-tight">
              Elevate
            </div>
            <div className="text-orange-500 text-sm font-semibold -mt-1">
              For Humanity
            </div>
          </Link>

          <p className="text-lg text-black mb-6 max-w-2xl mx-auto">
            Free job training. Real careers. No debt.
          </p>

          {/* ONE CTA */}
          <div className="bg-brand-blue-50 border-2 border-brand-blue-600 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-black mb-3">
              Need Help? Talk to an Advisor
            </h3>
            <a
              href="/support"
              className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-700 transition"
            >
              <Phone className="h-5 w-5" />
              Call Get Help
            </a>
          </div>
        </div>

        {/* 2. Three Columns */}
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Column 1: About */}
          <div>
            <h3 className="font-bold text-black text-sm uppercase tracking-wide mb-4">
              About
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-black hover:text-black transition"
                >
                  Our Mission
                </Link>
              </li>
              <li>
                <Link
                  href="/about/team"
                  className="text-black hover:text-black transition"
                >
                  Our Story
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-black hover:text-black transition"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-black hover:text-black transition"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Get Help */}
          <div>
            <h3 className="font-bold text-black text-sm uppercase tracking-wide mb-4">
              Get Help
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/contact"
                  className="text-black hover:text-black transition"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-black hover:text-black transition"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-black hover:text-black transition"
                >
                  Student Support
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-black hover:text-black transition"
                >
                  Technical Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 className="font-bold text-black text-sm uppercase tracking-wide mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-black hover:text-black transition"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-black hover:text-black transition"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-black hover:text-black transition"
                >
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/accessibility"
                  className="text-black hover:text-black transition"
                >
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Trust Block */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-black mb-3">
                Elevate For Humanity, Inc.
              </h4>
              <p className="text-black mb-2">Indianapolis, Indiana</p>
              <p className="text-black text-sm">
                Nonprofit workforce development organization
              </p>
            </div>
            <div>
              <h4 className="font-bold text-black mb-3">Credentials</h4>
              <ul className="space-y-2 text-black text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>DOL Registered Apprenticeship Sponsor</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>ETPL Approved Provider (Indiana DWD)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>1,500+ graduates since 2020</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 4. Copyright + Social */}
        <div className="pt-8 border-t border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Social Links */}
            <div className="flex gap-3">
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition text-black"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/elevate-for-humanity"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-black transition"
                aria-label="LinkedIn"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61571046346179"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-black transition"
                aria-label="Facebook"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/elevateforhumanity"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-black transition"
                aria-label="Instagram"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@elevateforhumanity"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-black transition"
                aria-label="YouTube"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>

            {/* Copyright */}
            <p className="text-sm text-black">
              © {currentYear} Elevate For Humanity. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
