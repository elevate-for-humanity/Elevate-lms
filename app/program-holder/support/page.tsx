import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, Clock, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Support | Program Holder Portal',
  description: 'Get help and support',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/support',
  },
};

export default async function SupportPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Support" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'program_holder') redirect('/');

  const supportChannels = [
    {
      type: 'Email',
      icon: Mail,
      value: 'our contact form',
      description: 'Response within 24 hours',
      href: 'mailto:our contact form',
      color: 'blue',
    },
    {
      type: 'Phone',
      icon: Phone,
      value: 'support center',
      description: 'Mon-Fri 9am-5pm EST',
      href: 'tel:support center',
      color: 'green',
    },
  ];

  const faqs = [
    {
      question: 'How do I upload required documents?',
      answer:
        'Navigate to the Documents page and use the upload form to submit your business license, insurance, and other required documents.',
      link: '/program-holder/documents',
    },
    {
      question: 'When are reports due?',
      answer:
        'Weekly reports are due every Monday for the previous week. Monthly reports are due by the 5th of each month.',
      link: '/program-holder/reports',
    },
    {
      question: 'How do I check my compliance status?',
      answer:
        'Visit the Compliance Dashboard to view your overall score and any action items that need attention.',
      link: '/program-holder/compliance',
    },
    {
      question: 'How do I manage enrolled students?',
      answer:
        'Go to the Students page to view all enrolled students, track their progress, and manage enrollments.',
      link: '/program-holder/students',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Support" }]} />
        </div>
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/efh/hero/hero-main-clean.jpg"
          alt="Support"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Contact Channels */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {supportChannels.map((channel) => (
                <a
                  key={channel.type}
                  href={channel.href}
                  className={`bg-white rounded-lg shadow-sm border-2 border-${channel.color}-200 p-8 hover:border-${channel.color}-400 transition-colors group`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 bg-${channel.color}-100 rounded-lg`}>
                      <channel.icon
                        className={`h-11 w-11 text-${channel.color}-600`}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-black mb-2">
                        {channel.type}
                      </h3>
                      <p
                        className={`text-lg font-medium text-${channel.color}-600 mb-2`}
                      >
                        {channel.value}
                      </p>
                      <p className="text-sm text-black flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {channel.description}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* FAQs */}
            <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle className="h-11 w-11 text-brand-blue-600" />
                <h2 className="text-2xl font-bold text-black">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border-b pb-6 last:border-b-0 last:pb-0"
                  >
                    <h3 className="text-lg font-semibold text-black mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-black mb-3">{faq.answer}</p>
                    <Link
                      href={faq.link}
                      className="text-brand-blue-600 hover:text-brand-blue-700 font-medium text-sm"
                    >
                      Learn more →
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Resources */}
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-brand-blue-900 mb-4">
                Additional Resources
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Link
                  href="/program-holder/documentation"
                  className="text-brand-blue-900 hover:text-brand-blue-700 font-medium"
                >
                  Documentation →
                </Link>
                <Link
                  href="/program-holder/handbook"
                  className="text-brand-blue-900 hover:text-brand-blue-700 font-medium"
                >
                  Program Handbook →
                </Link>
                <Link
                  href="/program-holder/training"
                  className="text-brand-blue-900 hover:text-brand-blue-700 font-medium"
                >
                  Training Resources →
                </Link>
              </div>
            </div>

            {/* Office Hours */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-black mb-4">
                Office Hours
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-black mb-2">
                    Phone Support
                  </h4>
                  <p className="text-black">
                    Monday - Friday: 9:00 AM - 5:00 PM EST
                  </p>
                  <p className="text-black">Saturday - Sunday: Closed</p>
                </div>
                <div>
                  <h4 className="font-medium text-black mb-2">
                    Email Support
                  </h4>
                  <p className="text-black">
                    24/7 - We respond within 24 hours
                  </p>
                  <p className="text-black">
                    Urgent matters: Call during office hours
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/program-holder/dashboard"
                className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
