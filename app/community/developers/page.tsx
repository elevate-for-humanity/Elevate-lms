import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Code, BookOpen, Github, FileCode, Terminal, ExternalLink } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/community/developers',
  },
  title: 'Developer Resources | Elevate For Humanity',
  description: 'API documentation, SDKs, and developer tools for integrating with Elevate.',
};

export const dynamic = 'force-dynamic';

export default async function DevelopersPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Get API documentation
  const { data: docs } = await db
    .from('documentation')
    .select('*')
    .eq('category', 'api')
    .eq('is_active', true)
    .order('order', { ascending: true });

  // Get code examples
  const { data: examples } = await db
    .from('code_examples')
    .select('*')
    .eq('is_active', true)
    .limit(4);

  const apiEndpoints = [
    { name: 'Authentication', path: '/api/auth', description: 'User authentication and session management' },
    { name: 'Users', path: '/api/users', description: 'User profile and account management' },
    { name: 'Courses', path: '/api/courses', description: 'Course catalog and enrollment' },
    { name: 'Progress', path: '/api/progress', description: 'Learning progress and completion tracking' },
    { name: 'Certificates', path: '/api/certificates', description: 'Certificate generation and verification' },
    { name: 'Webhooks', path: '/api/webhooks', description: 'Event notifications and integrations' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Community', href: '/community' }, { label: 'Developers' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Code className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Developer Resources</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            API documentation, SDKs, and tools for building on Elevate
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <Link href="/community/communityhub" className="text-brand-blue-600 hover:underline mb-8 inline-block">
          ← Back to Community Hub
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* API Reference */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Terminal className="w-6 h-6 text-slate-700" />
                API Reference
              </h2>
              <div className="bg-white rounded-xl border divide-y">
                {apiEndpoints.map((endpoint, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">{endpoint.name}</h3>
                        <p className="text-sm text-gray-600">{endpoint.description}</p>
                      </div>
                      <code className="text-sm bg-slate-100 px-3 py-1 rounded font-mono">
                        {endpoint.path}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Getting Started */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-slate-700" />
                Getting Started
              </h2>
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-bold mb-4">Quick Start Guide</h3>
                <div className="bg-slate-900 rounded-lg p-4 mb-4">
                  <pre className="text-brand-green-400 text-sm overflow-x-auto">
{`# Install the Elevate SDK
npm install @elevate/sdk

# Initialize the client
import { ElevateClient } from '@elevate/sdk';

const client = new ElevateClient({
  apiKey: process.env.ELEVATE_API_KEY
});`}
                  </pre>
                </div>
                <Link
                  href="/docs/quickstart"
                  className="text-brand-blue-600 font-medium hover:underline"
                >
                  View full documentation →
                </Link>
              </div>
            </section>

            {/* Code Examples */}
            {examples && examples.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <FileCode className="w-6 h-6 text-slate-700" />
                  Code Examples
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {examples.map((example: any) => (
                    <Link
                      key={example.id}
                      href={`/docs/examples/${example.slug}`}
                      className="bg-white rounded-xl p-6 border hover:shadow-md transition"
                    >
                      <h3 className="font-bold mb-2">{example.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{example.description}</p>
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                        {example.language}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <section className="bg-white rounded-xl border p-6">
              <h3 className="font-bold text-lg mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/docs/api" className="flex items-center gap-2 text-brand-blue-600 hover:underline">
                    <BookOpen className="w-4 h-4" />
                    API Documentation
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://github.com/elevateforhumanity" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-brand-blue-600 hover:underline"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <Link href="/docs/changelog" className="flex items-center gap-2 text-brand-blue-600 hover:underline">
                    <FileCode className="w-4 h-4" />
                    Changelog
                  </Link>
                </li>
              </ul>
            </section>

            {/* API Status */}
            <section className="bg-white rounded-xl border p-6">
              <h3 className="font-bold text-lg mb-4">API Status</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 bg-brand-green-500 rounded-full"></span>
                <span className="text-brand-green-700 font-medium">All Systems Operational</span>
              </div>
              <a 
                href="https://status.elevateforhumanity.org" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-blue-600 hover:underline"
              >
                View status page
              </a>
            </section>

            {/* Support */}
            <section className="bg-slate-100 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4">Need Help?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Our developer support team is here to help with integration questions.
              </p>
              <Link
                href="/contact?type=developer"
                className="inline-block bg-slate-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-900 transition"
              >
                Contact Support
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
