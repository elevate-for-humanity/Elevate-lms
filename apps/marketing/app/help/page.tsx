export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { HelpCircle, MessageCircle, Mail, Phone, Book, Video } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Help & Support | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Get help with enrollment, programs, funding, and more.',
};

const FAQ_TOPICS = [
  {
    title: 'Enrollment & Programs',
    questions: [
      'How do I apply for a program?',
      'What programs are available?',
      'How long do programs take?',
    ],
  },
  {
    title: 'Funding & Payments',
    questions: [
      'How do I get funding assistance?',
      'What funding options are available?',
      'Do you accept WIOA funding?',
    ],
  },
  {
    title: 'Technical Support',
    questions: [
      'How do I access the LMS?',
      'I forgot my password',
      'How do I reset my account?',
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Help & Support</h1>
          <p className="text-xl text-blue-100">Get the support you need to succeed with your training.
            We're here to help you succeed. Find answers or contact us.
          </p>
        </div>
      </section>
      
      {/* Contact Options */}
      <section className="py-12 px-6 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Contact Us</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <a href="mailto:help@elevateforhumanity.org" className="flex flex-col items-center p-6 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
              <Mail className="w-10 h-10 text-blue-600 mb-3" />
              <h3 className="font-bold mb-1">Email Support</h3>
              <p className="text-sm text-slate-500">help@elevateforhumanity.org</p>
            </a>
            <a href="tel:+13173141234" className="flex flex-col items-center p-6 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
              <Phone className="w-10 h-10 text-blue-600 mb-3" />
              <h3 className="font-bold mb-1">Call Us</h3>
              <p className="text-sm text-slate-500">(317) 314-3757</p>
            </a>
            <div className="flex flex-col items-center p-6 bg-slate-50 rounded-xl">
              <MessageCircle className="w-10 h-10 text-blue-600 mb-3" />
              <h3 className="font-bold mb-1">Chat</h3>
              <p className="text-sm text-slate-500">Available 8am-5pm EST</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-8">
            {FAQ_TOPICS.map((topic) => (
              <div key={topic.title} className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  {topic.title}
                </h3>
                <ul className="space-y-2">
                  {topic.questions.map((q) => (
                    <li key={q} className="flex items-start gap-2 text-slate-600">
                      <span className="text-blue-600">•</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

