import Link from 'next/link';

const footerLinks = {
  resources: [
    { label: 'Funding Options', href: '/funding' },
    { label: 'Testing Center', href: '/testing' },
    { label: 'Apprenticeship', href: '/barber-and-beauty-apprenticeships' },
    { label: 'Career Services', href: '/career-services' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Partners', href: '/partners' },
    { label: 'Employers', href: '/employers' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Accessibility', href: '/accessibility' },
    { label: 'Student Handbook', href: '/handbook' },
  ],
};

interface PlatformFooterProps {
  variant?: 'marketing' | 'lms' | 'admin';
  className?: string;
}

export function PlatformFooter({ variant = 'marketing', className }: PlatformFooterProps) {
  const isMinimal = variant === 'admin';

  return (
    <footer className={className}>
      {isMinimal ? (
        <div className="border-t bg-gray-50">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">E</span>
                </div>
                <span className="text-sm text-gray-600">Elevate for Humanity</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <Link href="/privacy" className="hover:text-gray-700">Privacy</Link>
                <Link href="/terms" className="hover:text-gray-700">Terms</Link>
                <span>© 2026</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 text-gray-300">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <Link href="/" className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">E</span>
                  </div>
                  <span className="font-bold text-white">Elevate for Humanity</span>
                </Link>
                <p className="text-sm text-gray-400">
                  Workforce development, career training, and registered apprenticeship pathways.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-4">Resources</h3>
                <ul className="space-y-2 text-sm">
                  {footerLinks.resources.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-4">Company</h3>
                <ul className="space-y-2 text-sm">
                  {footerLinks.company.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-4">Legal</h3>
                <ul className="space-y-2 text-sm">
                  {footerLinks.legal.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-12 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-400">© 2026 Elevate for Humanity. All rights reserved.</p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>ETPL Provider</span>
                  <span>•</span>
                  <span>Registered Apprenticeship Sponsor</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

export default PlatformFooter;
