import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail,
  BookOpen,
  Video,
  FileText,
  Search,
  ChevronRight,
  Clock,
  PenSquare,
CheckCircle, } from 'lucide-react';
import { SupportForm } from './SupportForm';

export const metadata: Metadata = {
  title: 'Support | Student Portal',
  description: 'Get help with your courses, technical issues, or account questions.',
};

export const dynamic = 'force-dynamic';

const FAQ_ITEMS = [
  {
    question: 'How do I reset my password?',
    answer: 'Click on "Forgot Password" on the login page and enter your email. You\'ll receive a link to reset your password.',
  },
  {
    question: 'How do I access my course materials?',
    answer: 'Go to "My Courses" in the dashboard, select your course, and click on the lesson you want to access.',
  },
  {
    question: 'How do I submit an assignment?',
    answer: 'Navigate to the assignment page, upload your file or enter your response, and click "Submit".',
  },
  {
    question: 'How do I contact my instructor?',
    answer: 'Use the Messages feature to send a direct message to your instructor, or check the course page for office hours.',
  },
  {
    question: 'How do I download my certificate?',
    answer: 'Go to "Certificates" in your dashboard. Click on the certificate you want and select "Download".',
  },
];

const SUPPORT_CATEGORIES = [
  {
    title: 'Technical Support',
    description: 'Issues with login, video playback, or platform features',
    icon: HelpCircle,
    color: 'bg-brand-blue-100 text-brand-blue-600',
  },
  {
    title: 'Course Questions',
    description: 'Questions about course content, assignments, or grades',
    icon: BookOpen,
    color: 'bg-brand-green-100 text-brand-green-600',
  },
  {
    title: 'Account & Billing',
    description: 'Account settings, enrollment, or payment questions',
    icon: FileText,
    color: 'bg-brand-blue-100 text-brand-blue-600',
  },
  {
    title: 'Career Services',
    description: 'Job placement, resume help, or career guidance',
    icon: CheckCircle,
    color: 'bg-brand-orange-100 text-brand-orange-600',
  },
];

export default async function SupportPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Support" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let tickets: any[] = [];

  try {
    const { data: ticketData } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (ticketData) {
      tickets = ticketData;
    }
  } catch (error) {
    // Table may not exist
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Support" }]} />
        </div>
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">How Can We Help?</h1>
          <p className="text-slate-600">Search our help center or contact support</p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for help articles..."
              className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 text-lg"
            />
          </div>
        </div>

        {/* Support Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {SUPPORT_CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.title}
                className="bg-white rounded-xl p-6 border border-slate-200 hover:border-brand-blue-300 hover:shadow-md transition text-left"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${category.color}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{category.title}</h3>
                <p className="text-sm text-slate-600">{category.description}</p>
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* FAQ */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {FAQ_ITEMS.map((item, index) => (
                  <details key={index} className="group">
                    <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50">
                      <span className="font-medium text-slate-900">{item.question}</span>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="px-6 pb-6 text-slate-600">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-200">
                <Link href="/help" className="text-brand-blue-600 font-medium hover:text-brand-blue-700">
                  View All Help Articles →
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Options */}
          <div className="space-y-6">
            {/* Live Chat */}
            <div className="bg-brand-blue-600 rounded-2xl p-6 text-white">
              <MessageSquare className="w-10 h-10 mb-4 opacity-90" />
              <h3 className="text-xl font-bold mb-2">Live Chat</h3>
              <p className="text-brand-blue-100 mb-4">Chat with our support team in real-time.</p>
              <button className="w-full bg-white text-brand-blue-600 px-4 py-3 rounded-xl font-bold hover:bg-brand-blue-50 transition">
                Start Chat
              </button>
              <div className="flex items-center gap-2 mt-4 text-sm text-brand-blue-200">
                <Clock className="w-4 h-4" />
                <span>Available Mon-Fri, 9am-6pm EST</span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Other Ways to Reach Us</h3>
              <div className="space-y-4">
                <a href="/support" className="flex items-center gap-3 text-slate-600 hover:text-brand-blue-600">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Phone Support</div>
                    <div className="text-sm">Get Help Online</div>
                  </div>
                </a>
                <a href="mailto:info@elevateforhumanity.org" className="flex items-center gap-3 text-slate-600 hover:text-brand-blue-600">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Email Support</div>
                    <div className="text-sm">info@elevateforhumanity.org</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Submit Support Request */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <PenSquare className="w-5 h-5 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900">Submit a Request</h3>
              </div>
              <SupportForm />
            </div>

            {/* AI Tutor */}
            <div className="bg-brand-blue-50 rounded-2xl border border-brand-blue-200 p-6">
              <h3 className="font-bold text-brand-blue-900 mb-2">Need Course Help?</h3>
              <p className="text-sm text-brand-blue-800 mb-4">
                Our AI Tutor can help with course questions 24/7.
              </p>
              <Link
                href="/lms/ai-tutor"
                className="block w-full text-center bg-brand-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-brand-blue-700 transition"
              >
                Ask AI Tutor
              </Link>
            </div>

            {/* Recent Tickets */}
            {tickets.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4">Your Recent Tickets</h3>
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/lms/support/tickets/${ticket.id}`}
                      className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 truncate">{ticket.subject}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          ticket.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
                          ticket.status === 'resolved' ? 'bg-brand-green-100 text-brand-green-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
