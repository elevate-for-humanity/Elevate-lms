import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Student Resources | Elevate',
  description: 'Access tools, guides, and support for your educational journey.',
};

export default function StudentResourcesPage() {
  const resources = [
    { title: 'Learning Guides', href: 'https://app.elevateforhumanity.org/lms/library', desc: 'Study materials and tutorials' },
    { title: 'Career Services', href: '/career-services', desc: 'Job search and resume help' },
    { title: 'Technical Support', href: '/help', desc: 'Get help with your account' },
    { title: 'Financial Aid', href: '/funding', desc: 'Scholarships and payment plans' },
  ];

  return (
    <main className="min-h-screen bg-white">
      <section className="py-20 px-4 bg-gradient-to-br from-blue-900 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Student Resources</h1>
          <p className="text-xl text-blue-100">Everything you need to succeed in your educational journey.</p>
        </div>
      </section>
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {resources.map((r) => (
            <Link key={r.href} href={r.href} className="p-6 border rounded-xl hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-blue-900 mb-2">{r.title}</h3>
              <p className="text-gray-600">{r.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
