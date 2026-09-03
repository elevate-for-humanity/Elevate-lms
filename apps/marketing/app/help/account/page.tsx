import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { User, Mail, Lock, CreditCard, Bell, Shield, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Account Help | Elevate for Humanity',
  description: 'Help and support for your Elevate account.',
};

const topics = [
  { icon: User, title: 'Managing Your Profile', articles: 8, href: '/help/account' },
  { icon: Mail, title: 'Email & Notifications', articles: 5, href: '/help/account' },
  { icon: Lock, title: 'Password & Security', articles: 6, href: '/help/account' },
  { icon: CreditCard, title: 'Billing & Payments', articles: 10, href: '/help/account' },
  { icon: Bell, title: 'Notification Settings', articles: 4, href: '/help/account' },
  { icon: Shield, title: 'Privacy Settings', articles: 7, href: '/help/account' },
];

export default function AccountHelpPage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Help', href: '/help' }, { label: 'Account' }]} />
      
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Account Help</h1>
          <p className="text-blue-100">Find answers to common questions about managing your Elevate account.</p>
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
                    <p className="text-sm text-slate-500">{topic.articles} articles</p>
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
          <h2 className="text-xl font-bold text-black mb-4">Still need help?</h2>
          <p className="text-slate-600 mb-6">Contact our support team for personalized assistance.</p>
          <Link href="/support/contact" className="inline-block bg-brand-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-blue-700">
            Contact Support
          </Link>
        </div>
      </section>
    </div>
  );
}
