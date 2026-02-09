'use client';

import Link from 'next/link';
import {
  BookOpen,
  Briefcase,
  Calendar,
  ChevronDown,
  DollarSign,
  FileText,
  Phone,
} from 'lucide-react';

export function SupersonicHeader() {
  return (
    <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white sticky top-0 z-50 shadow-2xl border-b-4 border-red-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link
            href="/supersonic-fast-cash"
            className="flex items-center gap-3 group transition-transform hover:scale-105"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-red-500/50 transition-shadow">
              <DollarSign className="w-9 h-9 text-white" />
            </div>
            <div className="text-2xl font-black uppercase tracking-tight">
              Supersonic Fast Cash
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <div className="relative group">
              <button className="flex items-center gap-1 font-bold hover:text-red-400 transition-colors text-sm uppercase tracking-wide" aria-label="Action button">
                Services{' '}
                <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute top-full left-0 mt-2 bg-white text-black shadow-2xl rounded-xl p-2 hidden group-hover:block w-64 border border-gray-100">
                <Link
                  href="/supersonic-fast-cash/apply"
                  className="block px-4 py-3 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors font-semibold"
                >
                  💵 Tax Refund Advance
                </Link>
                <Link
                  href="/supersonic-fast-cash/services"
                  className="block px-4 py-3 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors font-semibold"
                >
                  👨‍
                  <Briefcase className="w-5 h-5 inline-block" /> Professional
                  Tax Prep
                </Link>
                <Link
                  href="/supersonic-fast-cash/diy-taxes"
                  className="block px-4 py-3 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors font-semibold"
                >
                  <FileText className="w-5 h-5 inline-block" /> DIY Self-Prep
                </Link>
                <Link
                  href="/supersonic-fast-cash/book-appointment"
                  className="block px-4 py-3 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-semibold"
                >
                  <Calendar className="w-5 h-5 inline-block" /> Book Appointment
                </Link>
              </div>
            </div>

            <div className="relative group">
              <button className="flex items-center gap-1 font-bold hover:text-red-400 transition-colors text-sm uppercase tracking-wide" aria-label="Action button">
                Tools{' '}
                <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute top-full left-0 mt-2 bg-white text-black shadow-2xl rounded-xl p-2 hidden group-hover:block w-64 border border-gray-100">
                <Link
                  href="/supersonic-fast-cash/tax-information"
                  className="block px-4 py-3 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors font-semibold"
                >
                  <BookOpen className="w-5 h-5 inline-block" /> Tax Information
                </Link>
                <Link
                  href="/supersonic-fast-cash/tax-tools"
                  className="block px-4 py-3 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors font-semibold"
                >
                  🛠️ Tax Tools
                </Link>
                <Link
                  href="/supersonic-fast-cash/calculator"
                  className="block px-4 py-3 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors font-semibold"
                >
                  🧮 Refund Calculator
                </Link>
                <Link
                  href="/supersonic-fast-cash/tools/refund-tracker"
                  className="block px-4 py-3 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors font-semibold"
                >
                  📍 Track Refund
                </Link>
                <Link
                  href="/supersonic-fast-cash/upload-documents"
                  className="block px-4 py-3 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors font-semibold"
                >
                  📤 Upload Documents
                </Link>
              </div>
            </div>

            <Link
              href="/supersonic-fast-cash/pricing"
              className="font-bold hover:text-red-400 transition-colors text-sm uppercase tracking-wide"
            >
              Pricing
            </Link>
            <Link
              href="/supersonic-fast-cash/locations"
              className="font-bold hover:text-red-400 transition-colors text-sm uppercase tracking-wide"
            >
              Locations
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <a
              href="tel:+13173143757"
              className="hidden sm:block font-bold text-lg hover:text-red-400 transition-colors"
            >
              <Phone className="w-5 h-5 inline-block" /> (317) 314-3757
            </a>
            <Link
              href="/supersonic-fast-cash/apply"
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-black rounded-xl hover:from-red-700 hover:to-red-800 uppercase shadow-lg hover:shadow-red-500/50 transition-all transform hover:scale-105"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
