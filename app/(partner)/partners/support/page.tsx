import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  HelpCircle, MessageSquare, Phone, Mail, FileText, Clock,
  AlertCircle, ArrowRight, BookOpen, Video,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partner Support | Elevate For Humanity',
  description: 'Get help with the partner portal, student management, reporting, and technical issues.',
};

const supportChannels = [
  { icon: Phone, title: 'Partner Support', description: 'Submit a support request and get a response within 24 hours', detail: 'Online Support Portal', href: '/support', cta: 'Get Help' },
  { icon: Mail, title: 'Email Support', description: 'Send us a detailed message', detail: 'info@elevateforhumanity.org', href: 'mailto:info@elevateforhumanity.org', cta: 'Send Email' },
  { icon: MessageSquare, title: 'Live Chat', description: 'Chat with support during business hours', detail: 'Mon-Fri 9am-5pm EST', href: '/support/chat', cta: 'Start Chat' },
  { icon: FileText, title: 'Help Center', description: 'Browse guides and documentation', detail: 'Self-service knowledge base', href: '/docs', cta: 'View Docs' },
];

const commonIssues = [
  { title: 'Student data not loading', solution: 'This is usually an RLS policy mismatch or the user is not assigned to a shop. Contact support with the student ID.' },
  { title: 'Cannot access reports', solution: 'Ensure your account has the correct role permissions. Check Settings > Permissions or contact your admin.' },
  { title: 'Attendance not syncing', solution: 'Verify the student is enrolled in an active program. Try refreshing the page or clearing your browser cache.' },
  { title: 'Payment or funding questions', solution: 'Contact the financial aid team at info@elevateforhumanity.org for funding reconciliation issues.' },
];

export default function PartnerSupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partners', href: '/partners' }, { label: 'Support' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-brand-blue-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-brand-blue-300" />
          <h1 className="text-3xl font-bold mb-2">Partner Support</h1>
          <p className="text-brand-blue-200">We are here to help you succeed. Reach out through any channel below.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Support Channels */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {supportChannels.map((channel, i) => (
            <Link key={i} href={channel.href} className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition text-center">
              <channel.icon className="w-10 h-10 text-brand-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-1">{channel.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{channel.description}</p>
              <p className="text-xs text-gray-500 mb-4">{channel.detail}</p>
              <span className="text-brand-blue-600 font-medium text-sm">{channel.cta} →</span>
            </Link>
          ))}
        </div>

        {/* Business Hours */}
        <div className="bg-white rounded-xl shadow-sm p-6 border mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-brand-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Support Hours</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">Monday - Friday</p>
              <p className="text-gray-600 text-sm">9:00 AM - 5:00 PM EST</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">Saturday</p>
              <p className="text-gray-600 text-sm">10:00 AM - 2:00 PM EST</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">Emergency</p>
              <p className="text-gray-600 text-sm">Email with &quot;URGENT&quot; in subject</p>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-white rounded-xl shadow-sm p-6 border mb-12">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-brand-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">Common Issues & Solutions</h2>
          </div>
          <div className="space-y-4">
            {commonIssues.map((issue, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-1">{issue.title}</h3>
                <p className="text-gray-600 text-sm">{issue.solution}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/docs" className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition flex items-start gap-4">
            <BookOpen className="w-8 h-8 text-brand-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Documentation</h3>
              <p className="text-gray-600 text-sm">Guides for using the partner portal, managing students, and generating reports.</p>
            </div>
          </Link>
          <Link href="/webinars" className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition flex items-start gap-4">
            <Video className="w-8 h-8 text-brand-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Training Webinars</h3>
              <p className="text-gray-600 text-sm">Watch recorded training sessions on platform features and best practices.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
