import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Integrations,
  description: 'Connect Elevate with your existing tools including Stripe, HRIS systems, job boards, and more.',
};

const integrations = [
  { name: 'Stripe', category: 'Payments', desc: 'Process payments, manage subscriptions, and handle billing seamlessly.' },
  { name: 'Workday', category: 'HRIS', desc: 'Sync student data and credentials with your HR systems.' },
  { name: 'Salesforce', category: 'CRM', desc: 'Integrate with Salesforce for complete student lifecycle management.' },
  { name: 'Adzuna', category: 'Job Boards', desc: 'Publish graduates directly to job boards for career placement.' },
  { name: 'Canvas LMS', category: 'Education', desc: 'Import courses and sync grades with Canvas.' },
  { name: 'Zoom', category: 'Video', desc: 'Schedule and host virtual training sessions and advisor meetings.' },
  { name: 'QuickBooks', category: 'Accounting', desc: 'Sync invoices and payments with QuickBooks.' },
  { name: 'Google Workspace', category: 'Productivity', desc: 'Use Google Classroom, Drive, and Calendar integration.' },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Platform Integrations</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Connect Elevate with the tools you already use. Our open API and pre-built integrations make implementation seamless.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {integrations.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="bg-brand-blue-100 rounded-lg px-3 py-1 text-xs font-medium text-brand-blue-600 w-fit mb-3">{item.category}</div>
                <h3 className="font-bold text-slate-900 mb-2">{item.name}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm mb-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Open API & Webhooks</h2>
            <p className="text-slate-600 text-center max-w-2xl mx-auto mb-8">Our REST API and webhooks let you build custom integrations with any system. Full documentation available for developers.</p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">REST API</h4>
                <p className="text-slate-600 text-sm">Full CRUD operations on all entities</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">Webhooks</h4>
                <p className="text-slate-600 text-sm">Real-time event notifications</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">SDKs</h4>
                <p className="text-slate-600 text-sm">Python, Node.js, and Ruby libraries</p>
              </div>
            </div>
          </div>
          
          <div className="bg-brand-blue-700 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Need a Custom Integration?</h2>
            <p className="text-blue-100 mb-6">Our team can build custom integrations to meet your specific needs.</p>
            <Link href="/contact" className="inline-flex items-center gap-2 bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors">
              Contact Sales <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
