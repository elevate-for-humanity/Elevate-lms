import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';

function VITAHeader() {
  return (
    <header className="bg-brand-green-700 text-white">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/tax/rise-up-foundation" className="text-2xl font-bold">
            Rise Up Foundation - VITA
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/tax/rise-up-foundation/free-tax-help" className="hover:text-brand-green-200">
              Free Tax Help
            </Link>
            <Link href="/tax/rise-up-foundation/volunteer" className="hover:text-brand-green-200">
              Volunteer
            </Link>
            <Link href="/tax/rise-up-foundation/training" className="hover:text-brand-green-200">
              Training
            </Link>
            <Link href="/tax/rise-up-foundation/site-locator" className="hover:text-brand-green-200">
              Find a Site
            </Link>
            <Link href="/tax/rise-up-foundation/faq" className="hover:text-brand-green-200">
              FAQ
            </Link>
            <Link href="/tax/rise-up-foundation/documents" className="hover:text-brand-green-200">
              Documents
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <a href="/support" className="flex items-center gap-2 hover:text-brand-green-200">
              <Phone className="w-4 h-4" />
              <span className="hidden lg:inline">Get Help Online</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

function VITAFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Rise Up Foundation</h3>
            <p className="text-black text-sm">
              Free tax preparation services through the IRS VITA program.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-black">
              <li><Link href="/tax/rise-up-foundation/free-tax-help" className="hover:text-white">Free Tax Help</Link></li>
              <li><Link href="/tax/rise-up-foundation/volunteer" className="hover:text-white">Volunteer</Link></li>
              <li><Link href="/tax/rise-up-foundation/training" className="hover:text-white">Training</Link></li>
              <li><Link href="/tax/rise-up-foundation/site-locator" className="hover:text-white">Find a Site</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-black">
              <li><Link href="/tax/rise-up-foundation/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link href="/tax/rise-up-foundation/documents" className="hover:text-white">Documents Needed</Link></li>
              <li><a href="https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers" target="_blank" rel="noopener noreferrer" className="hover:text-white">IRS VITA Info</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-black">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="/support" className="hover:text-white">Get Help Online</a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="/contact" className="hover:text-white">Contact Us</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>8888 Keystone Crossing, Suite 1300<br />Indianapolis, IN 46240</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-black">
          <p>&copy; {new Date().getFullYear()} Rise Up Foundation. Part of Elevate for Humanity. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function VITALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <VITAHeader />
      {children}
      <VITAFooter />
    </>
  );
}
