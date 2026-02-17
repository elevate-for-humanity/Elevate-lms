import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Smartphone, Zap, Download, Wifi, Bell, Lock } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/mobile-app',
  },
  title: 'Mobile App | Elevate For Humanity',
  description:
    'Install our mobile app directly from your browser. Access programs, track progress, and stay connected on the go.',
  openGraph: {
    title: 'Mobile App | Elevate For Humanity',
    description:
      'Install our mobile app directly from your browser. Access programs, track progress, and stay connected on the go.',
    images: ['/images/heroes/hero-homepage.jpg'],
  },
};

export default async function MobileAppPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch app info
  const { data: appInfo } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', 'mobile_app')
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Mobile App' }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[400px] md:h-[450px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/heroes/hero-homepage.jpg"
          alt="Mobile App"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Take Elevate With You
          </h1>
          <p className="text-base md:text-lg mb-8 text-gray-100">
            Install our mobile app directly from your browser. No app store
            needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#install"
              className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Install Now
            </a>
            <Link
              href="/programs"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-black">
            Everything You Need, Anywhere
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-blue-100 rounded-full mb-4">
                <Smartphone className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-black">
                Works Like a Native App
              </h3>
              <p className="text-black">
                Full-screen experience with smooth navigation and native-like
                performance.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-green-100 rounded-full mb-4">
                <Wifi className="w-8 h-8 text-brand-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-black">
                Works Offline
              </h3>
              <p className="text-black">
                Access your programs and progress even without an internet
                connection.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-blue-100 rounded-full mb-4">
                <Bell className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-black">
                Push Notifications
              </h3>
              <p className="text-black">
                Stay updated with program reminders, new opportunities, and
                important announcements.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-orange-100 rounded-full mb-4">
                <Zap className="w-8 h-8 text-brand-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-black">
                Lightning Fast
              </h3>
              <p className="text-black">
                Optimized for speed with instant loading and smooth transitions.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-red-100 rounded-full mb-4">
                <Download className="w-8 h-8 text-brand-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-black">
                No App Store Required
              </h3>
              <p className="text-black">
                Install directly from your browser. Updates happen
                automatically.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <Lock className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-black">
                Secure & Private
              </h3>
              <p className="text-black">
                Your data is encrypted and stored securely on your device.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Instructions */}
      <section id="install" className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-black">
            How to Install
          </h2>

          {/* iOS Instructions */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h3 className="text-lg md:text-lg font-bold mb-6 text-black flex items-center">
              <span className="text-3xl mr-3">
                <Smartphone className="w-5 h-5 inline-block" />
              </span>
              iPhone & iPad (Safari)
            </h3>
            <ol className="space-y-4 text-black">
              <li className="flex">
                <span className="font-bold text-brand-blue-600 mr-3">1.</span>
                <span>
                  Open <strong>www.elevateforhumanity.org</strong> in Safari
                </span>
              </li>
              <li className="flex">
                <span className="font-bold text-brand-blue-600 mr-3">2.</span>
                <span>
                  Tap the <strong>Share</strong> button (square with arrow
                  pointing up)
                </span>
              </li>
              <li className="flex">
                <span className="font-bold text-brand-blue-600 mr-3">3.</span>
                <span>
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </span>
              </li>
              <li className="flex">
                <span className="font-bold text-brand-blue-600 mr-3">4.</span>
                <span>
                  Tap <strong>"Add"</strong> in the top right corner
                </span>
              </li>
              <li className="flex">
                <span className="font-bold text-brand-blue-600 mr-3">5.</span>
                <span>
                  Find the Elevate icon on your home screen and tap to open
                </span>
              </li>
            </ol>
          </div>

          {/* Android Instructions */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-lg md:text-lg font-bold mb-6 text-black flex items-center">
              <span className="text-3xl mr-3">🤖</span>
              Android (Chrome)
            </h3>
            <ol className="space-y-4 text-black">
              <li className="flex">
                <span className="font-bold text-brand-green-600 mr-3">1.</span>
                <span>
                  Open <strong>www.elevateforhumanity.org</strong> in Chrome
                </span>
              </li>
              <li className="flex">
                <span className="font-bold text-brand-green-600 mr-3">2.</span>
                <span>
                  Tap the <strong>three dots menu</strong> in the top right
                </span>
              </li>
              <li className="flex">
                <span className="font-bold text-brand-green-600 mr-3">3.</span>
                <span>
                  Tap <strong>"Add to Home screen"</strong> or{' '}
                  <strong>"Install app"</strong>
                </span>
              </li>
              <li className="flex">
                <span className="font-bold text-brand-green-600 mr-3">4.</span>
                <span>
                  Tap <strong>"Install"</strong> or <strong>"Add"</strong>
                </span>
              </li>
              <li className="flex">
                <span className="font-bold text-brand-green-600 mr-3">5.</span>
                <span>
                  Find the Elevate icon in your app drawer and tap to open
                </span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-base md:text-lg mb-8 text-brand-blue-100">
            Install the app now and take your career development journey with
            you wherever you go.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#install"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              View Installation Guide
            </a>
            <Link
              href="/contact"
              className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors border-2 border-white"
            >
              Need Help?
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
