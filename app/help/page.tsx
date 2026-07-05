import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Phone, MessageCircle, Book, HelpCircle, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help & Support | Elevate for Humanity',
  description: 'Get help with your application, funding, programs, and more.',
};

const faqs = [
  { q: 'How do I apply for a program?', a: 'Click the Apply button on any program page, or visit our /apply page to get started. You can check your funding eligibility at the same time.' },
  { q: 'How does WIOA funding work?', a: 'WIOA (Workforce Innovation and Opportunity Act) is federal funding that covers tuition, books, and support services for eligible participants. Visit /funding/wioa for details.' },
  { q: 'What programs are available?', a: 'We offer programs in healthcare (CNA, Medical Assistant, Phlebotomy), skilled trades (HVAC, Electrical, CDL), and beauty (Barber, Cosmetology apprenticeships). See /programs for all options.' },
  { q: 'How long do programs take?', a: 'Program length varies: CNA is 3-6 weeks, HVAC is 8-12 weeks, apprenticeships are 12-18 months. Each program page has specific duration information.' },
  { q: 'Can I get funding if I am already employed?', a: 'Yes. WIOA funding is available for employed workers who are underemployed or need skills upgrades. Contact us to discuss your situation.' },
  { q: 'What is a registered apprenticeship?', a: 'A registered apprenticeship is a DOL-approved program where you earn wages while learning. You work at an employer and attend classes. Visit /funding/dol for details.' },
];

const contactOptions = [
  { icon: Phone, title: 'Call Us', desc: 'Speak with an advisor', href: '/contact', color: 'bg-brand-blue-100 text-brand-blue-600' },
  { icon: Mail, title: 'Email Us', desc: 'info@elevateforhumanity.org', href: 'mailto:info@elevateforhumanity.org', color: 'bg-green-100 text-green-600' },
  { icon: MessageCircle, title: 'Live Chat', desc: 'Chat with our team', href: '/contact', color: 'bg-purple-100 text-purple-600' },
  { icon: Book, title: 'Knowledge Base', desc: 'Browse articles', href: '/resources', color: 'bg-amber-100 text-amber-600' },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Help & Support</h1>
          <p className="text-xl text-blue-100">Find answers to common questions or contact our team.</p>
        </div>
      </section>

      {/* Quick Contact */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Get in Touch</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {contactOptions.map((opt) => (
              <Link key={opt.title} href={opt.href} className="bg-white rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                <opt.icon className={`w-10 h-10 mx-auto mb-3 ${opt.color.split(' ')[1]} ${opt.color.split(' ')[0]}`} />
                <p className="font-semibold text-gray-900">{opt.title}</p>
                <p className="text-sm text-gray-600">{opt.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-2 flex items-start gap-2">
                  <HelpCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  {faq.q}
                </h3>
                <p className="text-gray-600 pl-7">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Helpful Resources</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/funding" className="bg-white rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-gray-900 mb-2">Funding Guide</h3>
              <p className="text-sm text-gray-600">Learn about WIOA, WRG, and other funding options.</p>
            </Link>
            <Link href="/programs" className="bg-white rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-gray-900 mb-2">Programs</h3>
              <p className="text-sm text-gray-600">Browse all available training programs.</p>
            </Link>
            <Link href="/success-stories" className="bg-white rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-gray-900 mb-2">Success Stories</h3>
              <p className="text-sm text-gray-600">Read about students who transformed their careers.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-blue-100 mb-8">Our team is here to answer your questions.</p>
          <Link href="/contact" className="inline-block px-8 py-4 bg-white text-brand-blue-700 font-bold rounded-lg hover:bg-blue-50">
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
