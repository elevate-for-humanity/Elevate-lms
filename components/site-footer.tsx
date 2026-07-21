'use client';

import Link from 'next/link';
import { siteConfig } from '@/content/site';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Shield, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="border-t bg-slate-50">
      {/* Trust Badges */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            <div className="flex items-center gap-2 text-slate-600">
              <Shield className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium">ETPL Approved</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
              <span className="text-sm font-medium">Secure SSL</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="text-sm font-medium">DOL Registered</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="text-sm font-medium">WIOA Compliant</span>
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
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center hover:bg-brand-red-600 hover:text-white transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center hover:bg-brand-red-600 hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center hover:bg-brand-red-600 hover:text-white transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center hover:bg-brand-red-600 hover:text-white transition-colors">
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
              <li><Link href="/cna-waitlist" className="hover:text-slate-900">CNA Interest List</Link></li>
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
