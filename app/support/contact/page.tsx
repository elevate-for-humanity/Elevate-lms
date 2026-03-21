import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Clock, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/support/contact' },
  title: 'Contact Support | Elevate For Humanity',
  description: 'Contact our support team for help with enrollment, programs, technical issues, or general questions.',
};

const CONTACT_METHODS = [
  { title: 'Email', desc: 'our contact form', detail: 'Response within 1 business day', icon: Mail, href: 'mailto:our contact form' },
  { title: 'Phone', desc: '(317) 314-3757', detail: 'Mon–Fri, 9 AM – 5 PM EST', icon: Phone, href: 'tel:+13173143757' },
  { title: 'Location', desc: 'Indianapolis, Indiana', detail: 'By appointment only', icon: MapPin, href: '/contact' },
];

const HELP_TOPICS = [
  { title: 'Enrollment & Eligibility', desc: 'Questions about applying, eligibility requirements, or funding options.', href: '/enroll' },
  { title: 'Technical Support', desc: 'Issues with your student portal, login, or course access.', href: '/support' },
  { title: 'Program Information', desc: 'Details about specific training programs, schedules, or certifications.', href: '/programs' },
  { title: 'Billing & Payments', desc: 'Questions about tuition, payment plans, or funding status.', href: '/account/billing' },
  { title: 'Career Services', desc: 'Job placement, resume help, or employer connections.', href: '/career-services' },
  { title: 'Grievance or Complaint', desc: 'File a formal grievance or report a concern.', href: '/grievance' },
];

export default function SupportContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Support', href: '/support' }, { label: 'Contact' }]} />
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image src="/images/pages/support-page-1.jpg" alt="Contact support" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Contact Support</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">We are here to help. Reach out through any of the channels below.</p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {CONTACT_METHODS.map((m) => {
              const Icon = m.icon;
              return (
                <a key={m.title} href={m.href} className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-md hover:border-brand-blue-300 transition-all group">
                  <Icon className="w-8 h-8 text-brand-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{m.title}</h3>
                  <p className="text-brand-blue-600 font-medium mb-1">{m.desc}</p>
                  <p className="text-gray-500 text-sm">{m.detail}</p>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Help Topics */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="w-7 h-7 text-brand-blue-600" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">What Do You Need Help With?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {HELP_TOPICS.map((t) => (
              <Link key={t.title} href={t.href} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm hover:border-brand-blue-300 transition-all">
                <h3 className="font-bold text-gray-900 mb-1">{t.title}</h3>
                <p className="text-gray-600 text-sm">{t.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Hours */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Clock className="w-8 h-8 text-brand-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-4">Support Hours</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6 inline-block">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <span className="text-gray-600 text-right">Monday – Friday</span>
              <span className="font-medium text-gray-900 text-left">9:00 AM – 5:00 PM EST</span>
              <span className="text-gray-600 text-right">Saturday – Sunday</span>
              <span className="font-medium text-gray-900 text-left">Closed</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
