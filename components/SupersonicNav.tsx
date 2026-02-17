'use client';

import Link from 'next/link';
import { DollarSign, ChevronDown, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function SupersonicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-brand-blue-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            href="/supersonic-fast-cash"
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-brand-red-600 rounded-full flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div className="text-xl md:text-2xl font-black uppercase">
              Supersonic Fast Cash
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {/* Services Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 font-bold hover:text-brand-red-500 transition-colors">
                Services <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-0 bg-white text-black shadow-xl rounded-lg p-4 hidden group-hover:block w-64 mt-2">
                <Link
                  href="/supersonic-fast-cash/apply"
                  className="block py-2 px-3 hover:bg-brand-red-50 hover:text-brand-red-600 rounded transition-colors"
                >
                  💵 Tax Refund Advance
                </Link>
                <Link
                  href="/supersonic-fast-cash/services"
                  className="block py-2 px-3 hover:bg-brand-red-50 hover:text-brand-red-600 rounded transition-colors"
                >
                  👨‍💼 Professional Tax Prep
                </Link>
                <Link
                  href="/supersonic-fast-cash/diy-taxes"
                  className="block py-2 px-3 hover:bg-brand-red-50 hover:text-brand-red-600 rounded transition-colors"
                >
                  💻 DIY Self-Prep
                </Link>
                <Link
                  href="/supersonic-fast-cash/book-appointment"
                  className="block py-2 px-3 hover:bg-brand-red-50 hover:text-brand-red-600 rounded transition-colors"
                >
                  📅 Book Appointment
                </Link>
              </div>
            </div>

            {/* Tools Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 font-bold hover:text-brand-red-500 transition-colors">
                Tools <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-0 bg-white text-black shadow-xl rounded-lg p-4 hidden group-hover:block w-64 mt-2">
                <Link
                  href="/supersonic-fast-cash/calculator"
                  className="block py-2 px-3 hover:bg-gray-50 hover:text-brand-blue-900 rounded transition-colors"
                >
                  🧮 Refund Calculator
                </Link>
                <Link
                  href="/supersonic-fast-cash/tools/refund-tracker"
                  className="block py-2 px-3 hover:bg-gray-50 hover:text-brand-blue-900 rounded transition-colors"
                >
                  📍 Track Refund
                </Link>
                <Link
                  href="/supersonic-fast-cash/upload-documents"
                  className="block py-2 px-3 hover:bg-gray-50 hover:text-brand-blue-900 rounded transition-colors"
                >
                  📄 Upload Documents
                </Link>
                <Link
                  href="/supersonic-fast-cash/portal"
                  className="block py-2 px-3 hover:bg-gray-50 hover:text-brand-blue-900 rounded transition-colors"
                >
                  👤 Customer Portal
                </Link>
                <Link
                  href="/supersonic-fast-cash/tools/smart-upload"
                  className="block py-2 px-3 hover:bg-gray-50 hover:text-brand-blue-900 rounded transition-colors"
                >
                  📤 Smart Upload
                </Link>
              </div>
            </div>

            {/* Resources Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 font-bold hover:text-brand-red-500 transition-colors">
                Resources <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-0 bg-white text-black shadow-xl rounded-lg p-4 hidden group-hover:block w-64 mt-2">
                <Link
                  href="/supersonic-fast-cash/how-it-works"
                  className="block py-2 px-3 hover:bg-brand-red-50 hover:text-brand-red-600 rounded transition-colors"
                >
                  ❓ How It Works
                </Link>
                <Link
                  href="/supersonic-fast-cash/pricing"
                  className="block py-2 px-3 hover:bg-brand-red-50 hover:text-brand-red-600 rounded transition-colors"
                >
                  💲 Pricing
                </Link>
                <Link
                  href="/supersonic-fast-cash/locations"
                  className="block py-2 px-3 hover:bg-brand-red-50 hover:text-brand-red-600 rounded transition-colors"
                >
                  📍 Locations
                </Link>
              </div>
            </div>

            {/* About Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 font-bold hover:text-brand-red-500 transition-colors">
                About <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-0 bg-white text-black shadow-xl rounded-lg p-4 hidden group-hover:block w-64 mt-2">
                <Link
                  href="/supersonic-fast-cash/careers"
                  className="block py-2 px-3 hover:bg-gray-50 hover:text-brand-blue-900 rounded transition-colors"
                >
                  💼 Careers
                </Link>
                <Link
                  href="/supersonic-fast-cash/careers/training"
                  className="block py-2 px-3 hover:bg-gray-50 hover:text-brand-blue-900 rounded transition-colors"
                >
                  📚 Training
                </Link>
                <a
                  href="/support"
                  className="block py-2 px-3 hover:bg-gray-50 hover:text-brand-blue-900 rounded transition-colors"
                >
                  📞 Contact Us
                </a>
              </div>
            </div>
          </nav>

          {/* Right Side - Phone & CTA */}
          <div className="flex items-center gap-3">
            <a
              href="/support"
              className="hidden md:flex items-center gap-2 font-bold hover:text-brand-red-500 transition-colors"
            >
              📞 Get Help Online
            </a>
            <Link
              href="/supersonic-fast-cash/apply"
              className="px-6 py-3 bg-brand-red-600 text-white font-black rounded-lg hover:bg-brand-red-700 uppercase transition-colors"
            >
              Apply Now
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-brand-blue-800">
            <div className="space-y-2">
              <div className="font-bold text-brand-red-500 mb-2">Services</div>
              <Link
                href="/supersonic-fast-cash/apply"
                className="block py-2 pl-4 hover:bg-brand-blue-800 rounded"
              >
                Tax Refund Advance
              </Link>
              <Link
                href="/supersonic-fast-cash/services"
                className="block py-2 pl-4 hover:bg-brand-blue-800 rounded"
              >
                Professional Tax Prep
              </Link>
              <Link
                href="/supersonic-fast-cash/diy-taxes"
                className="block py-2 pl-4 hover:bg-brand-blue-800 rounded"
              >
                DIY Self-Prep
              </Link>
              <Link
                href="/supersonic-fast-cash/book-appointment"
                className="block py-2 pl-4 hover:bg-brand-blue-800 rounded"
              >
                Book Appointment
              </Link>

              <div className="font-bold text-brand-red-500 mb-2 mt-4">Tools</div>
              <Link
                href="/supersonic-fast-cash/calculator"
                className="block py-2 pl-4 hover:bg-brand-blue-800 rounded"
              >
                Refund Calculator
              </Link>
              <Link
                href="/supersonic-fast-cash/tools/refund-tracker"
                className="block py-2 pl-4 hover:bg-brand-blue-800 rounded"
              >
                Track Refund
              </Link>
              <Link
                href="/supersonic-fast-cash/upload-documents"
                className="block py-2 pl-4 hover:bg-brand-blue-800 rounded"
              >
                Upload Documents
              </Link>
              <Link
                href="/supersonic-fast-cash/portal"
                className="block py-2 pl-4 hover:bg-brand-blue-800 rounded"
              >
                Customer Portal
              </Link>

              <div className="font-bold text-brand-red-500 mb-2 mt-4">Resources</div>
              <Link
                href="/supersonic-fast-cash/how-it-works"
                className="block py-2 pl-4 hover:bg-brand-blue-800 rounded"
              >
                How It Works
              </Link>
              <Link
                href="/supersonic-fast-cash/pricing"
                className="block py-2 pl-4 hover:bg-brand-blue-800 rounded"
              >
                Pricing
              </Link>
              <Link
                href="/supersonic-fast-cash/locations"
                className="block py-2 pl-4 hover:bg-brand-blue-800 rounded"
              >
                Locations
              </Link>

              <div className="font-bold text-brand-red-500 mb-2 mt-4">About</div>
              <Link
                href="/supersonic-fast-cash/careers"
                className="block py-2 pl-4 hover:bg-brand-blue-800 rounded"
              >
                Careers
              </Link>
              <a
                href="/support"
                className="block py-2 pl-4 hover:bg-brand-blue-800 rounded"
              >
                Contact Us
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
