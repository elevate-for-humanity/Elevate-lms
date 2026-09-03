import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Monitor, Wifi, Download, Lock, RefreshCw, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Technical Help | Elevate for Humanity',
  description: 'Get help with technical issues, browser settings, and platform requirements.',
};

const topics = [
  { icon: Monitor, title: 'Browser Requirements', description: 'Supported browsers and settings.', articles: 5, href: '/help/technical' },
  { icon: Wifi, title: 'Internet Connection', description: 'Troubleshooting connection issues.', articles: 4, href: '/help/technical' },
  { icon: Download, title: 'App Installation', description: 'Installing the mobile or desktop app.', articles: 6, href: '/help/technical' },
  { icon: Lock, title: 'Security Settings', description: 'Firewall, pop-ups, and permissions.', articles: 3, href: '/help/technical' },
  { icon: RefreshCw, title: 'Clear Cache', description: 'How to clear your browser cache.', articles: 2, href: '/help/technical' },
  { icon: HelpCircle, title: 'General Troubleshooting', description: 'Common issues and solutions.', articles: 8, href: '/help/technical' },
];

export default function TechnicalHelpPage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Help', href: '/help' }, { label: 'Technical' }]} />
      
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Technical Help</h1>
          <p className="text-blue-100">Get help with browser settings, connection issues, and platform requirements.</p>
        </div>
      </section>

      {/* Topics */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((topic) => (
              <Link key={topic.title} href={topic.href} className="group bg-slate-50 border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-brand-blue-300 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-blue-600 transition-colors">
                    <topic.icon className="w-6 h-6 text-brand-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black group-hover:text-brand-blue-700 transition-colors">{topic.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{topic.description}</p>
                    <p className="text-xs text-slate-400 mt-2">{topic.articles} articles</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-black mb-4">Still experiencing technical issues?</h2>
          <p className="text-slate-600 mb-6">Our technical support team can help diagnose and resolve platform issues.</p>
          <Link href="/support/contact?topic=technical" className="inline-block bg-brand-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-blue-700">
            Contact Technical Support
          </Link>
        </div>
      </section>
    </div>
  );
}
