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
  title: 'Help Center | Elevate for Humanity',
  keywords: ["support", "help", "FAQ", "knowledge base", "tickets", "documentation"],
  description: 'Get help with Elevate. Browse our knowledge base, watch training videos, or submit a support ticket.',
};

const categories = [
  {
    category: 'Getting Started',
    icon: Play,
    color: 'bg-green-100 text-green-600',
    articles: 12,
    topics: ['Platform Overview', 'Account Setup', 'First Steps', 'Basic Navigation']
  },
  {
    category: 'Student Management',
    icon: Users,
    color: 'bg-blue-100 text-blue-600',
    articles: 18,
    topics: ['Enrolling Students', 'Tracking Progress', 'Managing Attendance', 'Credentials']
  },
  {
    category: 'Apprenticeship',
    icon: FileText,
    color: 'bg-purple-100 text-purple-600',
    articles: 15,
    topics: ['OJL Logging', 'RTI Tracking', 'Competency Verification', 'Host Shop Setup']
  },
  {
    category: 'Billing & Payments',
    icon: CreditCard,
    color: 'bg-amber-100 text-amber-600',
    articles: 8,
    topics: ['Payment Processing', 'Invoicing', 'Refunds', 'Funding Sources']
  },
  {
    category: 'Account & Security',
    icon: Lock,
    color: 'bg-red-100 text-red-600',
    articles: 10,
    topics: ['Password Reset', 'MFA Setup', 'Permissions', 'Audit Logs']
  },
  {
    category: 'Integrations',
    icon: Settings,
    color: 'bg-slate-100 text-slate-600',
    articles: 14,
    topics: ['Stripe Setup', 'Calendar Sync', 'Email Integration', 'API Access']
  }
];

const popularArticles = [
  { title: 'How to Enroll a New Student', views: '12.5K', category: 'Student Management' },
  { title: 'Setting Up Multi-Factor Authentication', views: '8.2K', category: 'Account & Security' },
  { title: 'Creating Your First Program', views: '7.8K', category: 'Getting Started' },
  { title: 'Logging On-the-Job Learning Hours', views: '6.4K', category: 'Apprenticeship' },
  { title: 'Processing Student Payments', views: '5.9K', category: 'Billing & Payments' },
  { title: 'Generating Compliance Reports', views: '5.1K', category: 'Student Management' },
];

