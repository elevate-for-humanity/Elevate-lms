import Link from 'next/link';

export default function SimpleFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-bold text-black mb-4">Elevate</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/programs"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  Programs
                </Link>
              </li>
              <li>
                <Link
                  href="/courses"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  Courses
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-black mb-4">Community</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/student/dashboard"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  Learners
                </Link>
              </li>
              <li>
                <Link
                  href="/employers"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  Employers
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-black mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-black mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-sm text-black hover:text-brand-blue-600"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-200 text-center space-y-2">
          <p className="text-sm font-medium text-brand-blue-600">
            Currently serving Indiana residents.
          </p>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Elevate for Humanity. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
