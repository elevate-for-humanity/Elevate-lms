import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  HelpCircle, Search, Book, MessageCircle, Ticket,
  Video, Phone, Mail, ExternalLink, ChevronRight,
  Users, Settings, CreditCard, FileText, Lock,
  Clock, CheckCircle, ArrowRight, AlertCircle, Play
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help Center',
  keywords: ["support", "help", "FAQ", "knowledge base", "tickets", "documentation"],
  description: 'Get help with Elevate. Browse our knowledge base, watch training videos, or submit a support ticket.',
};

// Support capabilities - set to true only when features are implemented
const supportCapabilities = {
  liveChat: false,
  nativeMobileApps: false,
  publicApi: false,
  enterpriseSla: false,
};

const categories = [
  {
    category: 'Getting Started',
    icon: Play,
    color: 'bg-green-100 text-green-600',
    topics: ['Platform Overview', 'Account Setup', 'First Steps', 'Basic Navigation']
  },
  {
    category: 'Student Management',
    icon: Users,
    color: 'bg-blue-100 text-blue-600',
    topics: ['Enrolling Students', 'Tracking Progress', 'Managing Attendance', 'Credentials']
  },
  {
    category: 'Apprenticeship',
    icon: FileText,
    color: 'bg-purple-100 text-purple-600',
    topics: ['OJL Logging', 'RTI Tracking', 'Competency Verification', 'Host Shop Setup']
  },
  {
    category: 'Billing & Payments',
    icon: CreditCard,
    color: 'bg-amber-100 text-amber-600',
    topics: ['Payment Processing', 'Invoicing', 'Refunds', 'Funding Sources']
  },
  {
    category: 'Account & Security',
    icon: Lock,
    color: 'bg-red-100 text-red-600',
    topics: ['Password Reset', 'MFA Setup', 'Permissions', 'Audit Logs']
  },
  {
    category: 'Integrations',
    icon: Settings,
    color: 'bg-slate-100 text-slate-600',
    topics: ['Stripe Setup', 'Calendar Sync', 'Email Integration', 'API Access']
  }
];

const faqs = [
  {
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page. Enter your email address and we\'ll send you a reset link. The link expires after 24 hours.'
  },
  {
    question: 'How long does it take to get a response to support tickets?',
    answer: 'Our standard response time is within 24 hours during business days (Monday-Friday, 8am-6pm EST).'
  },
  {
    question: 'How do I enroll a new student?',
    answer: 'Navigate to the Students section and click "Add Student." Fill in the required information and the student will receive an invitation email.'
  },
  {
    question: 'Can I import students from a CSV file?',
    answer: 'Yes. Go to Students > Import and upload your CSV file. We support standard formats with required fields for name and email.'
  },
  {
    question: 'How do I process a refund?',
    answer: 'Go to Billing > Transactions, find the payment, and click "Issue Refund." Follow the prompts to process full or partial refunds.'
  },
  {
    question: 'How do I generate compliance reports?',
    answer: 'Navigate to Reports > Compliance. Select your date range and program. You can export to PDF or CSV format.'
  }
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 via-brand-blue-800 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">How can we help?</h1>
            <p className="text-xl text-blue-100 mb-8">
              Browse our help center, search documentation, or contact our support team.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Link href="/help" className="rounded-xl bg-white px-5 py-3 font-bold text-brand-blue-800 hover:bg-blue-50">Browse help topics</Link>
              <Link href="/support/ticket" className="rounded-xl border border-blue-300 px-5 py-3 font-bold text-white hover:bg-white/10">Submit a support ticket</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Browse by Topic</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className={`w-12 h-12 ${cat.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{cat.category}</h3>
                  <ul className="space-y-2">
                    {cat.topics.map((topic, j) => (
                      <li key={j}>
                        <Link href="/help" className="text-slate-600 hover:text-brand-blue-600 text-sm flex items-center gap-1">
                          <ChevronRight className="w-4 h-4" />
                          {topic}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Contact Support</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center">
              <Mail className="w-10 h-10 text-brand-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Email Support</h3>
              <p className="text-slate-600 text-sm mb-4">Goal: response within one business day</p>
              <Link href="/contact" className="text-brand-blue-600 font-semibold hover:underline">
                Send Email →
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 text-center">
              <Phone className="w-10 h-10 text-brand-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Phone Support</h3>
              <p className="text-slate-600 text-sm mb-4">Mon–Fri, 8am–6pm ET</p>
              <a href="tel:+13173143757" className="text-brand-blue-600 font-semibold hover:underline">
                (317) 314-3757
              </a>
            </div>

            <div className="bg-white rounded-xl p-6 text-center">
              <Book className="w-10 h-10 text-brand-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Documentation</h3>
              <p className="text-slate-600 text-sm mb-4">Browse guides and tutorials</p>
              <Link href="/help" className="text-brand-blue-600 font-semibold hover:underline">
                View Docs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 mb-2">{faq.question}</h3>
                <p className="text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/faq" className="text-brand-blue-600 font-semibold hover:underline">
              View all FAQs →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
