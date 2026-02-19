'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4">
        <nav aria-label="Footer navigation" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-lg mb-4">Elevate for Humanity</h3>
            <p className="text-gray-400 text-sm mb-4">
              Free career training programs with job placement support for underserved communities.
            </p>
            <div className="flex gap-4">
              <a href="/support" className="text-gray-400 hover:text-white text-sm">Get Help Online</a>
            </div>
          </div>

          {/* Programs */}
          <div>
            <h4 className="font-semibold mb-4">Programs</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/programs" className="hover:text-white">All Programs</Link></li>
              <li><Link href="/programs/healthcare" className="hover:text-white">Healthcare</Link></li>
              <li><Link href="/programs/skilled-trades" className="hover:text-white">Skilled Trades</Link></li>
              <li><Link href="/programs/beauty" className="hover:text-white">Beauty & Barbering</Link></li>
              <li><Link href="/programs/technology" className="hover:text-white">Technology</Link></li>
              <li><Link href="/check-eligibility" className="hover:text-white">Check Eligibility</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
            </ul>
          </div>

          {/* Career Pathways */}
          <div>
            <h4 className="font-semibold mb-4">Career Pathways</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/pathways" className="hover:text-white">Pathway Framework</Link></li>
              <li><Link href="/pathways/outcomes" className="hover:text-white">Outcomes & Metrics</Link></li>
              <li><Link href="/pathways/partners" className="hover:text-white">Partners & Cohorts</Link></li>
              <li><Link href="/pathways/training-model" className="hover:text-white">Training Model</Link></li>
              <li><Link href="/instructional-framework" className="hover:text-white">Instructional Framework</Link></li>
              <li><Link href="/instructor-credentials" className="hover:text-white">Instructor Credentials</Link></li>
              <li><Link href="/funding" className="hover:text-white">Funding & Financial Aid</Link></li>
              <li><Link href="/career-services" className="hover:text-white">Career Services</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-semibold mb-4">About</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/directory" className="hover:text-white">Partner Directory</Link></li>
              <li><Link href="/philanthropy" className="hover:text-white">Support Us</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/accreditation" className="hover:text-white">Accreditation</Link></li>
              <li><Link href="/compliance" className="hover:text-white">Compliance</Link></li>
              <li><Link href="/transparency" className="hover:text-white">Transparency</Link></li>
            </ul>
          </div>
        </nav>

        {/* Enrollment Disclaimer */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <p className="text-xs text-gray-500 mb-2">
            Enrollment is program-based. Courses, projects, and hands-on activities are part of your program and cannot be accessed independently.
          </p>
          <p className="text-xs text-gray-500">
            Some programs are publicly funded. Some are self-pay. All pathways are sponsor-managed and state-approved.
          </p>
        </div>

        <div className="border-t border-gray-800 mt-6 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <div>© {new Date().getFullYear()} 2Exclusive LLC-S (d/b/a Elevate for Humanity Career &amp; Technical Institute). All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/governance/legal" className="hover:text-white">Legal</Link>
            <Link href="/governance" className="hover:text-white">Governance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