const faqs = [
  {
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page. Enter your email address and we\'ll send you a reset link. The link expires after 24 hours.'
  },
  {
    question: 'How long does it take to get a response to support tickets?',
    answer: 'Our standard response time is within 24 hours during business days (Monday-Friday, 8am-6pm EST). Enterprise customers receive priority support with 4-hour response times.'
  },
  {
    question: 'Can I import existing student data?',
    answer: 'Yes! You can import students via CSV upload or use our API. We recommend using our template for the best results. Contact support for assistance with bulk imports.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), ACH transfers, and wire transfers for annual Enterprise plans.'
  },
  {
    question: 'How do I add a new staff member?',
    answer: 'Go to Settings > Users > Add New User. Enter their email address and assign their role. They\'ll receive an invitation email to set up their account.'
  },
  {
    question: 'Is there a mobile app?',
    answer: 'Yes! Students and instructors can access the platform via our mobile app (iOS and Android). Admin features are optimized for tablet use on mobile devices.'
  }
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="/images/pages/support-hero.webp" alt="Customer support - Elevate for Humanity" fill className="object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <HelpCircle className="w-4 h-4" />
              Help Center
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              How Can We Help?
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Search our knowledge base, browse training videos, or contact our support team.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search for help articles, guides, and more..."
                  className="w-full pl-14 pr-32 py-4 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-brand-orange-500/50"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-12 bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/support/ticket" className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Ticket className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Submit a Ticket</h3>
                <p className="text-slate-600 text-sm">Get help from our support team</p>
                <p className="text-brand-blue-600 text-sm font-medium mt-2 flex items-center gap-1">
                  Response in 24hrs <ChevronRight className="w-4 h-4" />
                </p>
              </div>
            </Link>

            <Link href="/support/chat" className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Live Chat</h3>
                <p className="text-slate-600 text-sm">Chat with our support team</p>
                <p className="text-green-600 text-sm font-medium mt-2 flex items-center gap-1">
                  Available now <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </p>
              </div>
            </Link>

            <Link href="tel:+13173140123" className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Call Support</h3>
                <p className="text-slate-600 text-sm">Speak with our team directly</p>
                <p className="text-amber-600 text-sm font-medium mt-2 flex items-center gap-1">
                  (317) 314-3757 <ChevronRight className="w-4 h-4" />
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Browse by Category
            </h2>
            <p className="text-xl text-slate-600">
              Find answers organized by topic
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Link 
                key={index}
                href={`/support/help?category=${category.category.toLowerCase().replace(/\s+/g, '-')}`}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl hover:border-brand-blue-200 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 ${category.color} rounded-xl flex items-center justify-center`}>
                    <category.icon className="w-7 h-7" />
                  </div>
                  <span className="text-sm text-slate-500">{category.articles} articles</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-brand-blue-600 transition-colors">
                  {category.category}
                </h3>
                <ul className="space-y-1">
                  {category.topics.slice(0, 3).map((topic, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/support/help" className="inline-flex items-center text-brand-blue-600 hover:text-brand-blue-700 font-medium">
              View All Categories <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                Popular Articles
              </h2>
              <p className="text-slate-600">Most viewed help articles this month</p>
            </div>
            <Link href="/support/help" className="hidden md:inline-flex items-center text-brand-blue-600 hover:text-brand-blue-700 font-medium">
              View All <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularArticles.map((article, index) => (
              <Link 
                key={index}
                href={`/support/help/${article.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-brand-blue-200 transition-all"
              >
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                  <Book className="w-4 h-4" />
                  {article.category}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 hover:text-brand-blue-600 transition-colors">
                  {article.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users className="w-4 h-4" />
                  {article.views} views
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600">
              Quick answers to common questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details 
                key={index}
                className="bg-white rounded-xl border border-slate-100 overflow-hidden group"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50">
                  <h3 className="font-bold text-slate-900 pr-4">{faq.question}</h3>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-6 pb-6">
                  <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/support/help" className="inline-flex items-center text-brand-blue-600 hover:text-brand-blue-700 font-medium">
              View All FAQs <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Training Videos */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Training Videos
            </h2>
            <p className="text-xl text-slate-600">
              Step-by-step video tutorials
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="relative h-48 bg-slate-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-brand-blue-600 ml-1" />
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  5:30
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-slate-900 mb-2">Platform Overview</h3>
                <p className="text-slate-600 text-sm">Introduction to Elevate features and navigation.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="relative h-48 bg-slate-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-brand-blue-600 ml-1" />
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  8:45
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-slate-900 mb-2">Enrolling Students</h3>
                <p className="text-slate-600 text-sm">Learn how to add and manage student records.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="relative h-48 bg-slate-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-brand-blue-600 ml-1" />
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  12:20
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-slate-900 mb-2">Apprenticeship Tracking</h3>
                <p className="text-slate-600 text-sm">Setting up and logging apprenticeship hours.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/support/videos" className="inline-flex items-center text-brand-blue-600 hover:text-brand-blue-700 font-medium">
              View Video Library <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* System Status */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium text-slate-900">All Systems Operational</span>
            </div>
            <Link href="/status" className="text-brand-blue-600 hover:text-brand-blue-700 font-medium flex items-center gap-2">
              View Detailed Status <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Still Need Help?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Our support team is here to help you succeed. Submit a ticket and we'll get back to you within 24 hours.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/support/ticket" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Submit a Ticket <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/support/contact" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

