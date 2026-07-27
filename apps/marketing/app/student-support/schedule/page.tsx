import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, User, Phone, Mail, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Schedule Tutoring | Student Support',
  description: 'Book tutoring and academic support sessions with our instructors. Get the help you need to succeed.',
};

export default function StudentSupportSchedulePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-red-500 to-brand-orange-500" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-red-500/20 text-brand-red-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Calendar className="w-4 h-4" />
              Student Support
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Schedule a Tutoring Session
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Get one-on-one support from our instructors. Book a session to clarify concepts, review materials, or prepare for exams.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="tel:3173143757" className="inline-flex items-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                <Phone className="w-4 h-4 mr-2" />
                Call to Schedule
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-12">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Contact Us', desc: 'Call or email to request a tutoring session. Tell us what you need help with.' },
              { step: '2', title: 'Get Matched', desc: 'We\'ll connect you with an instructor who specializes in your subject area.' },
              { step: '3', title: 'Schedule & Meet', desc: 'Book a time that works for you. Sessions available in-person or virtual.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">{s.step}</div>
                <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-12">Subjects We Support</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {['Medical Terminology', 'Pharmacology', 'Anatomy & Physiology', 'Math Fundamentals', 'Reading Comprehension', 'Test Prep', 'Study Skills', 'Career Planning'].map((subject) => (
              <div key={subject} className="bg-slate-50 rounded-lg p-4 text-center border border-slate-200">
                <CheckCircle className="w-5 h-5 text-brand-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">{subject}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-brand-blue-50 border-t border-brand-blue-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Get Started?</h2>
          <p className="text-slate-600 mb-8">Contact us to schedule your tutoring session today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:3173143757" className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              <Phone className="w-4 h-4" />
              Call (317) 314-3757
            </a>
            <a href="mailto:tutoring@elevateforhumanity.org" className="inline-flex items-center justify-center gap-2 border-2 border-slate-300 hover:bg-white text-slate-700 font-bold py-4 px-8 rounded-lg transition-colors">
              <Mail className="w-4 h-4" />
              Email Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
