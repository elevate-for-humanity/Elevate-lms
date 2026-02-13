import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';

/**
 * Professional Tax Brand Footer
 * Includes required global disclosure
 */
export function SupersonicFooter() {
  return (
    <footer className="bg-gray-900 text-white pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="text-xl font-bold mb-4">
              <span className="text-white">Supersonic</span>
              <span className="text-red-500"> Fast Cash</span>
              <span className="text-white text-sm font-normal ml-1">LLC</span>
            </div>
            <p className="text-gray-400 text-sm">
              Professional tax preparation services with optional refund advance access.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/supersonic-fast-cash/pricing" className="text-gray-400 hover:text-white text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/supersonic-fast-cash/how-it-works" className="text-gray-400 hover:text-white text-sm">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/supersonic-fast-cash/cash-advance" className="text-gray-400 hover:text-white text-sm">
                  Refund Advance
                </Link>
              </li>
              <li>
                <Link href="/supersonic-fast-cash/support" className="text-gray-400 hover:text-white text-sm">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/supersonic-fast-cash/legal/privacy" className="text-gray-400 hover:text-white text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/supersonic-fast-cash/legal/terms" className="text-gray-400 hover:text-white text-sm">
                  Terms of Service
                </Link>
              </li>

            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <a href="/support" className="text-gray-400 hover:text-white text-sm">
                  Get Help Online
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <a href="mailto:supersonicfastcashllc@gmail.com" className="text-gray-400 hover:text-white text-sm">
                  supersonicfastcashllc@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-400 text-sm">Indianapolis, IN</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Global Disclosure - REQUIRED */}
        <div className="border-t border-gray-800 mt-10 pt-6">
          <p className="text-gray-500 text-xs leading-relaxed max-w-4xl">
            Supersonic Fast Cash LLC provides tax preparation services. Refund advance options, when available, 
            are based on an individual's expected tax refund and eligibility requirements. Refund advances are 
            optional and are repaid from the taxpayer's refund. Supersonic Fast Cash LLC does not provide loans 
            or guarantee refund amounts.
          </p>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-6 pt-6 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Supersonic Fast Cash LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
