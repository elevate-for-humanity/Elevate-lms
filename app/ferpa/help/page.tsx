import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ChevronRight,
  HelpCircle,
  Book,
  MessageCircle,
  Phone,
  Mail,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help & Resources | FERPA Portal',
  description: 'Get help with FERPA compliance and student privacy.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function FerpaHelpPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Database connection failed.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/ferpa/help');

  const faqs = [
    {
      question: 'What is FERPA?',
      answer: 'FERPA (Family Educational Rights and Privacy Act) is a federal law that protects the privacy of student education records. It applies to all schools that receive funds from the U.S. Department of Education.',
    },
    {
      question: 'Who can access student records?',
      answer: 'Generally, schools must have written permission from the student (or parent if under 18) to release any information from a student\'s education record. However, FERPA allows schools to disclose records without consent to school officials with legitimate educational interest, other schools to which a student is transferring, and certain other parties under specific conditions.',
    },
    {
      question: 'What is directory information?',
      answer: 'Directory information is information that is generally not considered harmful if disclosed. It may include name, address, telephone number, email, date of birth, enrollment status, and similar information. Students can opt out of directory information disclosure.',
    },
    {
      question: 'How long do we have to respond to a records request?',
      answer: 'Under FERPA, schools must provide access to education records within 45 days of receiving a request. However, best practice is to respond as quickly as possible.',
    },
    {
      question: 'What training is required for staff?',
      answer: 'All staff members who have access to student education records should receive FERPA training. This includes understanding what constitutes an education record, who can access records, and how to properly handle and protect student information.',
    },
    {
      question: 'How do I report a FERPA violation?',
      answer: 'If you believe there has been a FERPA violation, report it immediately to the FERPA Officer or administration. Violations can also be reported to the U.S. Department of Education\'s Student Privacy Policy Office.',
    },
  ];

  const resources = [
    {
      title: 'FERPA Training Course',
      description: 'Complete the required annual FERPA training',
      link: '/ferpa/training',
      icon: Book,
    },
    {
      title: 'Policy Documents',
      description: 'Access FERPA policies and procedures',
      link: '/ferpa/documentation',
      icon: Book,
    },
    {
      title: 'Submit a Request',
      description: 'Process a records access request',
      link: '/ferpa/requests/new',
      icon: MessageCircle,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/ferpa" className="hover:text-gray-700">FERPA Portal</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Help</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Help & Resources</h1>
          <p className="text-gray-600 mt-1">Get help with FERPA compliance</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Links */}
            <div className="grid sm:grid-cols-3 gap-4">
              {resources.map((resource, index) => {
                const Icon = resource.icon;
                return (
                  <Link
                    key={index}
                    href={resource.link}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <Icon className="w-6 h-6 text-brand-blue-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">{resource.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
                  </Link>
                );
              })}
            </div>

            {/* FAQs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {faqs.map((faq, index) => (
                  <details key={index} className="group">
                    <summary className="px-6 py-4 cursor-pointer flex items-center justify-between hover:bg-gray-50">
                      <span className="font-medium text-gray-900">{faq.question}</span>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-gray-600">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact FERPA Officer</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a href="/contact" className="text-brand-blue-600 hover:text-brand-blue-700">
                      our contact form
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-brand-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <a href="/support" className="text-brand-blue-600 hover:text-brand-blue-700">
                      Get Help Online
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* External Resources */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">External Resources</h2>
              <div className="space-y-3">
                <a
                  href="https://studentprivacy.ed.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-sm text-brand-blue-600 hover:text-brand-blue-700"
                >
                  Student Privacy Policy Office
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href="https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-sm text-brand-blue-600 hover:text-brand-blue-700"
                >
                  FERPA Regulations
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href="https://studentprivacy.ed.gov/training"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-sm text-brand-blue-600 hover:text-brand-blue-700"
                >
                  Federal Training Resources
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Emergency */}
            <div className="bg-brand-red-50 border border-brand-red-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-brand-red-800 mb-2">Report a Violation</h2>
              <p className="text-sm text-brand-red-700 mb-4">
                If you suspect a FERPA violation or data breach, report it immediately.
              </p>
              <Link
                href="/support/ticket?type=ferpa-violation"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red-600 text-white rounded-lg hover:bg-brand-red-700 text-sm"
              >
                <HelpCircle className="w-4 h-4" />
                Report Violation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
