import { Metadata } from 'next';
import Link from 'next/link';
import ParisChat from '@/components/paris/ParisChat';
import { GraduationCap, Clock, Shield, Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'PARIS — Career Guidance Interview | Elevate for Humanity',
  description: 'Meet PARIS, your AI career guide. Get personalized recommendations for workforce development programs that match your goals.',
};

export default function ParisPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">Elevate for Humanity</h1>
                <p className="text-xs text-slate-500">Workforce Development</p>
              </div>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/programs" className="text-slate-600 hover:text-purple-600 transition">Programs</Link>
              <Link href="/about" className="text-slate-600 hover:text-purple-600 transition">About</Link>
              <Link href="/apply" className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition">
                Apply Now
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <GraduationCap className="w-4 h-4" />
            AI Career Guidance
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Meet PARIS
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Personalized AI Recruitment, Interview & Success System — Your personal AI career guide
          </p>
          
          {/* Features */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <Clock className="w-8 h-8 text-purple-600 mb-2 mx-auto" />
              <h3 className="font-semibold text-slate-900">24/7 Available</h3>
              <p className="text-sm text-slate-600">Chat anytime that works for you</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <Heart className="w-8 h-8 text-purple-600 mb-2 mx-auto" />
              <h3 className="font-semibold text-slate-900">No Judgment</h3>
              <p className="text-sm text-slate-600">We meet you where you are</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <Shield className="w-8 h-8 text-purple-600 mb-2 mx-auto" />
              <h3 className="font-semibold text-slate-900">Free Service</h3>
              <p className="text-sm text-slate-600">Career guidance at no cost</p>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Section */}
      <section className="pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden h-[600px]">
            <ParisChat />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-slate-900 text-center mb-8">
            How the PARIS Interview Works
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                1
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">Tell Us Your Goals</h4>
              <p className="text-sm text-slate-600">Share what kind of work you want to do</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                2
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">Learn About Options</h4>
              <p className="text-sm text-slate-600">We explain programs and funding</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                3
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">Get Matched</h4>
              <p className="text-sm text-slate-600">Find programs that fit your situation</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                4
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">Take Next Steps</h4>
              <p className="text-sm text-slate-600">Apply and start your journey</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-400">
            © 2024 Elevate for Humanity. A nonprofit workforce development organization.
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Indianapolis, Indiana | admissions@elevateforhumanity.org
          </p>
        </div>
      </footer>
    </div>
  );
}
