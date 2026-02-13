import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { 
  Smartphone, Download, Star, Shield, Bell, 
  Wifi, Clock, CheckCircle, Apple, Play
} from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/app-hub',
  },
  title: 'Mobile Apps | Elevate For Humanity',
  description: 'Download our mobile apps for iOS and Android. Access your courses, track progress, and learn on the go.',
};

const appFeatures = [
  {
    icon: Wifi,
    title: 'Offline Learning',
    description: 'Download courses and learn without internet connection',
  },
  {
    icon: Bell,
    title: 'Push Notifications',
    description: 'Stay updated on deadlines, new courses, and achievements',
  },
  {
    icon: Clock,
    title: 'Progress Sync',
    description: 'Your progress syncs across all devices automatically',
  },
  {
    icon: Shield,
    title: 'Secure Access',
    description: 'Biometric login and encrypted data protection',
  },
];

const apps = [
  {
    name: 'Elevate LMS',
    description: 'Access all your courses and track your learning progress',
    icon: '📚',
    rating: 4.8,
    downloads: '10K+',
    platforms: ['ios', 'android'],
  },
  {
    name: 'Barber Apprentice',
    description: 'Log hours, track skills, and manage your apprenticeship',
    icon: '✂️',
    rating: 4.9,
    downloads: '5K+',
    platforms: ['ios', 'android'],
  },
  {
    name: 'SupersonicFastCash',
    description: 'Track your tax refund and manage documents',
    icon: '💰',
    rating: 4.7,
    downloads: '15K+',
    platforms: ['ios', 'android'],
  },
];

export default function AppHubPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Mobile Apps' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Learn Anywhere, Anytime
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                Download our mobile apps and take your learning with you. 
                Access courses, track progress, and achieve your goals on the go.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-xl cursor-not-allowed opacity-75"
                  title="iOS app launching soon - join waitlist at elevateforhumanity.org/contact"
                >
                  <Apple className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-xs">iOS App</div>
                    <div className="font-semibold">Launching Soon</div>
                  </div>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-xl cursor-not-allowed opacity-75"
                  title="Android app launching soon - join waitlist at elevateforhumanity.org/contact"
                >
                  <Play className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-xs">Android App</div>
                    <div className="font-semibold">Launching Soon</div>
                  </div>
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-64 h-[500px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                  <div className="w-full h-full bg-blue-500 rounded-[2.5rem] flex items-center justify-center">
                    <Smartphone className="w-24 h-24 text-white/50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">App Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {appFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border text-center">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apps */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Apps</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {apps.map((app, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-6 border">
                <div className="text-5xl mb-4">{app.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{app.name}</h3>
                <p className="text-gray-600 mb-4">{app.description}</p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{app.rating}</span>
                  </div>
                  <div className="text-gray-500 text-sm">{app.downloads} downloads</div>
                </div>
                <div className="flex gap-2">
                  {app.platforms.includes('ios') && (
                    <span className="flex-1 flex items-center justify-center gap-2 bg-gray-400 text-white py-2 rounded-lg text-sm cursor-not-allowed" title="Launching soon">
                      <Apple className="w-4 h-4" /> Soon
                    </span>
                  )}
                  {app.platforms.includes('android') && (
                    <span className="flex-1 flex items-center justify-center gap-2 bg-gray-400 text-white py-2 rounded-lg text-sm cursor-not-allowed" title="Launching soon">
                      <Play className="w-4 h-4" /> Soon
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Learning Today</h2>
          <p className="text-gray-300 mb-8">
            Download our app and access free training programs on your mobile device.
          </p>
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors"
          >
            Browse Programs
          </Link>
        </div>
      </section>
    </div>
  );
}
