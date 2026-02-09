import { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, MessageSquare, Phone, Mail, FileText, Video } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = { title: 'Student Support | Elevate for Humanity' };

export default function StudentSupportPage() {
  const supportOptions = [
    { icon: MessageSquare, title: 'Live Chat', description: 'Chat with a support agent', action: 'Start Chat', href: '/support/chat' },
    { icon: Phone, title: 'Phone Support', description: 'Call (317) 314-3757', action: 'Get Started', href: 'tel:317-314-3757' },
    { icon: Mail, title: 'Email Support', description: 'elevate4humanityedu@gmail.com', action: 'Send Email', href: 'mailto:elevate4humanityedu@gmail.com' },
    { icon: FileText, title: 'Help Articles', description: 'Browse our knowledge base', action: 'View Articles', href: '/help' },
  ];

  const faqs = [
    { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page and follow the instructions sent to your email.' },
    { q: 'How do I access my courses?', a: 'Log in to your student portal and click on "My Courses" to see all enrolled courses.' },
    { q: 'Who do I contact about financial aid?', a: 'Contact our financial aid office at elevate4humanityedu@gmail.com or call (317) 314-3757.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Student', href: '/student' }, { label: 'Support' }]} />
        </div>
      </div>

      <div className="bg-blue-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h1 className="text-3xl font-bold mb-2">Student Support</h1>
          <p className="text-blue-100">We are here to help you succeed</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {supportOptions.map((option, i) => (
            <Link key={i} href={option.href} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition text-center">
              <option.icon className="w-10 h-10 text-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-1">{option.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{option.description}</p>
              <span className="text-blue-600 font-medium">{option.action} →</span>
            </Link>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b pb-4">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
