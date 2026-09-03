import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Phone, MapPin, Users, Building2, GraduationCap, Clock, Send } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Workforce Inquiry',
  description:
    'Submit a workforce development inquiry for your organization. We partner with employers, workforce boards, training providers, and agencies across Indiana.',
  robots: {
    index: false, // Complete the page content before indexing
    follow: true,
  },
};

const inquiryTypes = [
  {
    icon: Users,
    title: 'Employer Partnership',
    description: 'Hire trained graduates, sponsor apprenticeships, or participate in on-the-job training reimbursement.',
    href: '/apply/employer',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Building2,
    title: 'Workforce Agency',
    description: 'Refer participants, access WIOA funding, or partner on workforce development initiatives.',
    href: '/apply/employer',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: GraduationCap,
    title: 'Training Provider',
    description: 'Join our network of credentialed training providers and expand your program reach.',
    href: '/apply/program-holder',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: MapPin,
    title: 'Host Shop',
    description: 'Host beauty apprentices (barber, cosmetology) in your salon or barbershop.',
    href: '/apply/barber',
    color: 'bg-amber-100 text-amber-600',
  },
];

export default function InquiryPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-800 to-brand-blue-900 text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-brand-red-300 font-semibold uppercase tracking-wider text-sm mb-3">
            Partnership Inquiries
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
            Workforce Development Partnerships
          </h1>
          <p className="text-blue-100 text-lg md:text-xl leading-relaxed max-w-2xl mb-8">
            We partner with employers, workforce development agencies, training providers,
            and community organizations across Indiana to build a stronger workforce pipeline.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="tel:+13173143757"
              className="inline-flex items-center gap-2 bg-white text-brand-blue-800 font-bold py-3 px-6 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Phone className="w-4 h-4" />
              (317) 314-3757
            </a>
            <a
              href="mailto:partnerships@elevateforhumanity.org"
              className="inline-flex items-center gap-2 bg-brand-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-red-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email Us
            </a>
          </div>
        </div>
      </section>

      {/* Inquiry Types */}
      <section className="py-16 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">How Can We Help?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {inquiryTypes.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex gap-4 p-6 bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-brand-blue-200 transition-all"
                >
                  <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1 group-hover:text-brand-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Other Ways to Reach Us
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center border border-slate-200">
              <Mail className="w-8 h-8 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 mb-1">Email</h3>
              <p className="text-slate-600 text-sm mb-2">Response within 24 hours</p>
              <a href="mailto:info@elevateforhumanity.org" className="text-brand-blue-600 text-sm font-semibold hover:underline">
                info@elevateforhumanity.org
              </a>
            </div>
            <div className="bg-white rounded-xl p-6 text-center border border-slate-200">
              <Phone className="w-8 h-8 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 mb-1">Phone</h3>
              <p className="text-slate-600 text-sm mb-2">Mon–Fri, 8am–6pm ET</p>
              <a href="tel:+13173143757" className="text-brand-blue-600 text-sm font-semibold hover:underline">
                (317) 314-3757
              </a>
            </div>
            <div className="bg-white rounded-xl p-6 text-center border border-slate-200">
              <Clock className="w-8 h-8 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 mb-1">Response Time</h3>
              <p className="text-slate-600 text-sm mb-2">Typically within 24 hours</p>
              <span className="text-slate-500 text-sm">Business days only</span>
            </div>
          </div>
        </div>
      </section>

      {/* Back home */}
      <section className="py-8 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="text-brand-blue-600 font-semibold hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}
