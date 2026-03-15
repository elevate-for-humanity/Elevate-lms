import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import { LifeBuoy, MessageSquare, Phone, Mail, FileText, Clock } from 'lucide-react';
import SupportForm from '@/components/support/SupportForm';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LiveChatSupport } from '@/components/LiveChatSupport';

export const metadata: Metadata = {
  title: 'Support | Elevate For Humanity',
  description: 'Get help with your account, programs, or technical issues.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/support',
  },
};

export const dynamic = 'force-dynamic';

export default async function SupportPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const { data: { user } } = await supabase.auth.getUser();

  const { data: tickets } = user ? await db
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5) : { data: null };

  const supportOptions = [
    { icon: MessageSquare, title: 'Live Chat', desc: 'Chat with our support team', href: '/support/chat', available: 'Mon-Fri 9am-5pm EST' },
    { icon: Mail, title: 'Email Support', desc: 'Send us a message', href: '/contact', available: 'Response within 24 hours' },
    { icon: Phone, title: 'Submit a Ticket', desc: 'Get a response within 24 hours', href: '/support/ticket', available: '24/7 Online' },
    { icon: FileText, title: 'Help Articles', desc: 'Browse help articles & guides', href: '/support/help', available: 'Available 24/7' },
    { icon: FileText, title: 'Video Tutorials', desc: 'Step-by-step platform walkthroughs', href: '/help/tutorials', available: 'Available 24/7' },
    { icon: FileText, title: 'Certification Help', desc: 'Guides for earning credentials', href: '/help/articles/certifications', available: 'Available 24/7' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Support' }]} />
        </div>
      </div>

      {/* Hero Image */}
      <section className="relative h-[200px] sm:h-[280px] md:h-[340px] overflow-hidden">
        <Image src="/images/pages/support-page-2.jpg" alt="Student support services" fill sizes="100vw" className="object-cover" priority />
      </section>

      <div className="bg-white text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Student Support Center</h1>
          <p className="text-xl text-brand-blue-100 max-w-2xl">
            Need help with enrollment, training programs, or your student account? 
            Our team is here to support your career journey.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {supportOptions.map((option) => (
            <Link key={option.title} href={option.href} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition text-center">
              <option.icon className="w-10 h-10 text-brand-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">{option.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{option.desc}</p>
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {option.available}
              </div>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <SupportForm />

          <div>
            <h2 className="text-xl font-bold mb-6">Your Recent Tickets</h2>
            {user ? (
              tickets && tickets.length > 0 ? (
                <div className="space-y-4">
                  {tickets.map((ticket: any) => (
                    <div key={ticket.id} className="bg-white rounded-lg shadow-sm border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{ticket.subject}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          ticket.status === 'open' ? 'bg-brand-green-100 text-brand-green-700' :
                          ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-white text-gray-700'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{new Date(ticket.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
                  <LifeBuoy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No support tickets yet</p>
                </div>
              )
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <LifeBuoy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 mb-4">Sign in to view your support tickets</p>
                <Link href="/login?redirect=/support" className="text-brand-blue-600 font-medium hover:underline">
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Common Questions */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Common Questions</h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <details className="bg-white rounded-xl shadow-sm border overflow-hidden group">
              <summary className="p-5 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                How do I reset my password?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-5 text-gray-600">
                Click &quot;Forgot Password&quot; on the login page. Enter your email and we&apos;ll send you a reset link. Check your spam folder if you don&apos;t see it within 5 minutes.
              </div>
            </details>
            
            <details className="bg-white rounded-xl shadow-sm border overflow-hidden group">
              <summary className="p-5 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                How do I check my enrollment status?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-5 text-gray-600">
                Log into your student dashboard and check the &quot;My Programs&quot; section. Your enrollment status will show as Pending, Approved, or Active. Contact us if you have questions.
              </div>
            </details>
            
            <details className="bg-white rounded-xl shadow-sm border overflow-hidden group">
              <summary className="p-5 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                How do I access my course materials?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-5 text-gray-600">
                Once enrolled, log into your student dashboard. Click on your program to access course materials, videos, and assignments. Some programs use external platforms like Milady - check your email for access instructions.
              </div>
            </details>
            
            <details className="bg-white rounded-xl shadow-sm border overflow-hidden group">
              <summary className="p-5 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                How do I log my training hours?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-5 text-gray-600">
                For apprenticeship programs, use the &quot;Log Hours&quot; feature in your student dashboard. Enter your date, hours worked, and activities. Your supervisor will verify the hours.
              </div>
            </details>
            
            <details className="bg-white rounded-xl shadow-sm border overflow-hidden group">
              <summary className="p-5 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                Who do I contact about funding/WIOA?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-5 text-gray-600">
                For WIOA funding questions, contact your WorkOne case manager directly. For general funding questions, email us at our contact form or call (317) 314-3757.
              </div>
            </details>
            
            <details className="bg-white rounded-xl shadow-sm border overflow-hidden group">
              <summary className="p-5 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                What if I need to miss class?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-5 text-gray-600">
                Contact your instructor as soon as possible. Most programs have attendance requirements for funding. We can work with you on makeup options if you communicate early.
              </div>
            </details>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-16 bg-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Still Need Help?</h2>
          <p className="text-slate-400 mb-6">Our support team is available Monday-Friday, 9am-5pm EST</p>
          <div className="flex flex-wrap gap-6 justify-center">
            <div className="text-white">
              <p className="text-sm text-slate-400">Live Chat</p>
              <a href="/support/chat" className="text-lg font-semibold hover:text-brand-blue-400">Chat With Us</a>
            </div>
            <div className="text-white">
              <p className="text-sm text-slate-400">Email</p>
              <a href="/contact" className="text-lg font-semibold hover:text-brand-blue-400">Contact Us</a>
            </div>
            <div className="text-white">
              <p className="text-sm text-slate-400">Submit a Ticket</p>
              <a href="/support/ticket" className="text-lg font-semibold hover:text-brand-blue-400">Open a Ticket</a>
            </div>
          </div>
        </div>
      </div>

      {/* Live Chat Support */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LiveChatSupport />
      </div>
    </div>
  );
}
