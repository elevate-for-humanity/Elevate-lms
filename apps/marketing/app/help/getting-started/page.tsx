import { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, Book, Video } from 'lucide-react';
export const metadata: Metadata = { title: 'Getting Started', keywords: ["get started", "apply", "enroll", "workforce training"], description: 'Learn how to get started with Elevate.' };
export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Getting Started</h1>
          <p className="text-blue-200">Learn how to use the Elevate platform.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Quick Start Guide</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="font-bold mb-2">1. Create an Account</h3>
              <p className="text-slate-600 text-sm">Sign up with your email and verify your account.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="font-bold mb-2">2. Complete Your Profile</h3>
              <p className="text-slate-600 text-sm">Add your information for personalized program recommendations.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="font-bold mb-2">3. Check Eligibility</h3>
              <p className="text-slate-600 text-sm">Verify your funding eligibility for free training.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <h3 className="font-bold mb-2">4. Apply to Programs</h3>
              <p className="text-slate-600 text-sm">Browse programs and submit your application.</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/contact" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Get Started</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
