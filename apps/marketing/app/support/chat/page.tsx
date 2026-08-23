export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { Metadata } from 'next';
import Link from 'next/link';
import { MessageCircle, Clock, Phone, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Support Options | Elevate Support',
  description: 'Contact Elevate support by web form, phone, or email.',
};

export default function SupportChatPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg">
          <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-8 h-8 text-brand-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Support Options</h1>
          <p className="text-slate-600 mb-8">
            Choose the support channel that works best for you. Web requests are routed to the support team during business hours.
          </p>
          <div className="space-y-3">
            <Link
              href="/support/contact"
              className="w-full inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Contact Support
            </Link>
            <div className="flex items-center justify-center gap-4 text-sm text-slate-500 mt-6">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Mon-Fri, 8am-6pm EST
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500 mb-4">Need immediate help?</p>
            <div className="flex flex-col gap-2">
              <a href="tel:3173143757" className="inline-flex items-center justify-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 font-medium">
                <Phone className="w-4 h-4" />
                Call (317) 314-3757
              </a>
              <a href="mailto:support@elevateforhumanity.org" className="inline-flex items-center justify-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 font-medium">
                <Mail className="w-4 h-4" />
                Email Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}