import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Workforce Tools',
  keywords: ['AI', 'workforce tools', 'automation', 'job matching', 'career AI'],
  description: 'AI-powered workforce development tools including PARIS career advisor, job matching, resume building, and automated career coaching.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-purple-700 to-indigo-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">AI Workforce Tools</h1>
          <p className="text-xl text-purple-100 max-w-2xl">Powerful AI tools to accelerate career discovery, job matching, and workforce development outcomes.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-purple-100">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">PARIS AI Advisor</h3>
              <p className="text-slate-600 mb-6">Our AI career advisor conducts intelligent interviews, recommends programs, and guides applicants through enrollment — 24/7.</p>
              <ul className="text-sm text-slate-600 space-y-2 mb-6">
                <li>✓ Intelligent screening interviews</li>
                <li>✓ Personalized program recommendations</li>
                <li>✓ Automated enrollment support</li>
                <li>✓ Multi-language support</li>
              </ul>
              <Link href="/ai/paris" className="inline-block bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700">Learn More</Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 border border-indigo-100">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">AI Job Matching</h3>
              <p className="text-slate-600 mb-6">Connect graduates with relevant job openings using AI-powered matching based on skills, credentials, and career goals.</p>
              <ul className="text-sm text-slate-600 space-y-2 mb-6">
                <li>✓ Skills-based matching</li>
                <li>✓ Real-time job feed integration</li>
                <li>✓ Employer candidate recommendations</li>
                <li>✓ Application tracking</li>
              </ul>
              <Link href="/ai/job-match" className="inline-block bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700">Learn More</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Want to integrate AI into your platform?</h2>
          <p className="text-slate-600 mb-6">Our AI tools can be licensed for your workforce development platform.</p>
          <Link href="/contact?type=ai-tools" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Contact Sales</Link>
        </div>
      </section>
    </div>
  );
}
