import { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, MessageCircle, Mail, Phone, Book, Video } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help Center | Elevate for Humanity',
  description: 'Get help with your Elevate account, courses, and training programs.',
};

const topics = [
  { title: 'Getting Started', icon: Book, href: '/help/getting-started', desc: 'Learn how to use the platform' },
  { title: 'Courses & Learning', icon: Video, href: '/help/courses', desc: 'Navigate courses and complete assignments' },
  { title: 'Account Help', icon: HelpCircle, href: '/help/account', desc: 'Reset password, update profile' },
  { title: 'Technical Support', icon: MessageCircle, href: '/help/technical', desc: 'Troubleshoot technical issues' },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Help Center</h1>
          <p className="text-blue-200">Find answers and get support.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {topics.map((topic) => (
              <Link key={topic.href} href={topic.href} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <topic.icon className="w-10 h-10 text-brand-blue-600 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">{topic.title}</h2>
                <p className="text-slate-600 text-sm">{topic.desc}</p>
              </Link>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Contact Support</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Mail className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
                <h3 className="font-bold">Email</h3>
                <p className="text-slate-600 text-sm">support@elevateforhumanity.org</p>
              </div>
              <div className="text-center">
                <Phone className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
                <h3 className="font-bold">Phone</h3>
                <p className="text-slate-600 text-sm">(317) 314-3757</p>
              </div>
              <div className="text-center">
                <MessageCircle className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
                <h3 className="font-bold">Chat</h3>
                <p className="text-slate-600 text-sm">Available 8am-5pm EST</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
