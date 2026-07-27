import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { MessageCircle, BookOpen, GraduationCap, Zap, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Tutor | Elevate for Humanity',
  description: 'Get 24/7 academic support from our AI tutor.',
};

const features = [
  { icon: MessageCircle, title: '24/7 Availability', description: 'Get help anytime, day or night. Our AI tutor is always ready to assist.' },
  { icon: BookOpen, title: 'Course-Specific Help', description: 'Tailored assistance for CNA, HVAC, Barber, CDL, and IT programs.' },
  { icon: GraduationCap, title: 'Step-by-Step Guidance', description: 'Detailed explanations to help you understand difficult concepts.' },
  { icon: Zap, title: 'Instant Responses', description: 'No waiting. Get immediate answers to your questions.' },
];

const subjects = [
  { name: 'Healthcare Fundamentals', topics: ['Patient care', 'Vital signs', 'Medical terminology', 'Clinical skills'] },
  { name: 'HVAC Systems', topics: ['Refrigeration', 'Electrical', 'EPA 608 prep', 'Troubleshooting'] },
  { name: 'Barbering', topics: ['Shaving techniques', 'Hair cutting', 'Client consultation', 'Sanitation'] },
  { name: 'CDL Preparation', topics: ['Pre-trip inspection', ' backing maneuvers', 'Road safety', 'Log books'] },
];

export default function AITutorPage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'AI Tools', href: '/ai' }, { label: 'AI Tutor' }]} />
      
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-bold mb-4">
            <GraduationCap className="w-4 h-4" />
            AI-Powered Learning
          </div>
          <h1 className="text-3xl font-bold mb-4">Your Personal AI Tutor</h1>
          <p className="text-blue-100 max-w-2xl mx-auto mb-6">
            Struggling with a concept? Our AI tutor provides instant, personalized help 24/7 to support your learning journey.
          </p>
          <Link href="/ai/paris" className="inline-block bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50">
            Start Chatting with AI Tutor
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-black mb-6">How the AI Tutor Helps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div key={feature.title} className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black">{feature.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subject Areas */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-black mb-6">Subject Areas Covered</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((subject) => (
              <div key={subject.name} className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-bold text-black mb-3">{subject.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {subject.topics.map((topic) => (
                    <span key={topic} className="px-3 py-1 bg-brand-blue-50 text-brand-blue-700 text-sm rounded-full">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-brand-blue-700 rounded-2xl p-8">
            <Clock className="w-12 h-12 text-white/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Get Help?</h2>
            <p className="text-blue-100 mb-6">
              The AI tutor is available 24/7. No appointments needed.
            </p>
            <Link href="/ai/paris" className="inline-block bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50">
              Chat with AI Tutor Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
