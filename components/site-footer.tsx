'use client';

import Link from 'next/link';
import { siteConfig } from '@/content/site';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Shield, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

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

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <p className="font-bold text-slate-900">{siteConfig.name}</p>
            <p className="mt-2 text-sm text-slate-600">{siteConfig.description}</p>
            
            {/* Social Links */}
            <div className="flex gap-3 mt-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white hover:bg-sky-600 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white hover:bg-blue-800 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Programs */}
          <div>
            <p className="text-sm font-semibold text-slate-900">Programs</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href="/programs" className="hover:text-slate-900">All Programs</Link></li>
              <li><Link href="/career-training" className="hover:text-slate-900">Career Training</Link></li>
              <li><Link href="/community-services" className="hover:text-slate-900">Community Services</Link></li>
              <li><Link href="/store" className="hover:text-slate-900">Platform Licensing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-sm font-semibold text-slate-900">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link href="/about" className="hover:text-slate-900">About</Link></li>
              <li><Link href="/contact" className="hover:text-slate-900">Contact</Link></li>
              <li><Link href="/blog" className="hover:text-slate-900">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-slate-900">Careers</Link></li>
              <li><Link href="/press" className="hover:text-slate-900">Press</Link></li>
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
                <span>{siteConfig.phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>{siteConfig.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t pt-6">
          <div className="flex flex-col md:flex-row md:justify-between gap-4">
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-slate-900">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-slate-900">Terms of Service</Link>
              <Link href="/accessibility" className="hover:text-slate-900">Accessibility</Link>
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
