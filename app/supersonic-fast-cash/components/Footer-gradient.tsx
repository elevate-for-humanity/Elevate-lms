import Link from 'next/link';
import {
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';

export function SupersonicFooter() {
  return (
    <footer className="bg-gradient-to-br from-brand-blue-950 via-brand-blue-900 to-brand-blue-950 text-white border-t-4 border-brand-red-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-red-600 to-brand-red-700 rounded-full flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div className="text-xl font-black uppercase">
                Supersonic Fast Cash
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Fast tax refund advances and professional tax preparation
              services. Licensed Enrolled Agent with full IRS representation
              rights.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-black text-lg mb-4 uppercase tracking-wide">
              Services
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/supersonic-fast-cash/apply"
                  className="text-gray-300 hover:text-brand-red-400 transition-colors"
                >
                  💵 Tax Refund Advance
                </Link>
              </li>
              <li>
                <Link
                  href="/supersonic-fast-cash/services"
                  className="text-gray-300 hover:text-brand-red-400 transition-colors"
                >
                  👨‍
                  <Briefcase className="w-5 h-5 inline-block" /> Professional
                  Tax Prep
                </Link>
              </li>
              <li>
                <Link
                  href="/supersonic-fast-cash/diy-taxes"
                  className="text-gray-300 hover:text-brand-red-400 transition-colors"
                >
                  <FileText className="w-5 h-5 inline-block" /> DIY Self-Prep
                </Link>
              </li>
              <li>
                <Link
                  href="/supersonic-fast-cash/book-appointment"
                  className="text-gray-300 hover:text-brand-red-400 transition-colors"
                >
                  <Calendar className="w-5 h-5 inline-block" /> Book Appointment
                </Link>
              </li>
              <li>
                <Link
                  href="/supersonic-fast-cash/pricing"
                  className="text-gray-300 hover:text-brand-red-400 transition-colors"
                >
                  💲 Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Tools & Resources */}
          <div>
            <h3 className="font-black text-lg mb-4 uppercase tracking-wide">
              Tools & Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/supersonic-fast-cash/calculator"
                  className="text-gray-300 hover:text-brand-red-400 transition-colors"
                >
                  Refund Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/supersonic-fast-cash/tools/refund-tracker"
                  className="text-gray-300 hover:text-brand-red-400 transition-colors"
                >
                  Track Refund
                </Link>
              </li>
              <li>
                <Link
                  href="/supersonic-fast-cash/upload-documents"
                  className="text-gray-300 hover:text-brand-red-400 transition-colors"
                >
                  Upload Documents
                </Link>
              </li>
              <li>
                <Link
                  href="/supersonic-fast-cash/locations"
                  className="text-gray-300 hover:text-brand-red-400 transition-colors"
                >
                  Locations
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-black text-lg mb-4 uppercase tracking-wide">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-brand-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <a
                    href="/support"
                    className="text-gray-300 hover:text-brand-red-400 transition-colors font-semibold"
                  >
                    Get Help Online
                  </a>
                  <div className="text-xs text-gray-300">Mon-Fri 9am-7pm</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-brand-red-500 flex-shrink-0 mt-0.5" />
                <a
                  href="mailto:supersonicfastcashllc@gmail.com"
                  className="text-gray-300 hover:text-brand-red-400 transition-colors"
                >
                  supersonicfastcashllc@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-gray-300">
                  Indianapolis, IN
                  <br />
                  <span className="text-sm text-gray-300">
                    Serving all 50 states
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-300">
              © {new Date().getFullYear()} Supersonic Fast Cash. All rights
              reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link
                href="/privacy"
                className="text-gray-300 hover:text-brand-red-400 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-300 hover:text-brand-red-400 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/supersonic-fast-cash/sub-office-agreement"
                className="text-gray-300 hover:text-brand-red-400 transition-colors"
              >
                Sub-Office Agreement
              </Link>
            </div>
          </div>
          <div className="text-center mt-6 text-xs text-gray-300">
            Licensed Enrolled Agent (EA) | IRS Authorized Tax Professional |
            PTIN Holder
          </div>
        </div>
      </div>
    </footer>
  );
}
