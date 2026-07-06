import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, Eye } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security | Elevate for Humanity',
  description: 'Platform security and data protection policies.',
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-green-700 to-green-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Security</h1>
          <p className="text-green-200">Your data security is our priority.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="flex items-start gap-4">
                <Shield className="w-10 h-10 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Data Protection</h3>
                  <p className="text-slate-600">All student data is encrypted and protected in compliance with FERPA.</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="flex items-start gap-4">
                <Lock className="w-10 h-10 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Secure Authentication</h3>
                  <p className="text-slate-600">Multi-factor authentication and secure session management.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/privacy" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Privacy Policy</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
