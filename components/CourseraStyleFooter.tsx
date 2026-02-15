import Link from 'next/link';

export default function CourseraStyleFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1 - Company */}
          <div>
            <h3 className="text-sm font-bold text-black mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  Careers
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2 - Programs */}
          <div>
            <h3 className="text-sm font-bold text-black mb-4">Programs</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/programs"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  All Programs
                </Link>
              </li>
              <li>
                <Link
                  href="/programs/medical-assistant"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  Medical Assistant
                </Link>
              </li>
              <li>
                <Link
                  href="/programs/hvac-technician"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  HVAC Technician
                </Link>
              </li>
              <li>
                <Link
                  href="/programs/barber-apprenticeship"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  Barber Apprenticeship
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 - For You */}
          <div>
            <h3 className="text-sm font-bold text-black mb-4">For You</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/apply"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  Apply Now
                </Link>
              </li>
              <li>
                <Link
                  href="/employers"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  For Employers
                </Link>
              </li>
              <li>
                <Link
                  href="/partners"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  For Partners
                </Link>
              </li>

            </ul>
          </div>

          {/* Column 4 - Support */}
          <div>
            <h3 className="text-sm font-bold text-black mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/directory"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  Directory
                </Link>
              </li>
              <li>
                <Link
                  href="/philanthropy"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  Community Impact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Compliance Section */}
        <div className="pt-8 border-t border-gray-200 mb-6">
          <div className="bg-brand-blue-50 border border-brand-blue-100 rounded-lg p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-bold text-brand-blue-900">🏛️ Government-Contracted Workforce Training Provider</span>
              <span className="text-gray-400">|</span>
              <span className="text-black">ETPL-Approved</span>
              <span className="text-gray-400">|</span>
              <span className="text-black">WIOA Certified</span>
            </div>

            <div className="text-xs text-black leading-relaxed">
              A program of <strong>Selfish Inc</strong>, a 501(c)(3) nonprofit organization serving Marion County and surrounding areas through partnerships with EmployIndy, Indiana Department of Workforce Development, and the U.S. Department of Labor.
            </div>

            <div className="text-xs text-black leading-relaxed bg-white p-3 rounded border border-brand-blue-200">
              <strong>⚖️ Equal Opportunity Employer/Program:</strong> Elevate for Humanity is an equal opportunity employer and does not discriminate on the basis of race, color, religion, sex, national origin, age, disability, veteran status, sexual orientation, gender identity, or any other protected characteristic. Auxiliary aids and services are available upon request to individuals with disabilities. <strong>Indiana Relay:</strong> 711 or 800-743-3333 (TDD).
            </div>

            <div className="text-xs text-black">
              <strong>Contact:</strong> (317) 314-3757 | <a href="mailto:elevate4humanityedu@gmail.com" className="text-brand-blue-600 hover:underline">elevate4humanityedu@gmail.com</a> | Serving 8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo and Copyright */}
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-4">
                <div className="text-xl font-bold text-brand-blue-600">Elevate</div>
                <span className="text-sm text-gray-500">
                  © {new Date().getFullYear()} Elevate for Humanity, Inc.
                </span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com/elevateforhumanity"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-brand-blue-600 transition"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-brand-blue-600 transition"
               />
              <a
                href="https://linkedin.com/company/elevate-for-humanity"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-brand-blue-600 transition"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com/elevateforhumanity"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-brand-blue-600 transition"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com/@elevateforhumanity"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-brand-blue-600 transition"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <Link href="/privacy-policy" aria-label="Link" className="hover:text-brand-blue-600">
                Privacy
              </Link>
              <Link href="/terms-of-service" aria-label="Link" className="hover:text-brand-blue-600">
                Terms
              </Link>
              <Link href="/accessibility" aria-label="Link" className="hover:text-brand-blue-600">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
